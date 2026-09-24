import { Task, TimeBlockCategory } from '../types/hierarchical';

export interface AiTaskSuggestion {
  title: string;
  estimated_hours: number;
  priority: 'high' | 'medium' | 'low';
}

export interface AiScheduleBlockSuggestion {
  title: string;
  start_time: string;
  end_time: string;
  category: TimeBlockCategory;
  notes?: string;
}

export interface AiCoachInsight {
  coach_advice: string;
  strengths: string[];
  action_recommendations: string[];
}

export interface AiJournalAnalysis {
  title: string;
  formatted_content: string;
  mood: 'great' | 'good' | 'calm' | 'neutral' | 'tired' | 'stressed';
  energy_level: 'high' | 'medium' | 'low';
  gratitude: string[];
  wins: string[];
  extracted_tasks: { title: string; priority?: 'high' | 'medium' | 'low'; estimated_hours?: number }[];
  ai_insights: string;
  suggested_tags: string[];
  isFallback?: boolean;
}

export interface AiInboxTriage {
  recommended_destination: 'task' | 'project' | 'vault' | 'habit';
  reasoning: string;
  suggested_pillar_title: string;
  refined_title: string;
  actionable_steps: string[];
  priority: 'high' | 'medium' | 'low';
  isFallback?: boolean;
}

export interface AiVaultSummary {
  executive_summary: string;
  key_takeaways: string[];
  action_items: string[];
  suggested_tags: string[];
  isFallback?: boolean;
}

/**
 * 1. AI Breakdown of a Goal or Project into subtasks
 */
export async function generateAiTaskBreakdown(
  title: string,
  description?: string
): Promise<AiTaskSuggestion[]> {
  try {
    const res = await fetch('/api/ai/breakdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });

    if (!res.ok) {
      throw new Error(`خطأ في استجابة الخادم (${res.status})`);
    }

    const data = await res.json();
    return data.tasks || [];
  } catch (err) {
    console.warn('Fallback to local breakdown heuristic:', err);
    // Intelligent fallback
    return [
      { title: `التخطيط وصياغة متطلبات: ${title}`, estimated_hours: 1.5, priority: 'high' },
      { title: `تنفيذ المخرج الأساسي والمرحلة الأولى`, estimated_hours: 2.5, priority: 'high' },
      { title: `مراجعة وتدقيق الجودة والمخرجات`, estimated_hours: 1, priority: 'medium' },
      { title: `التوثيق النهائي والأرشفة في الخزائن`, estimated_hours: 0.5, priority: 'low' },
    ];
  }
}

/**
 * 2. AI Smart Daily Schedule based on current backlog tasks
 */
export async function generateAiSmartSchedule(
  tasks: Task[],
  date: string
): Promise<AiScheduleBlockSuggestion[]> {
  try {
    const res = await fetch('/api/ai/smart-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks, date }),
    });

    if (!res.ok) {
      throw new Error(`خطأ في استجابة الخادم (${res.status})`);
    }

    const data = await res.json();
    return data.blocks || [];
  } catch (err) {
    console.warn('Fallback to local schedule template:', err);
    return [
      {
        title: tasks[0]?.title ? `تركيز عميق: ${tasks[0].title}` : 'جلسة تركيز عميق 1',
        start_time: '09:00',
        end_time: '10:30',
        category: 'deep_work',
        notes: 'التركيز على أهم مهمة استراتيجية',
      },
      {
        title: 'معالجة صندوق الوارد والمتابعات الإجرائية',
        start_time: '10:45',
        end_time: '11:45',
        category: 'shallow_work',
        notes: 'تخليص الأعمال القصيرة',
      },
      {
        title: tasks[1]?.title ? `تنفيذ: ${tasks[1].title}` : 'جلسة تركيز عميق 2',
        start_time: '12:30',
        end_time: '14:00',
        category: 'deep_work',
        notes: 'إنجاز المخرجات العملية',
      },
      {
        title: 'استراحة وتجديد النشاط',
        start_time: '14:00',
        end_time: '14:45',
        category: 'rest',
        notes: 'فترة نقاهة واستعادة تركيز',
      },
      {
        title: 'قراءة في خزائن المعرفة والتوثيق',
        start_time: '15:00',
        end_time: '16:00',
        category: 'learning',
        notes: 'تسجيل الملاحظات واستخلاص العبر',
      },
    ];
  }
}

/**
 * 3. AI Weekly Coach Insights for weekly review
 */
export async function generateAiCoachReview(
  stats: any,
  pillarNames: string[] = []
): Promise<AiCoachInsight> {
  try {
    const res = await fetch('/api/ai/weekly-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats, pillarNames }),
    });

    if (!res.ok) {
      throw new Error(`خطأ في استجابة الخادم (${res.status})`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Fallback to local coach feedback:', err);
    return {
      coach_advice:
        'أداء رائع ومحفز هذا الأسبوع! التزامك بتسجيل الساعات وحجب أوقات التركيز يعزز تقدمك المستمر نحو الرؤى الكبرى.',
      strengths: [
        'المحافظة على وتيرة عمل منتظمة في المشاريع الأساسية',
        'توزيع الوقت وحجب الساعات للعمل العميق',
      ],
      action_recommendations: [
        'حدد أهم هدفين للأسبوع المقبل وابدأ بهما صباح كل يوم',
        'فرز الأفكار المتراكمة في صندوق الوارد وتوجيهها للمشاريع',
      ],
    };
  }
}

/**
 * 4. AI Voice & Daily Journal Analysis (اليوميات والمذكرات الصوتية)
 */
export async function analyzeVoiceJournal(
  text: string,
  date?: string
): Promise<AiJournalAnalysis> {
  try {
    const res = await fetch('/api/ai/journal-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, date: date || new Date().toISOString().split('T')[0] }),
    });

    if (!res.ok) {
      throw new Error(`خطأ في الاتصال بالخادم (${res.status})`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Fallback to local journal heuristic:', err);
    return {
      title: `تأملات: ${text.slice(0, 30)}...`,
      formatted_content: text,
      mood: 'good',
      energy_level: 'medium',
      gratitude: ['التوفيق والقدرة على السعي', 'الاستقرار الذهني والصحة'],
      wins: ['تدوين الملاحظات والخواطر وتصفية الذهن'],
      extracted_tasks: [
        { title: `متابعة تطبيق خواطر اليوم`, priority: 'medium', estimated_hours: 1 }
      ],
      ai_insights: 'التدوين اليومي يعيد تنظيم الوعي ويمنحك شحنة متجددة من التركيز والإنجاز.',
      suggested_tags: ['يوميات', 'تأمل'],
      isFallback: true,
    };
  }
}

/**
 * 5. AI Inbox Triage
 */
export async function triageInboxIdea(
  title: string,
  content?: string
): Promise<AiInboxTriage> {
  try {
    const res = await fetch('/api/ai/triage-inbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });

    if (!res.ok) {
      throw new Error(`خطأ في الاتصال بالخادم (${res.status})`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Fallback to local triage:', err);
    return {
      recommended_destination: 'task',
      reasoning: 'الفكرة تمثل إجراءً عملياً مباشراً يناسب قائمة المهام التنفيذية.',
      suggested_pillar_title: 'العمل والإنتاجية',
      refined_title: title.startsWith('فكرة') ? title.replace(/^فكرة[:\s-]*/, 'تنفيذ: ') : title,
      actionable_steps: ['تحديد الخطوة الأولى للبدء'],
      priority: 'medium',
      isFallback: true,
    };
  }
}

/**
 * 6. AI Vault Enhancer
 */
export async function enhanceVaultContent(
  title: string,
  content: string,
  type: string = 'notes'
): Promise<AiVaultSummary> {
  try {
    const res = await fetch('/api/ai/enhance-vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, vault_type: type }),
    });

    if (!res.ok) {
      throw new Error(`خطأ في الاتصال بالخادم (${res.status})`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Fallback to local vault enhance:', err);
    return {
      executive_summary: `${title}: مادة معرفية مفيدة تسهم في إثراء المشاريع وتوجيه الأهداف.`,
      key_takeaways: ['التركيز على الفوائد الجوهرية والتطبيق العملي المستمر.'],
      action_items: [`مراجعة نقاط "${title}" وربطها بالمشاريع الحالية.`],
      suggested_tags: ['معرفة', 'ملاحظات'],
      isFallback: true,
    };
  }
}
