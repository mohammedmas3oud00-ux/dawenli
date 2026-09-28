import type { Project, Task } from '../../../types/hierarchical';

export function upsertTask(
  tasks: Task[],
  projects: Project[],
  data: Partial<Task>,
  editingId?: string,
  now = new Date().toISOString(),
): Task[] | null {
  if (editingId)
    return tasks.map((task) =>
      task.id === editingId
        ? ({ ...task, ...data, custom_fields: data.custom_fields || task.custom_fields, updated_at: now } as Task)
        : task,
    );
  const projectId = data.project_id;
  if (!projectId || !projects.some((project) => project.id === projectId)) return null;
  const task: Task = {
    id: crypto.randomUUID(),
    project_id: projectId,
    title: data.title || 'مهمة جديدة',
    description: data.description || '',
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    due_date: data.due_date || null,
    completed_at: data.status === 'done' ? now : null,
    custom_fields: data.custom_fields || {},
    created_at: now,
  };
  return [...tasks, task];
}

export function setTaskStatus(tasks: Task[], taskId: string, status: Task['status'], now = new Date().toISOString()) {
  return tasks.map((task) =>
    task.id === taskId ? { ...task, status, completed_at: status === 'done' ? now : null, updated_at: now } : task,
  );
}

export function toggleTaskStatus(tasks: Task[], taskId: string, now = new Date().toISOString()) {
  const task = tasks.find((item) => item.id === taskId);
  return task ? setTaskStatus(tasks, taskId, task.status === 'done' ? 'todo' : 'done', now) : tasks;
}
