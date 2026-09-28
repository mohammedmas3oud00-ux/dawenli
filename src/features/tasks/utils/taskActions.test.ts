import { describe, expect, it } from 'vitest';
import { setTaskStatus, toggleTaskStatus, upsertTask } from './taskActions';

const task = {
  id: 'task-1',
  project_id: 'project-1',
  title: 'مهمة',
  description: '',
  status: 'todo' as const,
  priority: 'medium' as const,
  due_date: null,
  completed_at: null,
  custom_fields: {},
  created_at: '2026-09-27',
};
describe('task actions', () => {
  it('requires a real project when creating', () => expect(upsertTask([], [], { title: 'x' })).toBeNull());
  it('toggles completion timestamps consistently', () => {
    const done = toggleTaskStatus([task], task.id, '2026-09-27T10:00:00Z')[0];
    expect(done.status).toBe('done');
    expect(done.completed_at).toBe('2026-09-27T10:00:00Z');
    expect(setTaskStatus([done], task.id, 'todo')[0].completed_at).toBeNull();
  });
});
