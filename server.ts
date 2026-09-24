import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '4.4mb' }));

function getAiClient(customKey: string) {
  const apiKey = customKey.trim();
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Robust model cascade list prioritized by availability and quota
const MODEL_CASCADE = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.6-flash',
  'gemini-3-flash-preview',
];

function safeParseJson(text: string): any {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  try {
    return JSON.parse(cleaned.trim());
  } catch (e) {
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (err) {}
    }
    return null;
  }
}

// Normalizer helpers for priority and energy
function normalizePriority(val: any): 'high' | 'medium' | 'low' {
  if (!val) return 'medium';
  const str = String(val).toLowerCase();
  if (str.includes('high') || str.includes('عالي') || str.includes('قصوى') || str.includes('مهم')) return 'high';
  if (str.includes('low') || str.includes('منخفض') || str.includes('هادئ')) return 'low';
  return 'medium';
}

function normalizeEnergy(val: any): 'high' | 'medium' | 'low' {
  if (!val) return 'medium';
  const str = String(val).toLowerCase();
  if (str.includes('high') || str.includes('عالي') || str.includes('شديد')) return 'high';
  if (str.includes('low') || str.includes('منخفض') || str.includes('بسيط')) return 'low';
  return 'medium';
}

/**
 * Resilient content generator that tries preferred models with retries
 */
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
  maxRetries?: number;
  customKey?: string;
}): Promise<any> {
  const models = params.preferredModel 
    ? [params.preferredModel, ...MODEL_CASCADE.filter(m => m !== params.preferredModel)]
    : MODEL_CASCADE;

  if (!params.customKey) throw new Error('Gemini authorization key is required');
  const client = getAiClient(params.customKey);
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after 12000ms on model ${model}`)), 12000)
        );
        const apiPromise = client.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });

        const response: any = await Promise.race([apiPromise, timeoutPromise]);
        if (response && response.text) {
          return { response, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const isTransient = err.status === 503 || err.status === 429 || err.message?.includes('high demand') || err.message?.includes('Timeout');
        if (isTransient && attempt === 0) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        break; // try next model in cascade
      }
    }
  }

  throw lastError || new Error('تعذر معالجة الطلب عبر نماذج الذكاء الاصطناعي حالياً');
}

type ApiErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'PAYLOAD_TOO_LARGE' | 'RATE_LIMITED' | 'UPSTREAM_ERROR' | 'NOT_CONFIGURED';

function apiError(res: express.Response, status: number, code: ApiErrorCode, message: string) {
  return res.status(status).json({ ok: false, error: { code, message, requestId: randomUUID() } });
}

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const authClient = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } }) : null;
const localRateLimits = new Map<string, { count: number; resetAt: number }>();

async function requireAiAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!authClient) return apiError(res, 503, 'NOT_CONFIGURED', 'خدمة المصادقة غير مهيأة.');
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const geminiKey = typeof req.headers['x-gemini-api-key'] === 'string' ? req.headers['x-gemini-api-key'].trim() : '';
  if (!token || !geminiKey) return apiError(res, 401, 'UNAUTHORIZED', 'الجلسة ومفتاح Gemini المؤقت مطلوبان.');
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return apiError(res, 401, 'UNAUTHORIZED', 'جلسة المستخدم غير صالحة أو منتهية.');

  const now = Date.now();
  const current = localRateLimits.get(data.user.id);
  const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + 60_000 } : current;
  if (bucket.count >= 20) return apiError(res, 429, 'RATE_LIMITED', 'تم بلوغ حد الطلبات المؤقت. حاول بعد دقيقة.');
  bucket.count += 1;
  localRateLimits.set(data.user.id, bucket);
  res.locals.userId = data.user.id;
  res.locals.geminiKey = geminiKey;
  next();
}

app.use('/api/ai', requireAiAuth);

// Helper to remove speech-to-text stutter and repeated phrases (Unicode safe for Arabic)
function sanitizeSpeechText(rawText: string): string {
  if (!rawText) return '';
  let str = rawText.trim().replace(/\s+/g, ' ');

  const words = str.split(' ').filter(Boolean);
  if (words.length <= 1) return str;

  // 1. Resolve progressive interim-speech accumulation bug
  if (words.length > 5) {
    const startWord = words[0];
    const startIndices: number[] = [];
    for (let i = 0; i < words.length; i++) {
      if (words[i] === startWord) startIndices.push(i);
    }
    if (startIndices.length >= 3) {
      const segments: string[] = [];
      for (let s = 0; s < startIndices.length; s++) {
        const start = startIndices[s];
        const end = s + 1 < startIndices.length ? startIndices[s + 1] : words.length;
        segments.push(words.slice(start, end).join(' '));
      }
      const longest = segments.reduce((max, seg) => (seg.length > max.length ? seg : max), '');
      if (longest.length > 15) {
        str = longest;
      }
    }
  }

  // 2. Remove immediate consecutive duplicate words
  const cleanTokens: string[] = [];
  const currentTokens = str.split(' ').filter(Boolean);
  for (let i = 0; i < currentTokens.length; i++) {
    if (i === 0 || currentTokens[i] !== currentTokens[i - 1]) {
      cleanTokens.push(currentTokens[i]);
    }
  }

  // 3. Remove repeating multi-word phrases (from 8 words down to 2)
  let result = cleanTokens;
  for (let phraseLen = Math.min(8, Math.floor(result.length / 2)); phraseLen >= 2; phraseLen--) {
    const compacted: string[] = [];
    let i = 0;
    while (i < result.length) {
      if (i + 2 * phraseLen <= result.length) {
        const p1 = result.slice(i, i + phraseLen).join(' ');
        const p2 = result.slice(i + phraseLen, i + 2 * phraseLen).join(' ');
        if (p1 === p2) {
          compacted.push(...result.slice(i, i + phraseLen));
          i += 2 * phraseLen;
          continue;
        }
      }
      compacted.push(result[i]);
      i++;
    }
    result = compacted;
  }

  return result.join(' ').trim();
}

/**
 * Endpoint 1: Analyze Spoken or Typed Idea and Decompose into Hierarchy (Text & Voice Analysis)
 */
async function handleAnalyzeInput(req: express.Request, res: express.Response) {
  try {
    const rawInput = req.body.speechText || req.body.text || req.body.prompt;
    const existingPillars = req.body.existingPillars || [];
    const existingProjects = req.body.existingProjects || [];
    const customKey = res.locals.geminiKey as string;

    if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
      return apiError(res, 400, 'BAD_REQUEST', 'لم يتم إرسال أي نص للتحليل.');
    }

    const preCleanedText = sanitizeSpeechText(rawInput);

    const prompt = `
أنت خبير استراتيجي في إدارة الإنتاجية الشخصية والأنظمة الهرمية لنظام دوّنلي (الركائز ← الرؤى ← أهداف القيمة ← المشاريع ← المهام التنفيذية).
قام المستخدم بإدخال أو التحدث بالفكرة التالية:
"""
${rawInput}
"""

النص المنقى من التأتأة وعيوب الإملاء:
"""
${preCleanedText}
"""

الركائز المتاحة حالياً في نظامه: ${JSON.stringify(existingPillars)}
المشاريع الحالية: ${JSON.stringify(existingProjects)}

مهمتك:
1. تنقية النص تماماً من أي تردد أو أخطاء، وصياغة فكرة واضحة ومحددة.
2. فهم نية المستخدم:
   - هل هي بناء مشروع أو مبادرة متعددة الخطوات؟ (project_breakdown)
   - أم مهمة إجرائية مفردة؟ (single_task)
   - أم فكرة أو معلومة للأرشيف؟ (idea_note)
   - أم عادة سلوكية يومية؟ (habit)
3. صياغة عنوان ملهم ومباشر للمشروع مستوحى بدقة من موضوع المستخدم نفسه.
4. اقتراح الركيزة الأنسب من بين الركائز المتاحة.
5. تفكيك الفكرة إلى 3 إلى 6 مهام عملية، قابلة للإنجاز الفوري ومحددة بدقة لموضوع المستخدم، مع تحديد الأولوية (high, medium, low)، ومستوى الطاقة (low, medium, high)، والوقت التقديري بالساعات (0.5 إلى 4).
`;

    const { response, modelUsed } = await generateContentWithFallback({
      contents: prompt,
      customKey,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cleanedTranscription: {
              type: Type.STRING,
              description: 'النص العربي المنقى تماماً من أي تكرار أو عيوب إملاء صوتي',
            },
            intentType: {
              type: Type.STRING,
              description: 'تصنيف النية: project_breakdown أو single_task أو habit أو idea_note',
            },
            summary: {
              type: Type.STRING,
              description: 'ملخص موجز ومركز للفكرة في جملة واحدة',
            },
            suggestedPillarTitle: {
              type: Type.STRING,
              description: 'اسم الركيزة الأنسب لاحتضان هذا العمل',
            },
            valueGoalTitle: {
              type: Type.STRING,
              description: 'عنوان هدف القيمة الاستراتيجي المرتبط',
            },
            projectTitle: {
              type: Type.STRING,
              description: 'اسم المشروع المقترح بدقة من صلب فكرة المستخدم',
            },
            projectDescription: {
              type: Type.STRING,
              description: 'وصف موجز للمشروع وأثره',
            },
            tasks: {
              type: Type.ARRAY,
              description: 'قائمة المهام التنفيذية المستخلصة',
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'عنوان المهمة الإجرائي' },
                  description: { type: Type.STRING, description: 'وصف تفصيلي مبسط للمهمة' },
                  priority: { type: Type.STRING, description: 'high, medium, or low' },
                  energyLevel: { type: Type.STRING, description: 'low, medium, or high' },
                  estimatedHours: { type: Type.NUMBER, description: 'تقدير الوقت بالساعات' },
                },
                required: ['title', 'priority', 'energyLevel', 'estimatedHours'],
              },
            },
          },
          required: ['cleanedTranscription', 'intentType', 'summary', 'projectTitle', 'tasks'],
        },
      },
    });

    const parsed = safeParseJson(response.text);
    if (!parsed || !parsed.tasks) {
      throw new Error('فشل تنسيق استجابة الذكاء الاصطناعي إلى هيكل صحيح');
    }

    // Normalize task priorities and energy levels
    parsed.tasks = (parsed.tasks || []).map((t: any) => ({
      title: t.title || 'مهمة جديدة',
      description: t.description || '',
      priority: normalizePriority(t.priority),
      energyLevel: normalizeEnergy(t.energyLevel),
      estimatedHours: Number(t.estimatedHours) || 1,
    }));

    return res.json({ ok: true, data: { ...parsed, modelUsed } });
  } catch (error: any) {
    console.error('Error in analyze handler');
    return apiError(res, 502, 'UPSTREAM_ERROR', 'فشل تحليل النص بالذكاء الاصطناعي.');
  }
}

app.post('/api/ai/analyze-voice', handleAnalyzeInput);
app.post('/api/ai/analyze-text', handleAnalyzeInput);

/**
 * Endpoint 2: Audio Transcription using Gemini
 */
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const { audioData, mimeType = 'audio/webm' } = req.body;
    if (!audioData) {
      return apiError(res, 400, 'BAD_REQUEST', 'لم يتم إرسال بيانات الصوت.');
    }
    if (typeof audioData !== 'string' || audioData.length > 4 * 1024 * 1024) {
      return apiError(res, 413, 'PAYLOAD_TOO_LARGE', 'حجم التسجيل يتجاوز الحد الآمن 3MB.');
    }
    const client = getAiClient(res.locals.geminiKey as string);

    const audioPart = {
      inlineData: {
        mimeType,
        data: audioData,
      },
    };

    let transcribed = '';
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            {
              text: 'قم بتفريغ هذا التسجيل الصوتي بدقة عالية باللغة العربية. إذا كان هناك كلمات مكررة بسبب التأتأة أو التردد قم بإزالتها واكتب النص السليم مباشرة.',
            },
          ],
        },
      });
      transcribed = response.text?.trim() || '';
    } catch (primaryErr) {
      console.warn('Primary transcribe model failed, trying fallback:', primaryErr);
      const fallback = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            audioPart,
            {
              text: 'فرغ هذا التسجيل الصوتي بدقة إلى نص عربي واضح ونقي من التكرار.',
            },
          ],
        },
      });
      transcribed = fallback.text?.trim() || '';
    }

    return res.json({ ok: true, data: { transcription: sanitizeSpeechText(transcribed) } });
  } catch (error: any) {
    console.error('Error in /api/ai/transcribe');
    return apiError(res, 502, 'UPSTREAM_ERROR', 'فشل تفريغ الصوت بالذكاء الاصطناعي.');
  }
});

/**
 * Endpoint 3: Project Decomposition
 */
app.post('/api/ai/decompose-project', async (req, res) => {
  try {
    const { projectTitle, projectDescription = '', pillarTitle = '' } = req.body;
    const customKey = res.locals.geminiKey as string;
    if (!projectTitle) {
      return apiError(res, 400, 'BAD_REQUEST', 'اسم المشروع مطلوب.');
    }

    const prompt = `
مشروع في نظام الإنتاجية الشخصية دوّنلي:
- اسم المشروع: "${projectTitle}"
- الوصف: "${projectDescription}"
- الركيزة التابع لها: "${pillarTitle}"

المطلوب:
فكك هذا المشروع إلى قائمة من 4 إلى 6 مهام تنفيذية واضحة وملموسة وقابلة للإنجاز المباشر، مرتبة بالتسلسل المنطقي.
حدد لكل مهمة: الأولوية (high, medium, low)، مستوى الطاقة الذهنية (low, medium, high)، وعدد الساعات التقديري (0.5 إلى 4 ساعات).
`;

    const { response, modelUsed } = await generateContentWithFallback({
      contents: prompt,
      customKey,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  energyLevel: { type: Type.STRING },
                  estimatedHours: { type: Type.NUMBER },
                },
                required: ['title', 'priority', 'energyLevel', 'estimatedHours'],
              },
            },
          },
          required: ['tasks'],
        },
      },
    });

    const parsed = safeParseJson(response.text);
    if (!parsed || !Array.isArray(parsed.tasks)) {
      throw new Error('فشل تنسيق المهام المفككة بالذكاء الاصطناعي');
    }

    const tasks = parsed.tasks.map((t: any) => ({
      title: t.title || 'مهمة فرعية',
      description: t.description || '',
      priority: normalizePriority(t.priority),
      energyLevel: normalizeEnergy(t.energyLevel),
      estimatedHours: Number(t.estimatedHours) || 1.5,
    }));

    return res.json({ ok: true, data: { tasks, modelUsed } });
  } catch (error: any) {
    console.error('Error in /api/ai/decompose-project');
    return apiError(res, 502, 'UPSTREAM_ERROR', 'فشل تفكيك المشروع.');
  }
});

/**
 * Endpoint 4: Smart Strategic Periodic Review
 */
app.post('/api/ai/smart-review', async (req, res) => {
  try {
    const { frequency, reflection, systemMetrics } = req.body;
    const customKey = res.locals.geminiKey as string;

    const prompt = `
أنت مستشار استراتيجي شخصي يحلل أداء المستخدم ضمن نظام الإنتاجية الهرمي (دوّنلي).
نوع المراجعة: ${frequency} (يومية / أسبوعية / شهرية / ربع سنوية / سنوية)

تأملات وإجابات المستخدم:
- الإنجازات والانتصارات: "${reflection?.wins || 'لم تذكر'}"
- التحديات والمعوقات: "${reflection?.challenges || 'لم تذكر'}"
- الدروس المستفادة: "${reflection?.lessons || 'لم تذكر'}"
- التزامات الفترة القادمة: "${reflection?.next_commitments || 'لم تذكر'}"

إحصائيات المنظومة الحالية:
${JSON.stringify(systemMetrics || {}, null, 2)}

قدم تحليلاً استراتيجياً عميقاً ومشجعاً باللغة العربية يتضمن:
1. ملخص تنفيذي وتشخيص لحالة الإنتاجية.
2. نقاط القوة والإشادات (3 نقاط).
3. المعوقات والاختناقات الحقيقية (2-3 نقاط).
4. توصيات عملية قابلة للتطبيق الفوري (3 توصيات).
5. إجراءات مقترحة محددة (2-4 مهام) مع أولوية لتصحيح المسار فوراً.
`;

    const { response, modelUsed } = await generateContentWithFallback({
      contents: prompt,
      customKey,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            smartSummary: { type: Type.STRING },
            systemHealthScore: { type: Type.NUMBER, description: 'درجة صحة النظام من 0 إلى 100' },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            bottlenecks: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ['title', 'priority', 'category'],
              },
            },
          },
          required: ['smartSummary', 'systemHealthScore', 'strengths', 'bottlenecks', 'recommendations', 'actionItems'],
        },
      },
    });

    const data = safeParseJson(response.text);
    if (!data || !data.smartSummary) {
      throw new Error('فشل تنسيق نتائج المراجعة الاستراتيجية');
    }

    if (data.actionItems) {
      data.actionItems = data.actionItems.map((a: any) => ({
        ...a,
        priority: normalizePriority(a.priority),
      }));
    }

    return res.json({ ok: true, data: { ...data, modelUsed } });
  } catch (error: any) {
    console.error('Error in /api/ai/smart-review');
    return apiError(res, 502, 'UPSTREAM_ERROR', 'فشل التحليل الذكي للمراجعة.');
  }
});

/**
 * Endpoint 5: AI Analysis for GTD Inbox Items
 * Evaluates an inbox item and recommends whether it belongs in Tasks, Projects, Vaults, or Habits
 */
app.post('/api/ai/analyze-inbox', async (req, res) => {
  try {
    const { title, content = '', url = '', pillars = [], projects = [] } = req.body;
    const customKey = res.locals.geminiKey as string;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return apiError(res, 400, 'BAD_REQUEST', 'عنوان العنصر مطلوب للتحليل.');
    }

    const prompt = `
أنت خبير في معالجة صندوق الوارد وفق منهجية GTD ونظام دوّنلي الهرمي.
قام المستخدم بالتقاط العنصر التالي في صندوق الوارد:
- العنوان: "${title}"
- المحتوى/الملاحظة: "${content}"
- الرابط المرجعي: "${url}"

الركائز المتاحة في النظام: ${JSON.stringify(pillars.map((p: any) => ({ id: p.id, title: p.title })))}
المشاريع المتاحة: ${JSON.stringify(projects.map((pr: any) => ({ id: pr.id, title: pr.title, goal_id: pr.goal_id })))}

المطلوب بدقة:
1. صنف هذا العنصر إلى أحد المسارات التالية:
   - "task": مهمة تنفيذية واحدة محددة قابلة للإنجاز المباشر.
   - "project": مبادرة مركبة تتطلب خطوات متعددة ووقت أطول.
   - "vault": معلومة مرجعية، ملخص، مقال، أو ملاحظة للمستقبل (خزائن المعرفة).
   - "habit": سلوك متكرر أو روتين يومي/أسبوعي يرغب في بنائه.
2. اقترح الركيزة المناسبة من بين الركائز المتاحة (أعد معرف الركيزة pillar_id واسمها).
3. إذا كان المسار task أو project، اقترح المشروع الأنسب إن وجد، أو اقترح اسماً لمشروع جديد.
4. اقترح أولوية (high, medium, low) ومستوى طاقة مطلوب (high, medium, low).
5. صغ عنواناً إجرائياً محسناً يبدأ بفعل أمر أو وصف واضح (actionableTitle).
6. قدم تعليلاً استراتيجياً موجزاً في جملة واحدة (reasoning).
`;

    const { response, modelUsed } = await generateContentWithFallback({
      contents: prompt,
      customKey,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedDestination: {
              type: Type.STRING,
              description: 'task أو project أو vault أو habit',
            },
            actionableTitle: {
              type: Type.STRING,
              description: 'عنوان محسن ومباشر للعنصر',
            },
            suggestedPillarId: {
              type: Type.STRING,
              description: 'معرف الركيزة الأنسب إن أمكن مطابقتها',
            },
            suggestedPillarTitle: {
              type: Type.STRING,
              description: 'اسم الركيزة المقترحة',
            },
            suggestedProjectId: {
              type: Type.STRING,
              description: 'معرف المشروع المقترح إن وجد',
            },
            suggestedProjectTitle: {
              type: Type.STRING,
              description: 'اسم المشروع المقترح أو اسم مشروع جديد',
            },
            priority: {
              type: Type.STRING,
              description: 'high أو medium أو low',
            },
            energyLevel: {
              type: Type.STRING,
              description: 'high أو medium أو low',
            },
            estimatedMinutes: {
              type: Type.NUMBER,
              description: 'تقدير الدقائق التقريبية لإنجازها إن كانت مهمة',
            },
            category: {
              type: Type.STRING,
              description: 'تصنيف إضافي مثلاً: تعلم، تنفيذ، تسوق، قراءة، فكرة',
            },
            reasoning: {
              type: Type.STRING,
              description: 'سبب اختيار هذا التصنيف في جملة واحدة واضحة',
            },
          },
          required: ['suggestedDestination', 'actionableTitle', 'suggestedPillarTitle', 'priority', 'reasoning'],
        },
      },
    });

    const parsed = safeParseJson(response.text);
    if (!parsed || !parsed.suggestedDestination) {
      throw new Error('فشل تنسيق نتيجة تحليل صندوق الوارد');
    }

    // Validate destination
    let dest = parsed.suggestedDestination.toLowerCase();
    if (!['task', 'project', 'vault', 'habit'].includes(dest)) {
      dest = 'task';
    }

    parsed.suggestedDestination = dest;
    parsed.priority = normalizePriority(parsed.priority);
    parsed.energyLevel = normalizeEnergy(parsed.energyLevel);

    return res.json({ ok: true, data: { ...parsed, modelUsed } });
  } catch (error: any) {
    console.error('Error in /api/ai/analyze-inbox');
    return apiError(res, 502, 'UPSTREAM_ERROR', 'فشل تحليل عنصر صندوق الوارد بالذكاء الاصطناعي.');
  }
});

/**
 * Endpoint 6: Prayer Times & Adhan Schedule
 * Provides accurate daily prayer times via Aladhan API with server-side caching & fallback
 */
let cachedPrayerTimes: { date: string; data: any } | null = null;

app.get('/api/prayer-times', async (req, res) => {
  try {
    const lat = req.query.lat ? Number(req.query.lat) : 30.0444;
    const lng = req.query.lng ? Number(req.query.lng) : 31.2357;
    const city = req.query.city ? String(req.query.city) : '';
    const country = req.query.country ? String(req.query.country) : '';

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      return apiError(res, 400, 'BAD_REQUEST', 'إحداثيات الموقع غير صالحة.');
    }
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
    const cacheKey = `${todayStr}_${lat}_${lng}_${city}_${country}`;

    if (cachedPrayerTimes && cachedPrayerTimes.date === cacheKey) {
      return res.json({ ok: true, data: cachedPrayerTimes.data });
    }

    let url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=5`; // Egyptian General Authority of Survey or Umm Al-Qura
    if (city && country) {
      url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=5`;
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      throw new Error(`Aladhan API responded with status ${response.status}`);
    }

    const json = await response.json();
    const timings = json?.data?.timings || {};

    const cleanTimings = {
      Fajr: timings.Fajr?.slice(0, 5) || '04:30',
      Sunrise: timings.Sunrise?.slice(0, 5) || '05:55',
      Dhuhr: timings.Dhuhr?.slice(0, 5) || '12:00',
      Asr: timings.Asr?.slice(0, 5) || '15:25',
      Maghrib: timings.Maghrib?.slice(0, 5) || '18:05',
      Isha: timings.Isha?.slice(0, 5) || '19:25',
      date: json?.data?.date?.readable || todayStr,
      hijri: json?.data?.date?.hijri?.date || '',
      hijriMonthArabic: json?.data?.date?.hijri?.month?.ar || '',
    };

    cachedPrayerTimes = {
      date: cacheKey,
      data: cleanTimings,
    };

    return res.json({ ok: true, data: cleanTimings });
  } catch (error: any) {
    console.warn('Failed to fetch accurate prayer times');
    return apiError(res, 502, 'UPSTREAM_ERROR', 'تعذر جلب مواقيت الصلاة الدقيقة. فعّل الموقع أو حاول لاحقًا.');
  }
});

app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const bodyError = error as { type?: string; status?: number };
  if (bodyError.type === 'entity.too.large' || bodyError.status === 413) {
    apiError(res, 413, 'PAYLOAD_TOO_LARGE', 'حجم الطلب يتجاوز الحد المسموح.');
    return;
  }
  if (req.path.startsWith('/api/')) {
    apiError(res, 400, 'BAD_REQUEST', 'صيغة الطلب غير صالحة.');
    return;
  }
  next(error);
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const productionMode = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error('PORT must be a valid TCP port.');
  if (productionMode && !authClient) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY (or VITE equivalents) are required.');
  if (!productionMode) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dawenli server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    console.error('Failed to start Dawenli server:', error);
    process.exitCode = 1;
  });
}

export default app;
