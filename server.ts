import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Google GenAI instance
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Candidate models in order of priority (per gemini-api skill)
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

/**
 * Robust caller with model failover and retry for transient errors (503 UNAVAILABLE, 429, etc.)
 */
async function generateWithModelFallback(contents: string, config: any = { responseMimeType: 'application/json' }): Promise<string> {
  if (!ai) {
    throw new Error('لم يتم تكوين مفتاح GEMINI_API_KEY');
  }

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const status = err?.status || err?.code;
        const isTransient =
          status === 503 ||
          status === 'UNAVAILABLE' ||
          status === 429 ||
          status === 'RESOURCE_EXHAUSTED' ||
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('429');

        console.warn(`[Gemini AI] Model ${model} attempt ${attempt} failed: ${errMsg}`);

        if (isTransient && attempt < 2) {
          // Brief pause before retrying the same model
          await new Promise((resolve) => setTimeout(resolve, 600));
        } else {
          // Switch to the next fallback model candidate
          break;
        }
      }
    }
  }

  throw lastError;
}

// =========================================================================
// AI ROUTES (with resilient multi-tier fallback)
// =========================================================================

/**
 * 1. Smart Breakdown: Breaks an objective or project into actionable subtasks
 */
app.post('/api/ai/breakdown', async (req, res) => {
  const { title, description, context } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'العنوان مطلوب لتوليد المهام' });
  }

  try {
    const prompt = `أنت خبير إنتاجية وإدارة مشاريع وفق منهجية دوّنلي (نظام هرمي للإنتاجية).
المستخدم لديه هدف أو مشروع بعنوان: "${title}".
الوصف أو السياق: "${description || context || 'لا يوجد وصف إضافي'}".

قم بتفكيك هذا الهدف أو المشروع إلى 3 إلى 5 مهام عمل تنفيذية دقيقة ومباشرة (Actionable Subtasks).
أجب فقط بصيغة JSON صالحة مطابقة للنمط التالي دون أي شروح أو نصوص خارج الـ JSON:
{
  "tasks": [
    {
      "title": "عنوان المهمة باللغة العربية (واضح ويبدأ بفعل)",
      "estimated_hours": 1.5,
      "priority": "high"
    }
  ]
}`;

    const outputText = await generateWithModelFallback(prompt);
    const parsed = JSON.parse(outputText);
    return res.json(parsed);
  } catch (error: any) {
    console.warn('AI Breakdown model call fallback activated:', error?.message || error);
    // Intelligent graceful heuristic fallback tailored directly to the title
    return res.json({
      tasks: [
        { title: `التخطيط وصياغة متطلبات: ${title}`, estimated_hours: 1.5, priority: 'high' },
        { title: `تنفيذ المرحلة الأولى والمسودة الأساسية`, estimated_hours: 2.5, priority: 'high' },
        { title: `المراجعة والتحسين والتحقق من الجودة`, estimated_hours: 1, priority: 'medium' },
        { title: `التسليم النهائي أو التوثيق في الخزائن`, estimated_hours: 0.5, priority: 'low' },
      ],
      isFallback: true,
    });
  }
});

/**
 * 2. Smart Schedule: Distributes tasks across daily time blocks
 */
app.post('/api/ai/smart-schedule', async (req, res) => {
  const { tasks = [], date, availableHoursStart = '08:30', availableHoursEnd = '17:00' } = req.body;

  // Fallback generator helper using actual task backlog
  const generateTailoredSchedule = () => {
    const validTasks = Array.isArray(tasks) ? tasks : [];
    const t1 = validTasks[0]?.title ? `تركيز عميق: ${validTasks[0].title}` : 'جلسة تركيز عميق 1: أهم مهمة استراتيجية';
    const t2 = validTasks[1]?.title ? `تنفيذ مركز: ${validTasks[1].title}` : 'جلسة تركيز عميق 2: تنفيذ ومخرجات عملية';
    const t3 = validTasks[2]?.title ? `متابعة وإنجاز: ${validTasks[2].title}` : 'مراجعة ختامية وتوثيق الإنجاز في دوّنلي';

    return {
      blocks: [
        {
          title: t1,
          start_time: '09:00',
          end_time: '10:30',
          category: 'deep_work',
          notes: 'حماية كاملة من المقاطعات والتركيز على المخرج الرئيسي',
        },
        {
          title: 'معالجة صندوق الوارد والتواصل الإجرائي',
          start_time: '10:45',
          end_time: '11:45',
          category: 'shallow_work',
          notes: 'ردود سريعة وتصفية المهام الصغيرة',
        },
        {
          title: t2,
          start_time: '12:30',
          end_time: '14:00',
          category: 'deep_work',
          notes: 'إنتاجية وتطبيق فعلي للمهام الأساسية',
        },
        {
          title: 'استراحة وتجديد طاقة ونشاط',
          start_time: '14:00',
          end_time: '14:45',
          category: 'rest',
          notes: 'فترة نقاهة واستعادة النشاط الذهني',
        },
        {
          title: t3,
          start_time: '15:00',
          end_time: '16:00',
          category: 'learning',
          notes: 'توثيق التقدم في خزائن المعرفة',
        },
      ],
      isFallback: true,
    };
  };

  try {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.json(generateTailoredSchedule());
    }

    const tasksSummary = tasks
      .slice(0, 8)
      .map((t: any, i: number) => `${i + 1}. [${t.priority || 'medium'}] ${t.title} (${t.estimated_hours || 1} ساعة)`)
      .join('\n');

    const prompt = `أنت منظم يومي ذكي ومساعد حجب الوقت (Time Blocking AI Coach).
التاريخ: ${date || 'اليوم'}.
نافذة العمل المتاحة: من ${availableHoursStart} إلى ${availableHoursEnd}.
قائمة المهام المطلوب إنجازها:
${tasksSummary}

قم بتصميم جدول كتل زمنية محكم وواقعي لليوم يوازن بين التركيز العميق (deep_work)، المهام الإجرائية (shallow_work)، والاستراحات المناسبة (rest).
التصنيفات المسموحة للكتل: "deep_work", "shallow_work", "meeting", "health_habit", "learning", "rest", "personal".
أجب فقط بـ JSON صالح يتبع النمط التالي بدقة:
{
  "blocks": [
    {
      "title": "عنوان الكتلة الزمنية",
      "start_time": "09:00",
      "end_time": "10:30",
      "category": "deep_work",
      "notes": "نصيحة ذهنية أو هدف الكتلة"
    }
  ]
}`;

    const outputText = await generateWithModelFallback(prompt);
    const parsed = JSON.parse(outputText);
    return res.json(parsed);
  } catch (error: any) {
    console.warn('AI Smart-schedule model call fallback activated:', error?.message || error);
    // Graceful fallback returns tailored schedule instead of throwing 500 error
    return res.json(generateTailoredSchedule());
  }
});

/**
 * 3. AI Weekly Coach Review
 */
app.post('/api/ai/weekly-coach', async (req, res) => {
  const { stats, pillarNames = [] } = req.body;

  const defaultCoachResponse = {
    coach_advice: 'أداء متميز ومحفز هذا الأسبوع! لقد حققت تقدماً ملموساً في المهام الأساسية. نوصي بتخصيص جلسات تركيز مبكرة الأسبوع القادم للمشاريع ذات الأولوية المرتفعة.',
    strengths: ['استمرارية ملحوظة في تسجيل ساعات الإنجاز', 'تنوع متوازن في كتل الوقت اليومية'],
    action_recommendations: ['اختر أهم مشروعين فقط للأسبوع القادم وحافظ على حجب أوقات الصباح لها', 'جدولة مراجعة سريعة لصندوق الأفكار'],
    isFallback: true,
  };

  try {
    const prompt = `أنت مستشار استراتيجي وموجه إنتاجية ذكي لنظام دوّنلي الهرمي.
بيانات أداء المستخدم:
- المهام المكتملة: ${stats?.completedTasks || 0} من أصل ${stats?.totalTasks || 0}
- المشاريع النشطة: ${stats?.activeProjects || 0}
- نسبة التقدم التراكمي العام: ${stats?.overallTaskProgress || 0}%
- ساعات العمل المسجلة: ${stats?.totalLoggedHours || 0} ساعة
- الركائز ومجالات الحياة: ${pillarNames.join(', ') || 'متنوعة'}

اكتب تقريراً تحفيزياً وموجهاً استراتيجياً موجزاً وملهماً باللغة العربية الفصحى الجميلة والعملية.
أجب فقط بصيغة JSON:
{
  "coach_advice": "فقرة تقييم ونصح استراتيجي مركزة ومحفزة",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "action_recommendations": ["توصية عملية 1 للأسبوع القادم", "توصية عملية 2"]
}`;

    const outputText = await generateWithModelFallback(prompt);
    const parsed = JSON.parse(outputText);
    return res.json(parsed);
  } catch (error: any) {
    console.warn('AI Weekly Coach model call fallback activated:', error?.message || error);
    return res.json(defaultCoachResponse);
  }
});

/**
 * 4. AI Voice & Daily Journal Analysis (اليوميات والمذكرات الصوتية)
 */
app.post('/api/ai/journal-analyze', async (req, res) => {
  const { text = '', date = new Date().toISOString().split('T')[0] } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'النص الصوتي أو المكتوب مطلوب للتحليل' });
  }

  const cleanText = text.trim();

  // Local heuristic fallback generator in case of network/demand issues
  const fallbackJournal = {
    title: `تأملات ومذكرات: ${cleanText.slice(0, 35)}...`,
    formatted_content: cleanText,
    mood: 'good',
    energy_level: 'medium',
    gratitude: ['التوفيق والقدرة على مواصلة المسير', 'لحظات الهدوء والإنتاجية'],
    wins: ['تدوين اليوميات وتصفية الذهن', 'إنجاز محطات اليوم'],
    extracted_tasks: [
      { title: 'متابعة الخطوة التالية لما تم ذكره في المذكرات', priority: 'medium', estimated_hours: 1 }
    ],
    ai_insights: 'المداومة على التدوين اليومي تفكك التوتر وتمنحك وضوحاً فائقاً لترتيب أولويات الغد.',
    suggested_tags: ['يوميات', 'تأمل', 'إنتاجية'],
    isFallback: true,
  };

  try {
    const prompt = `أنت خبير في الكتابة التأملية وعلم النفس الإيجابي وإدارة الإنتاجية في تطبيق "دوّنلي".
قام المستخدم بتسجيل صوته أو كتابة يومياته وخاطرته لهذا اليوم (${date}):
"""
${cleanText}
"""

مهمتك:
1. صياغة عنوان ملهم وموجز يعبر عن اليوم ("title").
2. إعادة تنسيق وصياغة أفكاره بأسلوب أدبي مرتب ومريح للقراءة مع فقرات واضحة ("formatted_content").
3. استنتاج الحالة المزاجية ("mood": إما "great", "good", "calm", "neutral", "tired", "stressed").
4. استنتاج مستوى الطاقة ("energy_level": إما "high", "medium", "low").
5. استخلاص أي نقاط امتنان أو نعم ذكرها أو لمّح لها ("gratitude": مصفوفة نصوص قصيرة).
6. استخلاص أي إنجازات أو انتصارات يومية ("wins": مصفوفة نصوص).
7. استخلاص أي مهام أو التزامات عملية نوى فعلها لتحويلها لمهام في التطبيق ("extracted_tasks": مصفوفة تحتوي { "title", "priority" ("high"|"medium"|"low"), "estimated_hours" }).
8. كتابة تأمل واستبصار حكيم ومحفز ("ai_insights": فقرة دافئة وقصيرة).
9. وسوم مقترحة ("suggested_tags": مصفوفة من 2-4 وسوم).

أجب فقط بـ JSON صالح يتبع النمط التالي:
{
  "title": "عنوان ملهم",
  "formatted_content": "النص المنسق للمذكرات...",
  "mood": "calm",
  "energy_level": "medium",
  "gratitude": ["نقطة 1", "نقطة 2"],
  "wins": ["إنجاز 1"],
  "extracted_tasks": [
    { "title": "عنوان المهمة", "priority": "medium", "estimated_hours": 1 }
  ],
  "ai_insights": "كلمة توجيه واستبصار ملهمة",
  "suggested_tags": ["يوميات", "عمل"]
}`;

    const outputText = await generateWithModelFallback(prompt);
    const parsed = JSON.parse(outputText);
    return res.json(parsed);
  } catch (error: any) {
    console.warn('AI Journal Analyze model call fallback activated:', error?.message || error);
    return res.json(fallbackJournal);
  }
});

/**
 * 5. AI Inbox Triage & Smart Categorizer (فرز وتصنيف الأفكار)
 */
app.post('/api/ai/triage-inbox', async (req, res) => {
  const { title = '', content = '' } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'العنوان مطلوب للفرز' });
  }

  const fallbackTriage = {
    recommended_destination: 'task',
    reasoning: 'الفكرة تمثل إجراءً عملياً محدداً يناسب قائمة المهام التنفيذية.',
    suggested_pillar_title: 'العمل والإنتاجية',
    refined_title: title.startsWith('فكرة') ? title.replace(/^فكرة[:\s-]*/, 'تنفيذ: ') : title,
    actionable_steps: ['تحديد الخطوة الأولى للبدء', 'تحديد المتطلبات الأساسية'],
    priority: 'medium',
    isFallback: true,
  };

  try {
    const prompt = `أنت نظام ذكي لفرز وتصنيف الأفكار وفق منهجية GTD و PPV في تطبيق دوّنلي.
المستخدم التقط هذه الفكرة أو الخاطرة في صندوق الوارد:
- العنوان: "${title}"
- التفاصيل: "${content || 'لا يوجد تفاصيل إضافية'}"

قم بتحليل الفكرة وتحديد:
1. إلى أين تنتمي الفكرة ("recommended_destination": إما "task" (مهمة منفردة), "project" (مشروع يتطلب عدة خطوات), "vault" (ملاحظة معرفية أو مرجع للقراءة), أو "habit" (سلوك متكرر)).
2. سبب التصنيف بإيجاز ("reasoning").
3. أنسب مجال من مجالات الحياة ("suggested_pillar_title": مثلاً "العمل والمهنة", "الصحة والجسد", "التطوير الذاتي والتعلم", "العائلة والمجتمع", "الروحانيات").
4. صياغة عنوان منقح يبدأ بفعل أمر أو تنفيذ ("refined_title").
5. خطوات عملية مقترحة للتنفيذ ("actionable_steps": مصفوفة نصوص).
6. الأولوية المقترحة ("priority": "high", "medium", "low").

أجب فقط بصيغة JSON:
{
  "recommended_destination": "task",
  "reasoning": "سبب التصنيف",
  "suggested_pillar_title": "العمل والمهنة",
  "refined_title": "عنوان منقح",
  "actionable_steps": ["خطوة 1", "خطوة 2"],
  "priority": "medium"
}`;

    const outputText = await generateWithModelFallback(prompt);
    const parsed = JSON.parse(outputText);
    return res.json(parsed);
  } catch (error: any) {
    console.warn('AI Inbox Triage model call fallback activated:', error?.message || error);
    return res.json(fallbackTriage);
  }
});

/**
 * 6. AI Vault Synthesizer & Note Summarizer (تكثيف وتلخيص الخزائن المعرفية)
 */
app.post('/api/ai/enhance-vault', async (req, res) => {
  const { title = '', content = '', vault_type = 'notes' } = req.body;

  const fallbackEnhance = {
    executive_summary: `${title}: مادة معرفية مفيدة تركز على التطبيق العملي وبناء الأفكار.`,
    key_takeaways: [
      'التركيز على الفوائد الجوهرية وتطبيقها في المشاريع الواقعية.',
      'الربط المستمر بين الأفكار ومجالات الحياة ذات الصلة.',
    ],
    action_items: [
      `مراجعة ملاحظات "${title}" ودمجها في أولويات الأسبوع القادم.`
    ],
    suggested_tags: ['معرفة', 'تلخيص'],
    isFallback: true,
  };

  try {
    const prompt = `أنت محلل معرفي وباحث استراتيجي في تطبيق دوّنلي.
لديك عنصر في الخزينة المعرفية:
- العنوان: "${title}"
- النوع: "${vault_type}"
- المحتوى:
"""
${content || title}
"""

قم بتحليل المادة واستخلاص:
1. ملخص تنفيذي مكثف ("executive_summary": فقرة مركزة من 2-3 أسطر).
2. أهم 3 فوائد أو مبادئ جوهرية ("key_takeaways": مصفوفة 3 نصوص).
3. تطبيقات وإجراءات عملية يمكن للمستخدم فعلها فوراً ("action_items": مصفوفة 2-3 إجراءات).
4. وسوم مقترحة ("suggested_tags": مصفوفة وسوم).

أجب فقط بصيغة JSON:
{
  "executive_summary": "الملخص...",
  "key_takeaways": ["فائدة 1", "فائدة 2", "فائدة 3"],
  "action_items": ["إجراء 1", "إجراء 2"],
  "suggested_tags": ["وسم 1", "وسم 2"]
}`;

    const outputText = await generateWithModelFallback(prompt);
    const parsed = JSON.parse(outputText);
    return res.json(parsed);
  } catch (error: any) {
    console.warn('AI Vault Enhance model call fallback activated:', error?.message || error);
    return res.json(fallbackEnhance);
  }
});

// =========================================================================
// VITE DEV SERVER / STATIC ASSETS
// =========================================================================
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
