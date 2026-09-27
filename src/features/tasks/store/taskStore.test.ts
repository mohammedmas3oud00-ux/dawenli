import { describe, expect, it } from 'vitest';
import { useTaskStore } from './taskStore';

describe('task store', () => {
  it('supports functional collection updates', () => {
    useTaskStore.setState({ tasks: [] });
    useTaskStore.getState().setTasks((current) => [...current, { id: 'task-1' } as never]);
    expect(useTaskStore.getState().tasks.map((task) => task.id)).toEqual(['task-1']);
    useTaskStore.setState({ tasks: [] });
  });
});
