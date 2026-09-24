import type { Pillar, Project, Task, ValueGoal, Vision } from '../types/hierarchical';

/**
 * Recomputes the local projection of the hierarchy without reading or writing
 * browser storage. Persistence belongs to DataRepository; this function is
 * deliberately pure so guest and Supabase data follow the same rules.
 */
export function recalculateAllHierarchicalProgress(
  pillars: Pillar[],
  visions: Vision[],
  goals: ValueGoal[],
  projects: Project[],
  tasks: Task[],
): { pillars: Pillar[]; visions: Vision[]; goals: ValueGoal[]; projects: Project[]; tasks: Task[] } {
  const updatedProjects = projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.project_id === project.id);
    const progress = projectTasks.length
      ? Math.round(projectTasks.reduce((sum, task) => sum + (task.status === 'done' ? 100 : 0), 0) / projectTasks.length)
      : 0;
    const status: Project['status'] = progress >= 100
      ? 'completed'
      : project.status === 'completed'
        ? (progress > 0 ? 'in_progress' : 'planned')
        : project.status;
    return { ...project, progress, status };
  });

  const updatedGoals = goals.map((goal) => {
    const goalProjects = updatedProjects.filter((project) => project.goal_id === goal.id);
    const progress = goalProjects.length
      ? Math.round(goalProjects.reduce((sum, project) => sum + project.progress, 0) / goalProjects.length)
      : 0;
    const status: ValueGoal['status'] = progress >= 100
      ? 'completed'
      : progress > 0
        ? 'in_progress'
        : goal.status === 'completed'
          ? 'not_started'
          : goal.status;
    return { ...goal, progress, status };
  });

  const updatedVisions = visions.map((vision) => {
    const visionGoals = updatedGoals.filter((goal) => goal.vision_id === vision.id);
    const progress = visionGoals.length
      ? Math.round(visionGoals.reduce((sum, goal) => sum + goal.progress, 0) / visionGoals.length)
      : 0;
    return { ...vision, progress };
  });

  const updatedPillars = pillars.map((pillar) => {
    const children = [
      ...updatedVisions.filter((vision) => vision.pillar_id === pillar.id).map((vision) => vision.progress),
      ...updatedGoals.filter((goal) => goal.pillar_id === pillar.id && !goal.vision_id).map((goal) => goal.progress),
    ];
    const progress = children.length ? Math.round(children.reduce((sum, value) => sum + value, 0) / children.length) : 0;
    return { ...pillar, progress };
  });

  return { pillars: updatedPillars, visions: updatedVisions, goals: updatedGoals, projects: updatedProjects, tasks };
}
