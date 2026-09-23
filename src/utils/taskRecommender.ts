import { Task, Project, ValueGoal, Pillar, EnergyLevel } from '../types/hierarchical';

export interface TaskRecommendation {
  task: Task;
  project?: Project;
  goal?: ValueGoal;
  pillar?: Pillar;
  score: number; // 0 to 100
  estimatedMinutes: number;
  requiredEnergy: EnergyLevel;
  urgencyLabel: string;
  reasons: string[];
}

export interface RecommendationParams {
  availableMinutes: number;
  energyLevel: EnergyLevel;
  pillarId?: string | 'all';
}

/**
 * Estimate task duration in minutes based on priority, status, and description length
 */
export function estimateTaskDuration(task: Task): number {
  if (task.priority === 'high') return 45;
  if (task.priority === 'medium') return 30;
  return 15;
}

/**
 * Determine ideal energy level for task
 */
export function determineTaskEnergy(task: Task): EnergyLevel {
  if (task.priority === 'high') return 'high';
  if (task.priority === 'medium') return 'medium';
  return 'low';
}

/**
 * Core Algorithm to rank and find the best task to do now
 */
export function getRecommendedTasks(
  tasks: Task[],
  projects: Project[],
  goals: ValueGoal[],
  pillars: Pillar[],
  params: RecommendationParams
): TaskRecommendation[] {
  const { availableMinutes, energyLevel, pillarId = 'all' } = params;
  const today = new Date().toISOString().split('T')[0];

  // Map entities for fast lookup
  const projectMap = new Map(projects.map(p => [p.id, p]));
  const goalMap = new Map(goals.map(g => [g.id, g]));
  const pillarMap = new Map(pillars.map(p => [p.id, p]));

  // Active tasks only
  const activeTasks = tasks.filter(t => t.status !== 'done');
  if (activeTasks.length === 0) return [];

  const scoredList: TaskRecommendation[] = [];

  for (const task of activeTasks) {
    const project = task.project_id ? projectMap.get(task.project_id) : undefined;
    const goal = project ? goalMap.get(project.goal_id) : undefined;
    const pillar = goal ? pillarMap.get(goal.pillar_id) : (pillarId !== 'all' ? pillarMap.get(pillarId) : undefined);

    // Filter out if specific pillar requested and doesn't match
    if (pillarId !== 'all' && pillar && pillar.id !== pillarId) {
      continue;
    }

    let score = 50; // base score
    const reasons: string[] = [];
    const estimatedMinutes = estimateTaskDuration(task);
    const requiredEnergy = determineTaskEnergy(task);

    // 1. Task Priority Score (Max 30 pts)
    if (task.priority === 'high') {
      score += 30;
      reasons.push('مهمة ذات أولوية استراتيجية عليا');
    } else if (task.priority === 'medium') {
      score += 20;
    } else {
      score += 10;
    }

    // 2. In-Progress Momentum (Max 15 pts)
    if (task.status === 'in_progress') {
      score += 15;
      reasons.push('بدأت العمل عليها بالفعل، إنهاؤها يحافظ على التدفق');
    }

    // 3. Due Date Urgency (Max 40 pts)
    let urgencyLabel = 'لا يوجد موعد تسليم محدد';
    if (task.due_date) {
      const dueDate = task.due_date.split('T')[0];
      if (dueDate < today) {
        score += 40;
        urgencyLabel = '⚠️ متأخرة عن موعد الإنجاز';
        reasons.push('متأخرة عن موعدها المحدد وتتطلب تدخلاً فورياً');
      } else if (dueDate === today) {
        score += 35;
        urgencyLabel = '🚨 مستحقة اليوم';
        reasons.push('مستحقة اليوم ضمن خطتك التنفيذية');
      } else {
        const diffDays = Math.ceil((new Date(dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3) {
          score += 25;
          urgencyLabel = `⏳ مستحقة خلال ${diffDays} أيام`;
          reasons.push(`موعد تسليمها وشيك (خلال ${diffDays} أيام)`);
        } else if (diffDays <= 7) {
          score += 15;
          urgencyLabel = '📅 مستحقة هذا الأسبوع';
        } else {
          urgencyLabel = `📅 مستحقة في ${dueDate}`;
        }
      }
    }

    // 4. Time Availability Matching (Max 25 pts)
    const timeDelta = availableMinutes - estimatedMinutes;
    if (timeDelta >= 0 && timeDelta <= 20) {
      score += 25;
      reasons.push(`ملائمة تماماً لوقتك المتاح (${availableMinutes} دقيقة)`);
    } else if (timeDelta > 20) {
      score += 18;
      reasons.push(`يمكنك إنهاؤها ويبقى وقت إضافي (${estimatedMinutes} دقيقة مقدرة)`);
    } else {
      // Not enough time, penalize slightly
      score -= 20;
    }

    // 5. Energy Level Matching (Max 25 pts)
    if (energyLevel === requiredEnergy) {
      score += 25;
      if (energyLevel === 'high') {
        reasons.push('تستغل ذروة صفائك الذهني وطاقتك العالية ⚡');
      } else if (energyLevel === 'medium') {
        reasons.push('متوازنة مع مستواك الإنجازي الحالي 🔋');
      } else {
        reasons.push('مهمة خفيفة تنجزها بدون إجهاد ذهني ☕');
      }
    } else if (
      (energyLevel === 'high' && requiredEnergy === 'medium') ||
      (energyLevel === 'medium' && requiredEnergy === 'low')
    ) {
      score += 15;
    } else if (energyLevel === 'low' && requiredEnergy === 'high') {
      score -= 25; // Don't force heavy tasks when drained
    }

    // 6. Project & Pillar Weight
    if (project?.status === 'in_progress') {
      score += 10;
    }

    // Normalize score to 0 - 100 range
    const normalizedScore = Math.min(99, Math.max(50, score));

    scoredList.push({
      task,
      project,
      goal,
      pillar,
      score: normalizedScore,
      estimatedMinutes,
      requiredEnergy,
      urgencyLabel,
      reasons: reasons.slice(0, 3), // top 3 reasons
    });
  }

  // Sort descending by score
  return scoredList.sort((a, b) => b.score - a.score);
}
