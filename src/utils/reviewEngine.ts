import { 
  Pillar, 
  Vision, 
  ValueGoal, 
  Project, 
  Task, 
  ReviewFrequency, 
  SystemReview, 
  SystemReviewSnapshot,
  ReviewActionItem 
} from '../types/hierarchical';
import { toLocalDateKey } from './date';

/**
 * Calculates a live diagnostic snapshot of the entire productivity system.
 */
export function generateSystemSnapshot(
  pillars: Pillar[],
  visions: Vision[],
  goals: ValueGoal[],
  projects: Project[],
  tasks: Task[],
  focusPillarId?: string | null
): SystemReviewSnapshot {
  const relevantProjects = focusPillarId 
    ? projects.filter(p => {
        const goal = goals.find(g => g.id === p.goal_id);
        return goal && goal.pillar_id === focusPillarId;
      })
    : projects;

  const relevantProjectIds = new Set(relevantProjects.map(p => p.id));
  const relevantTasks = focusPillarId
    ? tasks.filter(t => relevantProjectIds.has(t.project_id))
    : tasks;

  const todayStr = toLocalDateKey();

  const tasksCompleted = relevantTasks.filter(t => t.status === 'done').length;
  const tasksPending = relevantTasks.length - tasksCompleted;
  const tasksOverdue = relevantTasks.filter(t => 
    t.status !== 'done' && t.due_date && t.due_date < todayStr
  ).length;

  const projectsActive = relevantProjects.filter(p => p.status === 'in_progress').length;

  const relevantPillars = focusPillarId ? pillars.filter((pillar) => pillar.id === focusPillarId) : pillars;
  const totalProgress = relevantPillars.length > 0
    ? Math.round(relevantPillars.reduce((acc, p) => acc + (p.progress || 0), 0) / relevantPillars.length)
    : 0;

  const pillarDistribution = relevantPillars.map(p => ({
    pillar_id: p.id,
    pillar_title: p.title,
    progress: p.progress || 0,
  }));

  const sortedByProgress = [...relevantPillars].sort((a, b) => (b.progress || 0) - (a.progress || 0));
  const topActivePillar = sortedByProgress[0]?.title;
  const laggingPillar = sortedByProgress[sortedByProgress.length - 1]?.title;

  return {
    tasks_completed_count: tasksCompleted,
    tasks_pending_count: tasksPending,
    tasks_overdue_count: tasksOverdue,
    projects_active_count: projectsActive,
    overall_completion_rate: totalProgress,
    pillar_distribution: pillarDistribution,
    top_active_pillar: topActivePillar,
    lagging_pillar: laggingPillar,
  };
}

/**
 * Calculates the automated System Health Score (0 - 100)
 */
export function calculateSystemHealthScore(snapshot: SystemReviewSnapshot): number {
  let score = 70; // baseline

  // Completion rate positive impact
  score += Math.round((snapshot.overall_completion_rate / 100) * 20);

  // Overdue penalty
  if (snapshot.tasks_overdue_count > 0) {
    score -= Math.min(25, snapshot.tasks_overdue_count * 5);
  }

  // Active projects balance
  if (snapshot.projects_active_count >= 1 && snapshot.projects_active_count <= 6) {
    score += 10;
  } else if (snapshot.projects_active_count > 6) {
    score -= 10; // Overwhelmed / dispersed focus
  }

  return Math.min(100, Math.max(10, score));
}

/**
 * Smart Automated Audit Engine:
 * Analyzes the system state and returns automated insights, bottlenecks, strengths, and recommendations.
 */
export function generateAutomatedAudit(
  frequency: ReviewFrequency,
  pillars: Pillar[],
  visions: Vision[],
  goals: ValueGoal[],
  projects: Project[],
  tasks: Task[],
  focusPillarId?: string | null
): {
  system_health_score: number;
  smart_summary: string;
  strengths: string[];
  bottlenecks: string[];
  recommendations: string[];
  suggested_actions: ReviewActionItem[];
} {
  const snapshot = generateSystemSnapshot(pillars, visions, goals, projects, tasks, focusPillarId);
  const healthScore = calculateSystemHealthScore(snapshot);

  const strengths: string[] = [];
  const bottlenecks: string[] = [];
  const recommendations: string[] = [];
  const suggested_actions: ReviewActionItem[] = [];

  const topPillar = pillars.find(p => p.title === snapshot.top_active_pillar);
  const lagPillar = pillars.find(p => p.title === snapshot.lagging_pillar);

  // Strengths analysis
  if (snapshot.tasks_completed_count > 0) {
    strengths.push(`إنجاز ${snapshot.tasks_completed_count} مهمة بنجاح، مما يعكس استمرارية التنفيذ على الأرض.`);
  }
  if (topPillar && topPillar.progress > 40) {
    strengths.push(`زخم ممتاز في ركيزة «${topPillar.title}» بنسبة تقدم بلغت ${topPillar.progress}%.`);
  }
  if (snapshot.tasks_overdue_count === 0 && tasks.length > 0) {
    strengths.push('انضباط زمني مثالي: لا توجد أي مهام متأخرة عن موعدها المحدد.');
  }

  // Bottlenecks & Warnings
  if (snapshot.tasks_overdue_count > 0) {
    bottlenecks.push(`رصد ${snapshot.tasks_overdue_count} مهمة متأخرة تتطلب إعادة جدولة أو حسماً فورياً.`);
  }
  if (lagPillar && lagPillar.progress < 25 && pillars.length > 1) {
    bottlenecks.push(`ركيزة «${lagPillar.title}» تسجل نسبة تقدم منخفضة (${lagPillar.progress}%) مما قد يشير لفجوة تركيز.`);
  }
  if (snapshot.projects_active_count > 5) {
    bottlenecks.push(`تشتت محتمل: يوجد ${snapshot.projects_active_count} مشاريع نشطة بالتوازي، مما يقلل من سرعة الإنجاز.`);
  }

  // Recommendations according to frequency
  if (frequency === 'daily') {
    recommendations.push('حدد غداً مهمة واحدة رئيسية ذات أثر حاسم قبل البدء بالمهام الروتينية.');
    if (snapshot.tasks_overdue_count > 0) {
      recommendations.push('قم بتصفية المهام المتأخرة إما بتنفيذها أو تأجيلها بتاريخ صريح لمنع التراكم الذهني.');
    }
    recommendations.push('خصص جلسة تركيز عميق لمدة 45 دقيقة للمشروع الأكثر أهمية.');
    
    // Suggested actions
    suggested_actions.push({
      id: `act-${Date.now()}-1`,
      title: 'مراجعة وتصفية المهام المتأخرة لليوم',
      priority: 'high',
      project_id: projects[0]?.id,
    });
  } else if (frequency === 'weekly') {
    recommendations.push('قم بتثبيت أولويات الأسبوع القادم في المشروعات التنفيذية ومطابقتها مع أهداف القيمة.');
    if (lagPillar) {
      recommendations.push(`أدرج مشروعاً أو مهمة ذات شأن تحت ركيزة «${lagPillar.title}» لإعادة التوازن لمجالات حياتك.`);
    }
    recommendations.push('احرص على ألا يزيد عدد المشاريع النشطة عن 3 إلى 4 مشاريع في وقت واحد.');

    suggested_actions.push({
      id: `act-${Date.now()}-2`,
      title: `تنشيط خطة العمل تحت ركيزة ${lagPillar?.title || 'الأساسية'}`,
      priority: 'medium',
      project_id: projects[0]?.id,
    });
  } else if (frequency === 'monthly') {
    recommendations.push('فحص أهداف القيمة: هل المشاريع الحالية تقربك فعلياً من تحقيق أرقام ومستهدفات الشهر؟');
    recommendations.push('أرشفة المشاريع المكتملة وتجديد مصفوفة الأولويات للشهر القادم.');
    recommendations.push('مراجعة مؤشرات الأداء الحقيقية مقابل الأهداف الموضوعة مسبقاً.');

    suggested_actions.push({
      id: `act-${Date.now()}-3`,
      title: 'إعادة موازنة أهداف القيمة وتحديث تواريخ الاستحقاق',
      priority: 'high',
      project_id: projects[0]?.id,
    });
  } else if (frequency === 'quarterly') {
    recommendations.push('مراجعة الرؤى الاستراتيجية: هل المسار الحالي يقودك للصورة المنشودة في الأفق الزمني؟');
    recommendations.push('تقييم ربع سنوي للعادات الكبرى ونظام التشغيل الشخصي وإجراء التعديلات الهيكلية اللازمة.');
    recommendations.push('إيقاف أو تحويل المبادرات غير المجدية لتركيز الموارد على المشاريع ذات العائد الأعلى.');

    suggested_actions.push({
      id: `act-${Date.now()}-4`,
      title: 'جلسة تخطيط استراتيجي لربع السنة القادم ومراجعة الرؤى',
      priority: 'high',
      project_id: projects[0]?.id,
    });
  } else {
    // Yearly
    recommendations.push('مراجعة الغايات الكبرى لكافة الركائز والتأكد من توافق البوصلة الداخلية.');
    recommendations.push('الاحتفاء بالمحطات الكبرى المنجزة خلال العام وتدوين الدروس التأسيسية التي شكّلت خبرتك.');
    recommendations.push('صياغة الرؤى والمشاريع التحولية للعام القادم وفق التسلسل الهرمي الصاعد.');

    suggested_actions.push({
      id: `act-${Date.now()}-5`,
      title: 'إعادة صياغة الخارطة الهرمية للعام الجديد',
      priority: 'high',
      project_id: projects[0]?.id,
    });
  }

  // Summary Text
  const frequencyLabel = 
    frequency === 'daily' ? 'اليومية' :
    frequency === 'weekly' ? 'الأسبوعية' :
    frequency === 'monthly' ? 'الشهرية' :
    frequency === 'quarterly' ? 'الربع سنوية' : 'السنوية';

  const smartSummary = `تشير المراجعة ${frequencyLabel} الآلية إلى حالة نظام عامة بمؤشر ${healthScore}/100. إجمالي تقدم الركائز يبلغ ${snapshot.overall_completion_rate}% مع إنجاز ${snapshot.tasks_completed_count} مهمة. ${
    snapshot.tasks_overdue_count > 0 
      ? `يُنصح بمعالجة ${snapshot.tasks_overdue_count} مهمة متأخرة بأسرع وقت.` 
      : 'تسير وتيرة العمل بانضباط زمني سليم.'
  } ${
    lagPillar ? `يُستحسن توجيه بعض الانتباه لركيزة «${lagPillar.title}».` : ''
  }`;

  return {
    system_health_score: healthScore,
    smart_summary: smartSummary,
    strengths,
    bottlenecks,
    recommendations,
    suggested_actions,
  };
}

/**
 * Creates default seed reviews across all 5 frequencies
 */
export function getInitialSeedReviews(
  pillars: Pillar[],
  visions: Vision[],
  goals: ValueGoal[],
  projects: Project[],
  tasks: Task[]
): SystemReview[] {
  const frequencies: ReviewFrequency[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
  const today = new Date();
  
  const formatDate = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return toLocalDateKey(d);
  };

  return [
    {
      id: 'rev-daily-1',
      frequency: 'daily',
      date: formatDate(0),
      title: 'المراجعة اليومية المسائية — حصيلة الإنجاز والأثر',
      rating: 9,
      focus_pillar_id: pillars[0]?.id || null,
      wins: 'إنجاز قراءة الفصلين الأول والثاني من كتاب العادات، والانتهاء من إعداد مصفوفة المبيعات.',
      challenges: 'بعض التشتت في فترة الظهيرة بسبب رسائل البريد والإشعارات.',
      lessons: 'بدء المهام الأكثر صعوبة في الساعتين الأولى من الصباح يرفع الإنتاجية بنسبة مضاعفة.',
      next_commitments: 'التركيز على مراجعة التدريب العملي لـ Taager وإتمام خطة الأسبوع.',
      notes: 'شعور عام بالرضا والسكينة الذهنية بعد إغلاق المهام اليومية.',
      snapshot: generateSystemSnapshot(pillars, visions, goals, projects, tasks, pillars[0]?.id),
      system_health_score: 88,
      smart_summary: 'أداء يومي مرتفع، تم إنجاز معظم المهام المخططة بدون تأخير، مع استقرار ممتاز في الركائز الأساسية.',
      strengths: ['انضباط عالي في تنفيذ المهام الصباحية', 'صفر مهام متأخرة لليوم'],
      bottlenecks: ['فترة هبوط التركيز بعد الظهيرة تحتاج جدولة استراحة ذكية'],
      recommendations: ['حدد أهم 3 مهام لغدك قبل النوم', 'إغلاق الإشعارات أثناء جلسة التركيز'],
      action_items: [
        { id: 'act-d-1', title: 'تجهيز مساحة العمل وتحديد المهمة الصباحية الأهم', priority: 'high', is_converted: false }
      ],
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'rev-weekly-1',
      frequency: 'weekly',
      date: formatDate(3),
      title: 'المراجعة الأسبوعية للأسبوع 38 — إعادة موازنة الركائز',
      rating: 8,
      focus_pillar_id: null,
      wins: 'تقدم كبير في مشروع التدريب العملي ونمو واضح في أهداف ركيزة بناء الذات.',
      challenges: 'تأخر بسيط في إتمام التمارين الرياضية الخاصة بركيزة الصحة.',
      lessons: 'جدولة مواعيد الصحة والرياضة كأنها مواعيد عمل مقدسة في التقويم يمنع تفويتها.',
      next_commitments: 'تسليم المخرج النهائي لمشروع المتجر، وتثبيت 3 حصص رياضية في الأسبوع.',
      notes: 'الأسبوع كان منتجاً، والمطلوب الآن الحفاظ على التوازن الشامل وتفادي الاحتراق.',
      snapshot: generateSystemSnapshot(pillars, visions, goals, projects, tasks),
      system_health_score: 84,
      smart_summary: 'أسبوع متوازن بنسبة إنجاز مشروعات قوية. المؤشرات تشير إلى ضرورة ضخ نشاط في ركيزة الصحة.',
      strengths: ['حركة سريعة في المشروعات التنفيذية', 'التزام ممتاز بمواعيد التسليم'],
      bottlenecks: ['ركيزة الصحة تسجل تقدماً أبطأ من باقي الركائز'],
      recommendations: ['جدولة أنشطة الصحة مسبقاً في بداية الأسبوع القادم', 'مراجعة أولويات المشاريع المتوازية'],
      action_items: [
        { id: 'act-w-1', title: 'جدولة 3 جلسات رياضية للأسبوع القادم', priority: 'medium', is_converted: false }
      ],
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'rev-monthly-1',
      frequency: 'monthly',
      date: formatDate(15),
      title: 'المراجعة الشهرية لشهر سبتمبر — مطابقة أهداف القيمة',
      rating: 9,
      focus_pillar_id: null,
      wins: 'تحقيق 80% من المستهدفات المالية ومراجعة 4 مجالس لكتاب العادات الذرية.',
      challenges: 'بعض المشاريع تطلبت وقتاً أطول من المتوقع في مرحلة التدريب والتأسيس.',
      lessons: 'تقدير الوقت الواقعي للمشاريع المعقدة وتضمين هامش أمان بنسبة 20%.',
      next_commitments: 'الانتقال إلى مرحلة التوسع وتكثيف حملات التسويق وتحسين العائد.',
      notes: 'شهر تحولي وضع أسساً متينة للربع السنوي القادم.',
      snapshot: generateSystemSnapshot(pillars, visions, goals, projects, tasks),
      system_health_score: 90,
      smart_summary: 'أداء شهري ممتاز. معدل تقدم أهداف القيمة يتماشى مع الخطة المرسومة في معظم المسارات.',
      strengths: ['تحقيق قفزات واضحة في الركائز ذات الأولوية العالية', 'انسيابية في تحويل الرؤى لمشاريع عملية'],
      bottlenecks: ['حاجة لتشذيب قائمة المهام العالقة التي مر عليها أكثر من شهر'],
      recommendations: ['أرشفة المشاريع المنتهية لتصفية الذهن', 'إعادة ضبط أرقام الأهداف للشهر المقبل'],
      action_items: [
        { id: 'act-m-1', title: 'أرشفة المهام القديمة وتحديث مؤشرات أهداف القيمة', priority: 'low', is_converted: false }
      ],
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
    {
      id: 'rev-quarterly-1',
      frequency: 'quarterly',
      date: formatDate(45),
      title: 'مراجعة الربع الثالث — فحص البوصلة والاستراتيجية',
      rating: 8,
      focus_pillar_id: null,
      wins: 'تأسيس المنظومة الهرمية بالكامل وربط الركائز بالرؤى والأهداف والمشاريع والمهام.',
      challenges: 'فترات تقلب في وتيرة النشاط نتيجة لضغوط متفرقة خارج الخطة.',
      lessons: 'النظام الهرمي الواضح يمنع التيه ويساعد على العودة السريعة للمسار مهما حدث انقطاع.',
      next_commitments: 'إطلاق المشاريع الكبرى لـ Q4 والتركيز على العائد الاستثماري والصحي.',
      notes: 'الربع الثالث كان ربع البناء الهيكلي، والربع القادم هو ربع الحصاد والنتائج.',
      snapshot: generateSystemSnapshot(pillars, visions, goals, projects, tasks),
      system_health_score: 82,
      smart_summary: 'مراجعة ربع سنوية تؤكد نجاح التحول نحو العمل المنظم بالركائز والمشاريع الصاعدة.',
      strengths: ['بناء البنية التحتية لمنظومة الحياة الشخصية', 'وضوح الأفق المستقبلي والرؤى'],
      bottlenecks: ['الحاجة لتفويض أو تبسيط بعض المهام الروتينية'],
      recommendations: ['تركيز الموارد في Q4 على المشاريع الأعلى أثراً', 'مراجعة صياغة الرؤى طويلة الأجل'],
      action_items: [
        { id: 'act-q-1', title: 'تحديد المبادرات الثلاث التحولية للربع الرابع', priority: 'high', is_converted: false }
      ],
      created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
    },
    {
      id: 'rev-yearly-1',
      frequency: 'yearly',
      date: formatDate(120),
      title: 'المراجعة السنوية الشاملة — تأمل المسار وتجديد الغايات',
      rating: 9,
      focus_pillar_id: null,
      wins: 'قفزات نوعية في الوعي، وبناء مشاريع مستقلة، وترسيخ عادات قوية في البناء الذاتي والروحي.',
      challenges: 'تحديات التوازن بين ضغوط العمل والعناية بالجسد والراحة النفسية.',
      lessons: 'الغاية الكبرى هي الوقود الحقيقي الذي يبقيك مستمراً عندما تخبو الحماسة اللحظية.',
      next_commitments: 'تجديد الرؤى الخمسية ومضاعفة الأثر في الركائز الرئيسية للحياة.',
      notes: 'سنة كانت حافلة بالنمو والتعلم والتحولات الإيجابية العميقة.',
      snapshot: generateSystemSnapshot(pillars, visions, goals, projects, tasks),
      system_health_score: 86,
      smart_summary: 'مراجعة سنوية تعكس تطوراً مطرداً في مختلف جوانب الحياة وتماسكاً في الهرم التنفيذي.',
      strengths: ['ثبات في المبادئ والغايات التوجيهية', 'تحقيق نتائج ملموسة في أهداف القيمة'],
      bottlenecks: ['الحاجة لفترات استشفاء وإجازات منتظمة بين الفصول'],
      recommendations: ['إعادة صياغة الرؤى العشرية', 'تخصيص أسبوع خلوة للتخطيط والتجديد'],
      action_items: [
        { id: 'act-y-1', title: 'كتابة بيان الرؤية للعام الجديد واعتماده في الركائز', priority: 'high', is_converted: false }
      ],
      created_at: new Date(Date.now() - 86400000 * 120).toISOString(),
    },
  ];
}
