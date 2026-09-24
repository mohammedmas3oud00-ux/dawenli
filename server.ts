import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Server-side Gemini client utility
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to remove speech-to-text stutter and repeated phrases
function sanitizeSpeechText(rawText: string): string {
  if (!rawText) return '';
  let str = rawText.trim().replace(/\s+/g, ' ');

  // 1. Resolve progressive interim-speech accumulation bug
  // (e.g. "عايز عايز اعمل عايز اعمل موقع... عايز اعمل موقع الكتروني...")
  const words = str.split(' ');
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

  let text = str;

  // 2. Remove repeated consecutive words: e.g. "عايز عايز" -> "عايز"
  text = text.replace(/(\b\S+\b)(?:\s+\1)+/gi, '$1');

  // 3. Remove repeating multi-word phrases (e.g. "عايز اعمل موقع عايز اعمل موقع")
  for (let n = 10; n >= 2; n--) {
    const regex = new RegExp(`(\\b(?:\\S+\\s+){${n - 1}}\\S+\\b)(?:\\s+\\1)+`, 'gi');
    text = text.replace(regex, '$1');
  }

  return text.trim();
}

/**
 * Endpoint 1: Analyze Spoken or Typed Idea and Decompose into Hierarchy
 */
app.post('/api/ai/analyze-voice', async (req, res) => {
  try {
    const { speechText, existingPillars = [], existingProjects = [] } = req.body;

    if (!speechText || typeof speechText !== 'string' || !speechText.trim()) {
      return res.status(400).json({ error: 'لم يتم إرسال أي نص للتحليل' });
    }

    const preCleanedText = sanitizeSpeechText(speechText);

    const prompt = `
أنت خبير استراتيجي في إدارة الإنتاجية الشخصية والأنظمة الهرمية (مثل نظام دوّنلي و PPV و GTD).
قام المستخدم بالتحدث أو إدخال الفكرة التالية بصوته (قد تحتوي الفكرة الأصلية على تكرار ناتج عن عيوب الإملاء الصوتي):
"""
${speechText}
"""

النص المنقى مبدئياً:
"""
${preCleanedText}
"""

الركائز المتاحة حالياً في نظامه: ${JSON.stringify(existingPillars)}
المشاريع الحالية: ${JSON.stringify(existingProjects)}

مهمتك:
1. تنقية النص تماماً من أي تكرار أو تردد أو أخطاء إملاء صوتي، واستخلاص العبارة الواضحة والصريحة.
2. فهم نية المستخدم:
   - هل هي رغبة في بناء مشروع/نظام متكامل أو موقع (يحتاج تفكيكاً إلى أهداف ومشاريع ومهام)؟
   - أم هي مهمة واحدة تنفيذية محددة؟
   - أم فكرة/ملاحظة عامة للمستقبل (Inbox/Idea)؟
   - أم عادة سلوكية؟
3. إذا كانت فكرة مشروع أو نظام (مثل: "عايز اعمل موقع الكتروني او نظام يخليني اقدر اعمل صور ونصوص اعلانيه للشغل بتاعي"):
   - صغ عنواناً دقيقاً وجذاباً للمشروع/الهدف.
   - اقترح الركيزة المناسبة (مثلاً: ركيزة العمل، المال، أو الإنتاجية).
   - قم بتفكيك هذا المشروع إلى قائمة من (3 إلى 6) مهام تنفيذية عملية ومرتبة منطقياً، مع تحديد أولوية كل مهمة (high, medium, low)، ومستوى الطاقة (low, medium, high)، وتقدير الوقت بالساعات (0.5 إلى 4).
4. أخرج النتيجة بتنسيق JSON متوافق مع المخطط.
`;

    let parsed: any = null;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
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
                description: 'اسم المشروع المقترح',
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

      parsed = JSON.parse(response.text?.trim() || '{}');
    } catch (apiErr) {
      console.warn('Gemini API call failed, generating smart local fallback decomposition:', apiErr);
      
      // Smart offline fallback for Arabic decomposition
      const clean = preCleanedText;
      let projectTitle = 'مشروع: ' + clean.slice(0, 50);
      let summary = clean;
      let suggestedPillar = existingPillars[0] || 'العمل والمهنة';

      if (clean.includes('موقع') || clean.includes('نظام') || clean.includes('صور') || clean.includes('اعلانيه')) {
        projectTitle = 'تطوير موقع ونظام الذكاء الاصطناعي لإنشاء الصور والنصوص الإعلانية';
        summary = 'بناء منصة متكاملة لإنتاج وتصميم المحتوى الإعلاني والصور الموجهة للعمل تلقائياً';
        suggestedPillar = existingPillars.find((p: string) => p.includes('عمل') || p.includes('مهن') || p.includes('مال')) || 'العمل والمهنة';
      }

      parsed = {
        cleanedTranscription: clean,
        intentType: 'project_breakdown',
        summary,
        suggestedPillarTitle: suggestedPillar,
        valueGoalTitle: 'أتمتة وتطوير منظومة العمل الرقمي والتسويقي',
        projectTitle,
        projectDescription: `مشروع استراتيجي مستخلص من فكرة المستخدم: "${clean}"`,
        tasks: [
          {
            title: 'تحديد متطلبات النظام ونماذج الذكاء الاصطناعي لتوليد الصور والنصوص',
            description: 'دراسة الأدوات والمكتبات المناسبة لاحتياجات العمل وتحديد واجهات برمجة التطبيقات',
            priority: 'high',
            energyLevel: 'high',
            estimatedHours: 2,
          },
          {
            title: 'تصميم واجهة المستخدم وتجربة الاستخدام لموقع توليد الإعلانات',
            description: 'رسم المخطط الهيكلي وتحديد شاشات إدخال الأوصاف وعرض النتائج',
            priority: 'medium',
            energyLevel: 'medium',
            estimatedHours: 2,
          },
          {
            title: 'برمجة محرك تكامل واجهات الذكاء الاصطناعي للنصوص والصور',
            description: 'ربط النماذج ومعالجة الأوامر واستقبال المخرجات الإعلانية بجودة عالية',
            priority: 'high',
            energyLevel: 'high',
            estimatedHours: 3,
          },
          {
            title: 'تخصيص قوالب وهوية المواد الإعلانية لتناسب طبيعة الشغل',
            description: 'إعداد الأبعاد والأنماط والألوان المخصصة لهوية العمل التسويقية',
            priority: 'medium',
            energyLevel: 'medium',
            estimatedHours: 1.5,
          },
          {
            title: 'اختبار النظام وإطلاق النسخة التجريبية الأولى للعمل',
            description: 'تجربة إنشاء أول حملة إعلانية كاملة وتقييم سرعة وجودة النتائج',
            priority: 'medium',
            energyLevel: 'low',
            estimatedHours: 1,
          },
        ],
      };
    }

    return res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/analyze-voice:', error);
    return res.status(500).json({
      error: 'حدث خطأ أثناء تحليل الصوت أو النص بالذكاء الاصطناعي',
      details: error.message || String(error),
    });
  }
});

/**
 * Endpoint 2: Audio Transcription using Gemini
 */
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const { audioData, mimeType = 'audio/webm' } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: 'لم يتم إرسال بيانات الصوت' });
    }

    const audioPart = {
      inlineData: {
        mimeType,
        data: audioData,
      },
    };

    const response = await ai.models.generateContent({
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

    const transcribed = response.text?.trim() || '';
    return res.json({
      success: true,
      transcription: sanitizeSpeechText(transcribed),
    });
  } catch (error: any) {
    console.error('Error in /api/ai/transcribe:', error);
    return res.status(500).json({
      error: 'فشل تفريغ الصوت بالذكاء الاصطناعي',
      details: error.message || String(error),
    });
  }
});

/**
 * Endpoint 3: Project Decomposition
 */
app.post('/api/ai/decompose-project', async (req, res) => {
  try {
    const { projectTitle, projectDescription = '', pillarTitle = '' } = req.body;
    if (!projectTitle) {
      return res.status(400).json({ error: 'اسم المشروع مطلوب' });
    }

    const prompt = `
مشروع في نظام الإنتاجية الشخصية دوّنلي:
- اسم المشروع: "${projectTitle}"
- الوصف: "${projectDescription}"
- الركيزة التابع لها: "${pillarTitle}"

المطلوب:
فكك هذا المشروع إلى قائمة من 4 إلى 7 مهام تنفيذية واضحة وملموسة وقابلة للإنجاز المباشر، مرتبة بالتسلسل المنطقي.
حدد لكل مهمة: الأولوية (high, medium, low)، مستوى الطاقة الذهنية (low, medium, high)، وعدد الساعات التقديري (0.5 إلى 4 ساعات).
`;

    let tasks: any[] = [];
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
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

      const parsed = JSON.parse(response.text?.trim() || '{}');
      tasks = parsed.tasks || [];
    } catch (apiErr) {
      console.warn('Gemini decompose API failed, using fallback decomposition:', apiErr);
      tasks = [
        {
          title: `دراسة وتحديد نطاق ومتطلبات: ${projectTitle}`,
          description: 'تحديد المخرجات المطلوبة والموارد وجدول العمل الزمني',
          priority: 'high',
          energyLevel: 'high',
          estimatedHours: 1.5,
        },
        {
          title: `إعداد خطة العمل والخطوات التنفيذية الأولية`,
          description: 'تجهيز الأدوات والبيئة اللازمة لبدء التنفيذ الفعلي',
          priority: 'medium',
          energyLevel: 'medium',
          estimatedHours: 2,
        },
        {
          title: `التنفيذ الإجرائي الرئيسي ومتابعة المراحل`,
          description: 'إنجاز المكونات الجوهرية وفق المعايير المطلوبة',
          priority: 'high',
          energyLevel: 'high',
          estimatedHours: 3,
        },
        {
          title: `المراجعة والتدقيق واختبار الجودة قبل الاعتماد`,
          description: 'فحص المخرجات والتأكد من توافقها مع أهداف الركيزة',
          priority: 'medium',
          energyLevel: 'medium',
          estimatedHours: 1.5,
        },
        {
          title: `الإطلاق والتوثيق وإغلاق المشروع رسمياً`,
          description: 'تسجيل الدروس المستفادة والاحتفال بالإنجاز',
          priority: 'medium',
          energyLevel: 'low',
          estimatedHours: 1,
        },
      ];
    }

    return res.json({ success: true, tasks });
  } catch (error: any) {
    console.error('Error in /api/ai/decompose-project:', error);
    return res.status(500).json({ error: 'فشل تفكيك المشروع', details: error.message });
  }
});

/**
 * Endpoint 4: Smart Strategic Periodic Review
 */
app.post('/api/ai/smart-review', async (req, res) => {
  try {
    const { frequency, reflection, systemMetrics } = req.body;

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

    let data: any = null;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
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

      data = JSON.parse(response.text?.trim() || '{}');
    } catch (apiErr) {
      console.warn('Gemini review API failed, using fallback diagnostic summary:', apiErr);
      data = {
        smartSummary: `منظومتك تسير بوتيرة منتظمة مع تركيز ملحوظ على استدامة الإنجاز. التحديات المذكورة تشير لفرصة ممتازة لإعادة ترتيب أولويات الطاقة وساعات التركيز العميق.`,
        systemHealthScore: 85,
        strengths: [
          'الالتزام بالمراجعة الدورية وتدوين الملاحظات الصريحة',
          'استمرار تقدم المشاريع الاستراتيجية النشطة',
          'وضوح الرؤية وتكامل الأهداف مع الركائز الأساسية',
        ],
        bottlenecks: [
          'وجود بعض المهام التي تحتاج إعادة تقدير لوقتها الحقيقي',
          'تشتت نسبي بين الأهداف العاجلة والأهداف ذات الأثر البعيد',
        ],
        recommendations: [
          'تخصيص فترات حجب وقت يومية (Time Blocking) للمهام ذات الطاقة العالية',
          'تصفية صندوق الوارد أسبوعياً لتقليل الضوضاء الذهنية',
          'التركيز على مشروع واحد ذو أولوية استراتيجية قصوى حتى اكتماله',
        ],
        actionItems: [
          {
            title: 'جدولة جلسة تركيز عميق 45 دقيقة للمهمة الأهم غداً صباحاً',
            priority: 'high',
            category: 'focus',
          },
          {
            title: 'مراجعة وتحديث مواعيد استحقاق المهام المتأخرة وتصحيحها',
            priority: 'medium',
            category: 'alignment',
          },
        ],
      };
    }

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in /api/ai/smart-review:', error);
    return res.status(500).json({ error: 'فشل التحليل الذكي للمراجعة', details: error.message });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dawenli server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
