import { 
  Project, 
  Task, 
  ProjectProgressStats, 
  Pillar, 
  Vision, 
  StrategicGoal, 
  GoalProgressStats, 
  VisionProgressStats, 
  PillarProgressStats,
  RecommendedTaskResult,
  EnergyLevel
} from '../types';

/**
 * دالة حساب التقدم الشامل للمشروع بناءً على المهام وأسلوب الحساب المحدد
 */
export function calculateProjectProgress(
  project: Project,
  allTasks: Task[]
): ProjectProgressStats {
  const projectTasks = allTasks.filter((t) => t.projectId === project.id);
  const totalTasks = projectTasks.length;

  const now = new Date();
  const dueDate = new Date(project.dueDate);
  const startDate = new Date(project.startDate);
  
  // حساب الأيام المتبقية
  const diffTime = dueDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0 && project.status !== 'completed';

  if (totalTasks === 0) {
    return {
      percentage: 0,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      inReviewTasks: 0,
      todoTasks: 0,
      totalWeight: 0,
      completedWeight: 0,
      totalEstimatedHours: 0,
      loggedHours: 0,
      totalSubtasks: 0,
      completedSubtasks: 0,
      isOverdue,
      daysRemaining,
      health: isOverdue ? 'delayed' : 'on_track',
    };
  }

  let completedTasks = 0;
  let inProgressTasks = 0;
  let inReviewTasks = 0;
  let todoTasks = 0;

  let totalWeight = 0;
  let completedWeight = 0;

  let totalEstimatedHours = 0;
  let loggedHours = 0;

  let totalSubtasks = 0;
  let completedSubtasks = 0;

  for (const task of projectTasks) {
    const weight = Math.max(1, task.weight || 1);
    totalWeight += weight;
    totalEstimatedHours += task.estimatedHours || 0;
    loggedHours += task.loggedHours || 0;

    // حساب المهام الفرعية
    const subCount = task.subtasks?.length || 0;
    const subDone = task.subtasks?.filter((s) => s.completed).length || 0;
    totalSubtasks += subCount;
    completedSubtasks += subDone;

    const subtaskRatio = subCount > 0 ? subDone / subCount : 0;

    switch (task.status) {
      case 'completed':
        completedTasks++;
        completedWeight += weight;
        break;
      case 'in_review':
        inReviewTasks++;
        // في مراجعة الجودة نعتبر المهمة منجزة بنسبة 85%
        completedWeight += weight * 0.85;
        break;
      case 'in_progress':
        inProgressTasks++;
        // إذا كان هناك مهام فرعية نعتمد عليها، وإلا نعتبر 45% كقيمة تقديرية
        if (subCount > 0) {
          completedWeight += weight * Math.max(0.3, subtaskRatio);
        } else {
          completedWeight += weight * 0.45;
        }
        break;
      case 'todo':
      default:
        todoTasks++;
        if (subCount > 0 && subDone > 0) {
          completedWeight += weight * subtaskRatio * 0.5;
        }
        break;
    }
  }

  let percentage = 0;

  if (project.calculationMode === 'standard') {
    // حساب بسيط: نسبة المهام المكتملة إلى الإجمالي
    percentage = Math.round((completedTasks / totalTasks) * 100);
  } else if (project.calculationMode === 'weighted') {
    // حساب بالأوزان النسبية لكل مهمة
    percentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  } else {
    // حساب دقيق عميق يشمل المهام الفرعية وساعات العمل
    const taskWeightScore = totalWeight > 0 ? completedWeight / totalWeight : 0;
    const subtaskScore = totalSubtasks > 0 ? completedSubtasks / totalSubtasks : taskWeightScore;
    // تركيبة متوازنة: 60% أوزان المهام + 40% المهام الفرعية
    const blended = taskWeightScore * 0.6 + subtaskScore * 0.4;
    percentage = Math.round(blended * 100);
  }

  // ضبط النسبة بين 0 و 100
  percentage = Math.min(100, Math.max(0, percentage));

  // حساب مؤشر صحة المشروع (Health status)
  let health: 'on_track' | 'at_risk' | 'delayed' | 'completed' = 'on_track';

  if (percentage >= 100 || project.status === 'completed') {
    health = 'completed';
  } else if (isOverdue) {
    health = 'delayed';
  } else {
    // حساب النسبة الزمنية المنقضية
    const totalDuration = dueDate.getTime() - startDate.getTime();
    const elapsedDuration = now.getTime() - startDate.getTime();
    if (totalDuration > 0 && elapsedDuration > 0) {
      const timeElapsedPercent = (elapsedDuration / totalDuration) * 100;
      // إذا كان الوقت المنقضي يسبق نسبة الإنجاز بأكثر من 25%
      if (timeElapsedPercent > percentage + 25) {
        health = 'delayed';
      } else if (timeElapsedPercent > percentage + 12) {
        health = 'at_risk';
      } else {
        health = 'on_track';
      }
    }
  }

  return {
    percentage,
    totalTasks,
    completedTasks,
    inProgressTasks,
    inReviewTasks,
    todoTasks,
    totalWeight,
    completedWeight: Math.round(completedWeight * 10) / 10,
    totalEstimatedHours,
    loggedHours,
    totalSubtasks,
    completedSubtasks,
    isOverdue,
    daysRemaining,
    health,
  };
}

/**
 * حساب تقدم الهدف الاستراتيجي (Goal Progress Rollup)
 * يتجمع تصاعدياً من المشاريع المرتبطة بهذا الهدف والمهام التابعة لها
 */
export function calculateGoalProgress(
  goal: StrategicGoal,
  projects: Project[],
  tasks: Task[]
): GoalProgressStats {
  const linkedProjects = projects.filter((p) => p.goalId === goal.id);
  const totalProjects = linkedProjects.length;

  if (totalProjects === 0) {
    return {
      percentage: 0,
      totalProjects: 0,
      completedProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      health: 'on_track',
    };
  }

  let sumPercentage = 0;
  let completedProjects = 0;
  let totalTasks = 0;
  let completedTasks = 0;
  let hasDelayed = false;
  let hasAtRisk = false;

  for (const proj of linkedProjects) {
    const projStats = calculateProjectProgress(proj, tasks);
    sumPercentage += projStats.percentage;
    if (projStats.percentage >= 100 || proj.status === 'completed') {
      completedProjects++;
    }
    totalTasks += projStats.totalTasks;
    completedTasks += projStats.completedTasks;
    if (projStats.health === 'delayed') hasDelayed = true;
    if (projStats.health === 'at_risk') hasAtRisk = true;
  }

  const percentage = Math.round(sumPercentage / totalProjects);
  let health: 'on_track' | 'at_risk' | 'delayed' | 'completed' = 'on_track';
  if (percentage >= 100 || completedProjects === totalProjects) {
    health = 'completed';
  } else if (hasDelayed) {
    health = 'delayed';
  } else if (hasAtRisk) {
    health = 'at_risk';
  }

  return {
    percentage,
    totalProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    health,
  };
}

/**
 * حساب تقدم الرؤية (Vision Progress Rollup)
 * يتجمع تصاعدياً من الأهداف الاستراتيجية التابعة لهذه الرؤية
 */
export function calculateVisionProgress(
  vision: Vision,
  goals: StrategicGoal[],
  projects: Project[],
  tasks: Task[]
): VisionProgressStats {
  const linkedGoals = goals.filter((g) => g.visionId === vision.id);
  const totalGoals = linkedGoals.length;

  if (totalGoals === 0) {
    return {
      percentage: 0,
      totalGoals: 0,
      completedGoals: 0,
      totalProjects: 0,
      totalTasks: 0,
    };
  }

  let totalWeightedProgress = 0;
  let totalGoalWeights = 0;
  let completedGoals = 0;
  let totalProjects = 0;
  let totalTasks = 0;

  for (const goal of linkedGoals) {
    const goalStats = calculateGoalProgress(goal, projects, tasks);
    const weight = Math.max(1, goal.weight || 1);
    totalGoalWeights += weight;
    totalWeightedProgress += goalStats.percentage * weight;

    if (goalStats.percentage >= 100 || goal.status === 'achieved') {
      completedGoals++;
    }
    totalProjects += goalStats.totalProjects;
    totalTasks += goalStats.totalTasks;
  }

  const percentage = totalGoalWeights > 0 
    ? Math.round(totalWeightedProgress / totalGoalWeights) 
    : 0;

  return {
    percentage,
    totalGoals,
    completedGoals,
    totalProjects,
    totalTasks,
  };
}

/**
 * حساب تقدم الركيزة الاستراتيجية (Pillar Progress Rollup)
 * يتجمع تصاعدياً من الرؤى المرتبطة بالركيزة
 */
export function calculatePillarProgress(
  pillar: Pillar,
  visions: Vision[],
  goals: StrategicGoal[],
  projects: Project[],
  tasks: Task[]
): PillarProgressStats {
  const linkedVisions = visions.filter((v) => v.pillarId === pillar.id);
  const totalVisions = linkedVisions.length;

  if (totalVisions === 0) {
    return {
      percentage: 0,
      totalVisions: 0,
      totalGoals: 0,
      totalProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
    };
  }

  let sumVisionPercentage = 0;
  let totalGoals = 0;
  let totalProjects = 0;
  let totalTasks = 0;
  let completedTasks = 0;

  for (const vis of linkedVisions) {
    const visStats = calculateVisionProgress(vis, goals, projects, tasks);
    sumVisionPercentage += visStats.percentage;
    totalGoals += visStats.totalGoals;
    totalProjects += visStats.totalProjects;
    totalTasks += visStats.totalTasks;
  }

  // حساب المهام المكتملة ضمن هذه الركيزة
  const pillarGoalIds = goals.filter((g) => 
    linkedVisions.some((v) => v.id === g.visionId)
  ).map((g) => g.id);

  const pillarProjectIds = projects.filter((p) => 
    p.goalId && pillarGoalIds.includes(p.goalId)
  ).map((p) => p.id);

  const pillarTasks = tasks.filter((t) => pillarProjectIds.includes(t.projectId));
  completedTasks = pillarTasks.filter((t) => t.status === 'completed').length;

  const percentage = Math.round(sumVisionPercentage / totalVisions);

  return {
    percentage,
    totalVisions,
    totalGoals,
    totalProjects,
    totalTasks,
    completedTasks,
  };
}

/**
 * فحص الاعتماديات للمهمة ومعرفة هل هي محجوبة أم جاهزة للتنفيذ
 */
export function checkTaskDependencies(
  task: Task,
  allTasks: Task[]
): { isBlocked: boolean; blockingTasks: Task[] } {
  if (!task.dependencies || task.dependencies.length === 0) {
    return { isBlocked: false, blockingTasks: [] };
  }

  const blockingTasks = allTasks.filter(
    (t) => task.dependencies.includes(t.id) && t.status !== 'completed'
  );

  return {
    isBlocked: blockingTasks.length > 0,
    blockingTasks,
  };
}

/**
 * احتساب درجة الأولوية الذكية الشاملة (Smart Priority Score: 0 - 100)
 * تعتمد على:
 * 1. التأثير الاستراتيجي (Impact Score: 1-10) -> وزن 25%
 * 2. القيمة الناتجة (Value Score: 1-10) -> وزن 20%
 * 3. الأولوية التشغيلية وموعد التسليم (Urgency / Deadline) -> وزن 25%
 * 4. الارتباط بالهدف الأكبر (Goal Alignment) -> وزن 15%
 * 5. مستوى الطاقة ومعدل الإنجاز السريع (Energy & Quick Wins) -> وزن 15%
 * - مع خصم مباشر في حال كانت المهمة معطلة باعتماديات غير مكتملة
 */
export function calculateSmartPriorityScore(
  task: Task,
  project?: Project,
  goal?: StrategicGoal,
  allTasks: Task[] = []
): number {
  if (task.status === 'completed') return 0;

  // 1. درجة الأثر (Impact Score: 1-10 -> 0-25)
  const impact = Math.min(10, Math.max(1, task.impactScore || 5));
  const impactPoints = (impact / 10) * 25;

  // 2. درجة القيمة (Value Score: 1-10 -> 0-20)
  const value = Math.min(10, Math.max(1, task.valueScore || 5));
  const valuePoints = (value / 10) * 20;

  // 3. الاستعجال وموعد التسليم (Urgency & Deadline -> 0-25)
  let urgencyPoints = 10;
  switch (task.priority) {
    case 'urgent': urgencyPoints = 25; break;
    case 'high': urgencyPoints = 20; break;
    case 'medium': urgencyPoints = 14; break;
    case 'low': urgencyPoints = 8; break;
  }

  // فحص قرب الموعد النهائي
  if (task.dueDate) {
    const now = new Date().getTime();
    const due = new Date(task.dueDate).getTime();
    const daysLeft = (due - now) / (1000 * 60 * 60 * 24);
    if (daysLeft < 0) urgencyPoints = 25; // متأخرة
    else if (daysLeft <= 2) urgencyPoints = Math.max(urgencyPoints, 24);
    else if (daysLeft <= 5) urgencyPoints = Math.max(urgencyPoints, 20);
  }

  // 4. الارتباط بالهدف الأكبر (Goal Alignment -> 0-15)
  let goalAlignmentPoints = 8;
  if (goal) {
    const goalWeight = goal.weight || 5;
    goalAlignmentPoints = (goalWeight / 10) * 15;
  } else if (task.goalAlignmentScore) {
    goalAlignmentPoints = (task.goalAlignmentScore / 10) * 15;
  }

  // 5. الطاقة والجهد السريع (Energy efficiency -> 0-15)
  // المهام ذات الأثر العالي والوقت المعتدل تكافأ كنقاط فوز سريعة
  let energyPoints = 10;
  if (task.energyLevel === 'low' && impact >= 7) {
    energyPoints = 15; // فوز سريع ذو قيمة عالية
  } else if (task.energyLevel === 'high') {
    energyPoints = 12;
  }

  let totalScore = impactPoints + valuePoints + urgencyPoints + goalAlignmentPoints + energyPoints;

  // فحص الاعتماديات: إذا كانت المهمة معطلة، نخفض أولويتها التنفيذية الفورية
  if (allTasks.length > 0) {
    const depCheck = checkTaskDependencies(task, allTasks);
    if (depCheck.isBlocked) {
      totalScore *= 0.45; // تخفيض لأنها لا يمكن تنفيذها الآن
    }
  }

  return Math.min(100, Math.max(1, Math.round(totalScore)));
}

/**
 * محرك التوصية الذكي: "أفضل مهمة أقوم بها الآن"
 * يقترح أفضل مهمة بناءً على:
 * - الوقت المتاح للمستخدم
 * - مستوى الطاقة والتركيز الحالي
 * - الأهداف والمشاريع النشطة
 * - عدم وجود اعتماديات معطلة
 */
export function recommendBestTask(
  params: {
    availableMinutes: number; // الوقت المتاح: 15, 30, 60, 120 دقيقة
    energyLevel: EnergyLevel; // الطاقة: 'low' | 'medium' | 'high'
    goalId?: string;
    projectId?: string;
  },
  tasks: Task[],
  projects: Project[],
  goals: StrategicGoal[],
  visions: Vision[],
  pillars: Pillar[]
): RecommendedTaskResult[] {
  // استبعاد المهام المكتملة
  const candidateTasks = tasks.filter((t) => t.status !== 'completed');

  const results: RecommendedTaskResult[] = [];

  for (const task of candidateTasks) {
    // تصفية حسب المشروع أو الهدف إن تم تحديدهما
    if (params.projectId && params.projectId !== 'all' && task.projectId !== params.projectId) {
      continue;
    }

    const project = projects.find((p) => p.id === task.projectId);
    const goal = goals.find((g) => g.id === project?.goalId);
    const vision = visions.find((v) => v.id === goal?.visionId);
    const pillar = pillars.find((pil) => pil.id === vision?.pillarId);

    if (params.goalId && params.goalId !== 'all' && project?.goalId !== params.goalId) {
      continue;
    }

    // فحص الاعتماديات
    const depCheck = checkTaskDependencies(task, tasks);

    // حساب الأولوية الذكية الأساسية
    const priorityScore = calculateSmartPriorityScore(task, project, goal, tasks);

    // حساب ملائمة الوقت والطاقة (Fit Score)
    const taskEstimatedMinutes = (task.estimatedHours || 1) * 60;
    let fitScore = 60;

    // مطابقة الطاقة
    if (task.energyLevel === params.energyLevel) {
      fitScore += 25;
    } else if (
      (params.energyLevel === 'high' && task.energyLevel === 'medium') ||
      (params.energyLevel === 'medium' && task.energyLevel === 'low')
    ) {
      fitScore += 15;
    } else if (params.energyLevel === 'low' && task.energyLevel === 'high') {
      fitScore -= 25; // طاقة منخفضة لمهمة تتطلب تركيزاً عميقاً
    }

    // مطابقة الوقت
    if (taskEstimatedMinutes <= params.availableMinutes) {
      fitScore += 15;
    } else if (taskEstimatedMinutes <= params.availableMinutes * 1.5) {
      fitScore += 5;
    } else {
      fitScore -= 20; // الوقت المتاح أقل من المطلوب لإنجاز المهمة
    }

    if (depCheck.isBlocked) {
      fitScore -= 40;
    }

    fitScore = Math.min(100, Math.max(0, fitScore));

    // صياغة سبب التوصية الذكي باللغة العربية
    let reason = '';
    if (depCheck.isBlocked) {
      reason = `معلقة بانتظار إنجاز: ${depCheck.blockingTasks.map((b) => b.title).join('، ')}`;
    } else if (task.energyLevel === 'low' && task.impactScore >= 7) {
      reason = 'فرصة فوز سريع (Quick Win): تتطلب جهداً منخفضاً وتقدم تأثيراً استراتيجياً كبيراً.';
    } else if (task.priority === 'urgent') {
      reason = 'أولوية عاجلة مع اقتراب الموعد النهائي لارتباطها المباشر بتسليم المشروع.';
    } else if (task.impactScore >= 8 && goal) {
      reason = `تأثير استراتيجي فائق (${task.impactScore}/10) يدعم مباشرة هدف "${goal.title}".`;
    } else if (task.energyLevel === params.energyLevel) {
      reason = `متوافقة تماماً مع طاقتك الحالية (${params.energyLevel === 'high' ? 'تركيز عميق' : params.energyLevel === 'medium' ? 'طاقة متوسطة' : 'طاقة خفيفة'}) ومناسب للوقت المتاح.`;
    } else {
      reason = `مهمة محورية في مشروع "${project?.name || ''}" ترفع نسبة الإنجاز فور إتمامها.`;
    }

    results.push({
      task,
      project,
      goal,
      vision,
      pillar,
      priorityScore,
      fitScore,
      isBlocked: depCheck.isBlocked,
      blockingTasks: depCheck.blockingTasks,
      reason,
    });
  }

  // الترتيب: غير المحجوبة أولاً، ثم المجموع المركب (Fit + Priority)
  results.sort((a, b) => {
    if (a.isBlocked !== b.isBlocked) {
      return a.isBlocked ? 1 : -1;
    }
    const totalA = a.priorityScore * 0.55 + a.fitScore * 0.45;
    const totalB = b.priorityScore * 0.55 + b.fitScore * 0.45;
    return totalB - totalA;
  });

  return results;
}

/**
 * حساب إجمالي إحصائيات بيئة العمل لجميع المشاريع
 */
export function calculateWorkspaceStats(projects: Project[], tasks: Task[]) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const inReviewTasks = tasks.filter((t) => t.status === 'in_review').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;

  const now = new Date();
  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'completed') return false;
    const d = new Date(t.dueDate);
    return d.getTime() < now.getTime();
  }).length;

  // متوسط نسبة إنجاز المشاريع
  let sumPercentage = 0;
  projects.forEach((proj) => {
    const stats = calculateProjectProgress(proj, tasks);
    sumPercentage += stats.percentage;
  });
  const averageProjectProgress = totalProjects > 0 ? Math.round(sumPercentage / totalProjects) : 0;

  // نسبة إنجاز جميع المهام
  const overallTaskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalLoggedHours = tasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    inProgressTasks,
    inReviewTasks,
    todoTasks,
    overdueTasks,
    averageProjectProgress,
    overallTaskProgress,
    totalEstimatedHours,
    totalLoggedHours,
  };
}
