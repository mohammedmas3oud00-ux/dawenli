import { describe, expect, it } from 'vitest';
import { emptySnapshot } from '../../../data/repository';
import type { AppDataSnapshot } from '../../../types/hierarchical';
import { applyAiCommandActions, buildAiCommandContext } from './executor';

const hierarchy = (): AppDataSnapshot => ({
  ...emptySnapshot(),
  pillars: [{ id: 'pillar-1', title: 'الصحة', description: '', pillar_group: 'Health', purpose: '', priority: 1, show_on_home: true, status: 'active', progress: 0, created_at: '2026-01-01' }],
  visions: [{ id: 'vision-1', pillar_id: 'pillar-1', title: 'صحة مستدامة', description: '', status: 'active', progress: 0, created_at: '2026-01-01' }],
  goals: [{ id: 'goal-1', pillar_id: 'pillar-1', vision_id: 'vision-1', title: 'لياقة أفضل', description: '', status: 'not_started', progress: 0, target_date: null, created_at: '2026-01-01' }],
  projects: [{ id: 'project-1', goal_id: 'goal-1', title: 'الجري', description: '', status: 'planned', progress: 0, start_date: '2026-01-01', due_date: null, created_at: '2026-01-01' }],
  tasks: [{ id: 'task-1', project_id: 'project-1', title: 'جولة صباحية', description: '', status: 'todo', priority: 'medium', due_date: null, completed_at: null, created_at: '2026-01-01' }],
});

describe('AI command executor', () => {
  it('creates multiple native entities without mutating the input snapshot', () => {
    const snapshot = hierarchy();
    const result = applyAiCommandActions(snapshot, [
      { actionId: 'journal', operation: 'create', entityType: 'journal', title: 'تأمل اليوم', content: 'شعرت بطاقة جيدة.', date: '2026-09-28', mood: 'good', tags: ['صحة'], reason: 'النص تأمل شخصي' },
      { actionId: 'event', operation: 'create', entityType: 'calendar_event', title: 'موعد الجري', startAt: '2026-09-29T14:00:00.000Z', endAt: '2026-09-29T15:00:00.000Z', recurrenceFrequency: 'weekly', recurrenceDays: [2], reminderMinutes: 30, parentId: 'task-1', reason: 'ذُكر موعد متكرر' },
    ]);
    expect(snapshot.journals).toEqual([]);
    expect(result.snapshot.journals[0]).toMatchObject({ title: 'تأمل اليوم', mood: 'good', tags: ['صحة'] });
    expect(result.snapshot.calendarEvents[0]).toMatchObject({ title: 'موعد الجري', task_id: 'task-1', reminder_minutes: 30 });
    expect(result.snapshot.calendarEvents[0].recurrence.frequency).toBe('weekly');
  });

  it('cascades a confirmed project deletion and clears dependent references', () => {
    const snapshot = hierarchy();
    snapshot.calendarEvents = [{ id: 'event-1', title: 'موعد', description: '', start_at: '2026-09-29T14:00:00.000Z', end_at: '2026-09-29T15:00:00.000Z', all_day: false, timezone: 'Africa/Cairo', recurrence: { frequency: 'none', interval: 1 }, reminder_minutes: 15, task_id: 'task-1', project_id: 'project-1', pillar_id: 'pillar-1', is_cancelled: false, created_at: '2026-01-01' }];
    const result = applyAiCommandActions(snapshot, [{ actionId: 'delete-project', operation: 'delete', entityType: 'project', targetId: 'project-1', targetTitle: 'الجري', reason: 'طلب المستخدم الحذف صراحة' }]);
    expect(result.snapshot.projects).toEqual([]);
    expect(result.snapshot.tasks).toEqual([]);
    expect(result.snapshot.calendarEvents[0].project_id).toBeNull();
    expect(result.snapshot.calendarEvents[0].task_id).toBeNull();
  });

  it('rejects destructive and relational operations without exact identifiers', () => {
    const snapshot = hierarchy();
    expect(() => applyAiCommandActions(snapshot, [{ actionId: 'delete', operation: 'delete', entityType: 'task', targetTitle: 'جولة صباحية', reason: 'حذف' }])).toThrow('الحذف يحتاج هدفًا محددًا');
    expect(() => applyAiCommandActions(snapshot, [{ actionId: 'task', operation: 'create', entityType: 'task', title: 'مهمة', parentTitle: 'مشروع غير موجود', reason: 'إضافة' }])).toThrow('المشروع');
  });

  it('builds compact context without journal content', () => {
    const snapshot = hierarchy();
    snapshot.journals = [{ id: 'journal-1', title: 'خاص', content: 'نص سري', entry_date: '2026-01-01', tags: [], created_at: '2026-01-01' }];
    const context = buildAiCommandContext(snapshot);
    expect(context).toContainEqual(expect.objectContaining({ id: 'journal-1', type: 'journal', title: 'خاص' }));
    expect(JSON.stringify(context)).not.toContain('نص سري');
  });
});
