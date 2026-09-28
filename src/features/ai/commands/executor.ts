import type { AppDataSnapshot, CalendarEvent, Habit, InboxItem, JournalEntry, Pillar, Project, Task, ValueGoal, Vision, WorshipDefinition } from '../../../types/hierarchical';
import { createId } from '../../../utils/id';
import { toLocalDateKey } from '../../../utils/date';
import type { AiCommandAction, AiCommandContextItem, AiEntityType } from './schema';

const nowIso = () => new Date().toISOString();
const text = (value: unknown, fallback = '') => typeof value === 'string' && value.trim() ? value.trim() : fallback;
const findTitle = <T extends { id: string; title: string }>(items: T[], title?: string) => title ? items.find((item) => item.title.trim().toLowerCase() === title.trim().toLowerCase()) : undefined;

export function buildAiCommandContext(snapshot: AppDataSnapshot): AiCommandContextItem[] {
  const make = (type: AiEntityType, items: Array<{ id: string; title: string; updated_at?: string; status?: string }>, parent: (item: any) => string | null | undefined = () => null) => items.map((item) => ({ id: item.id, type, title: item.title, parentId: parent(item), status: item.status, updatedAt: item.updated_at }));
  return [
    ...make('pillar', snapshot.pillars), ...make('vision', snapshot.visions, (item) => item.pillar_id), ...make('goal', snapshot.goals, (item) => item.vision_id || item.pillar_id),
    ...make('project', snapshot.projects, (item) => item.goal_id), ...make('task', snapshot.tasks, (item) => item.project_id), ...make('habit', snapshot.habits, (item) => item.pillar_id),
    ...make('ibadat', snapshot.worshipDefinitions, (item) => item.pillar_id), ...make('inbox', snapshot.inboxItems), ...make('journal', snapshot.journals), ...make('calendar_event', snapshot.calendarEvents),
  ];
}

function resolveId<T extends { id: string; title: string }>(items: T[], action: AiCommandAction, created: Map<string, string>, requiredLabel: string) {
  const id = (action.parentId && (created.get(action.parentId) || action.parentId)) || findTitle(items, action.parentTitle)?.id;
  if (!id || !items.some((item) => item.id === id)) throw new Error(`لم يتم تحديد ${requiredLabel} صالح للعملية: ${action.title || action.targetTitle || action.actionId}`);
  return id;
}

function patchCommon(action: AiCommandAction) {
  const patch: Record<string, unknown> = { updated_at: nowIso() };
  if (action.title !== undefined) patch.title = text(action.title);
  if (action.description !== undefined) patch.description = action.description;
  if (action.content !== undefined) patch.content = action.content;
  if (action.status !== undefined) patch.status = action.status;
  if (action.priority !== undefined) patch.priority = action.priority;
  if (action.dueDate !== undefined) patch.due_date = action.dueDate;
  return patch;
}

function removeHierarchyForProjects(next: AppDataSnapshot, projectIds: Set<string>) {
  const taskIds = new Set(next.tasks.filter((task) => projectIds.has(task.project_id)).map((task) => task.id));
  next.projects = next.projects.filter((project) => !projectIds.has(project.id));
  next.tasks = next.tasks.filter((task) => !taskIds.has(task.id));
  next.focusSessions = next.focusSessions.map((session) => session.task_id && taskIds.has(session.task_id) ? { ...session, task_id: null } : session);
  next.timeBlocks = next.timeBlocks.map((block) => ({ ...block, task_id: block.task_id && taskIds.has(block.task_id) ? null : block.task_id, project_id: block.project_id && projectIds.has(block.project_id) ? null : block.project_id }));
  next.calendarEvents = next.calendarEvents.map((event) => ({ ...event, task_id: event.task_id && taskIds.has(event.task_id) ? null : event.task_id, project_id: event.project_id && projectIds.has(event.project_id) ? null : event.project_id }));
  next.vaults = next.vaults.map((item) => item.project_id && projectIds.has(item.project_id) ? { ...item, project_id: null } : item);
  next.journals = next.journals.map((item) => item.project_id && projectIds.has(item.project_id) ? { ...item, project_id: null } : item);
}

function deleteEntity(next: AppDataSnapshot, action: AiCommandAction) {
  if (!action.targetId) throw new Error('الحذف يحتاج هدفًا محددًا.');
  const id = action.targetId;
  switch (action.entityType) {
    case 'pillar': {
      const visionIds = new Set(next.visions.filter((item) => item.pillar_id === id).map((item) => item.id));
      const goalIds = new Set(next.goals.filter((item) => item.pillar_id === id || (item.vision_id && visionIds.has(item.vision_id))).map((item) => item.id));
      const projectIds = new Set(next.projects.filter((item) => goalIds.has(item.goal_id)).map((item) => item.id));
      removeHierarchyForProjects(next, projectIds); next.goals = next.goals.filter((item) => !goalIds.has(item.id)); next.visions = next.visions.filter((item) => !visionIds.has(item.id)); next.pillars = next.pillars.filter((item) => item.id !== id);
      next.habits = next.habits.filter((item) => item.pillar_id !== id); next.vaults = next.vaults.filter((item) => item.pillar_id !== id); next.journals = next.journals.map((item) => item.pillar_id === id ? { ...item, pillar_id: null } : item); next.calendarEvents = next.calendarEvents.map((item) => item.pillar_id === id ? { ...item, pillar_id: null } : item);
      const worshipIds = new Set(next.worshipDefinitions.filter((item) => item.pillar_id === id).map((item) => item.id)); next.worshipDefinitions = next.worshipDefinitions.filter((item) => !worshipIds.has(item.id)); next.worshipLogs = next.worshipLogs.filter((item) => !worshipIds.has(item.worship_id)); next.progressionPaths = next.progressionPaths.filter((item) => !worshipIds.has(item.worship_id)); next.quranKhatmas = next.quranKhatmas.filter((item) => !worshipIds.has(item.worship_id)); next.quranHifzTrackers = next.quranHifzTrackers.filter((item) => !worshipIds.has(item.worship_id)); next.sleepSchedules = next.sleepSchedules.filter((item) => item.pillar_id !== id); break;
    }
    case 'vision': { const goalIds = new Set(next.goals.filter((item) => item.vision_id === id).map((item) => item.id)); const projectIds = new Set(next.projects.filter((item) => goalIds.has(item.goal_id)).map((item) => item.id)); removeHierarchyForProjects(next, projectIds); next.goals = next.goals.filter((item) => !goalIds.has(item.id)); next.visions = next.visions.filter((item) => item.id !== id); next.worshipDefinitions = next.worshipDefinitions.map((item) => item.vision_id === id ? { ...item, vision_id: null } : item); break; }
    case 'goal': { const projectIds = new Set(next.projects.filter((item) => item.goal_id === id).map((item) => item.id)); removeHierarchyForProjects(next, projectIds); next.goals = next.goals.filter((item) => item.id !== id); next.worshipDefinitions = next.worshipDefinitions.map((item) => item.goal_id === id ? { ...item, goal_id: null } : item); break; }
    case 'project': removeHierarchyForProjects(next, new Set([id])); break;
    case 'task': next.tasks = next.tasks.filter((item) => item.id !== id); next.focusSessions = next.focusSessions.map((item) => item.task_id === id ? { ...item, task_id: null } : item); next.timeBlocks = next.timeBlocks.map((item) => item.task_id === id ? { ...item, task_id: null } : item); next.calendarEvents = next.calendarEvents.map((item) => item.task_id === id ? { ...item, task_id: null } : item); break;
    case 'habit': next.habits = next.habits.filter((item) => item.id !== id); break;
    case 'ibadat': next.worshipDefinitions = next.worshipDefinitions.filter((item) => item.id !== id); next.worshipLogs = next.worshipLogs.filter((item) => item.worship_id !== id); next.progressionPaths = next.progressionPaths.filter((item) => item.worship_id !== id); next.quranKhatmas = next.quranKhatmas.filter((item) => item.worship_id !== id); next.quranHifzTrackers = next.quranHifzTrackers.filter((item) => item.worship_id !== id); break;
    case 'inbox': next.inboxItems = next.inboxItems.filter((item) => item.id !== id); break;
    case 'journal': next.journals = next.journals.filter((item) => item.id !== id); break;
    case 'calendar_event': next.calendarEvents = next.calendarEvents.filter((item) => item.id !== id); break;
  }
}

export interface AiExecutionResult { snapshot: AppDataSnapshot; createdJournalIds: string[]; removedAudioPaths: string[] }

export function applyAiCommandActions(snapshot: AppDataSnapshot, actions: AiCommandAction[]): AiExecutionResult {
  const next = structuredClone(snapshot);
  const created = new Map<string, string>();
  const createdJournalIds: string[] = [];
  const removedAudioPaths: string[] = [];
  for (const action of actions) {
    if (action.operation === 'delete') { const journal = action.entityType === 'journal' ? next.journals.find((item) => item.id === action.targetId) : undefined; if (journal?.audio_path) removedAudioPaths.push(journal.audio_path); deleteEntity(next, action); continue; }
    if (action.operation === 'update') {
      if (!action.targetId) throw new Error('التعديل يحتاج هدفًا محددًا.');
      const patch = patchCommon(action);
      const update = <T extends { id: string }>(items: T[]) => { if (!items.some((item) => item.id === action.targetId)) throw new Error(`تعذر العثور على الهدف ${action.targetTitle || action.targetId}`); return items.map((item) => item.id === action.targetId ? { ...item, ...patch } : item); };
      switch (action.entityType) {
        case 'pillar': next.pillars = update(next.pillars) as Pillar[]; break; case 'vision': next.visions = update(next.visions) as Vision[]; break; case 'goal': next.goals = update(next.goals) as ValueGoal[]; break; case 'project': next.projects = update(next.projects) as Project[]; break;
        case 'task': next.tasks = update(next.tasks).map((item) => item.id === action.targetId ? { ...item, energy_level: action.energyLevel ?? item.energy_level } : item) as Task[]; break;
        case 'habit': next.habits = update(next.habits).map((item) => item.id === action.targetId ? { ...item, frequency: (action.frequency as Habit['frequency']) || item.frequency } : item) as Habit[]; break;
        case 'ibadat': next.worshipDefinitions = update(next.worshipDefinitions).map((item) => item.id === action.targetId ? { ...item, frequency: (action.frequency as WorshipDefinition['frequency']) || item.frequency, target_count: action.targetCount ?? item.target_count, target_pages: action.targetPages ?? item.target_pages } : item) as WorshipDefinition[]; break;
        case 'inbox': next.inboxItems = update(next.inboxItems) as InboxItem[]; break;
        case 'journal': next.journals = update(next.journals).map((item) => item.id === action.targetId ? { ...item, entry_date: action.date || item.entry_date, mood: action.mood ?? item.mood, tags: action.tags ?? item.tags } : item) as JournalEntry[]; break;
        case 'calendar_event': next.calendarEvents = update(next.calendarEvents).map((item) => item.id === action.targetId ? { ...item, start_at: action.startAt || item.start_at, end_at: action.endAt === undefined ? item.end_at : action.endAt, all_day: action.allDay ?? item.all_day, recurrence: { frequency: action.recurrenceFrequency || item.recurrence.frequency, interval: action.recurrenceInterval || item.recurrence.interval, days_of_week: action.recurrenceDays ?? item.recurrence.days_of_week, until: action.recurrenceUntil === undefined ? item.recurrence.until : action.recurrenceUntil }, reminder_minutes: action.reminderMinutes === undefined ? item.reminder_minutes : action.reminderMinutes } : item) as CalendarEvent[]; break;
      }
      continue;
    }

    const id = createId(); const createdAt = nowIso(); created.set(action.actionId, id);
    switch (action.entityType) {
      case 'pillar': next.pillars.push({ id, title: text(action.title, 'ركيزة جديدة'), description: action.description || '', pillar_group: 'Growth', purpose: '', priority: next.pillars.length + 1, show_on_home: true, status: 'active', progress: 0, created_at: createdAt }); break;
      case 'vision': { const pillarId = resolveId(next.pillars, action, created, 'الركيزة'); next.visions.push({ id, pillar_id: pillarId, title: text(action.title, 'رؤية جديدة'), description: action.description || '', status: 'active', progress: 0, created_at: createdAt }); break; }
      case 'goal': { const parent = (action.parentId && (created.get(action.parentId) || action.parentId)); const vision = next.visions.find((item) => item.id === parent) || findTitle(next.visions, action.parentTitle); const pillar = vision ? next.pillars.find((item) => item.id === vision.pillar_id) : next.pillars.find((item) => item.id === parent) || findTitle(next.pillars, action.parentTitle); if (!pillar) throw new Error('هدف القيمة يحتاج ركيزة أو رؤية محددة.'); next.goals.push({ id, pillar_id: pillar.id, vision_id: vision?.id || null, title: text(action.title, 'هدف جديد'), description: action.description || '', status: 'not_started', target_date: action.dueDate || null, progress: 0, created_at: createdAt }); break; }
      case 'project': { const goalId = resolveId(next.goals, action, created, 'هدف القيمة'); next.projects.push({ id, goal_id: goalId, title: text(action.title, 'مشروع جديد'), description: action.description || '', status: 'planned', progress: 0, start_date: toLocalDateKey(), due_date: action.dueDate || null, custom_fields: {}, created_at: createdAt }); break; }
      case 'task': { const projectId = resolveId(next.projects, action, created, 'المشروع'); next.tasks.push({ id, project_id: projectId, title: text(action.title, 'مهمة جديدة'), description: action.description || '', status: 'todo', priority: action.priority || 'medium', due_date: action.dueDate || null, completed_at: null, energy_level: action.energyLevel, custom_fields: {}, created_at: createdAt }); break; }
      case 'habit': { const pillarId = resolveId(next.pillars, action, created, 'الركيزة'); next.habits.push({ id, pillar_id: pillarId, title: text(action.title, 'عادة جديدة'), description: action.description || '', frequency: (action.frequency as Habit['frequency']) || 'daily', target_days_per_week: 7, custom_days: [], time_of_day: 'anytime', current_streak: 0, longest_streak: 0, completed_dates: [], is_active: true, created_at: createdAt }); break; }
      case 'ibadat': { const pillarId = resolveId(next.pillars, action, created, 'الركيزة'); next.worshipDefinitions.push({ id, pillar_id: pillarId, title: text(action.title, 'عبادة جديدة'), category: (action.category as WorshipDefinition['category']) || 'custom_dua', tracking_type: (action.trackingType as WorshipDefinition['tracking_type']) || 'checkbox', frequency: (action.frequency as WorshipDefinition['frequency']) || 'daily', target_count: action.targetCount, target_pages: action.targetPages, is_active: true, sort_order: next.worshipDefinitions.length, created_at: createdAt }); break; }
      case 'inbox': next.inboxItems.push({ id, title: text(action.title, 'التقاط جديد'), content: action.content || action.description || '', source_type: 'idea', status: 'inbox', created_at: createdAt }); break;
      case 'journal': { const parentId = action.parentId && (created.get(action.parentId) || action.parentId); const entry: JournalEntry = { id, title: text(action.title, 'يومياتي'), content: action.content || action.description || action.title || '', entry_date: action.date || toLocalDateKey(), mood: action.mood || null, tags: action.tags || [], pillar_id: next.pillars.some((item) => item.id === parentId) ? parentId : null, project_id: next.projects.some((item) => item.id === parentId) ? parentId : null, audio_path: null, created_at: createdAt }; next.journals.push(entry); createdJournalIds.push(id); break; }
      case 'calendar_event': { if (!action.startAt || Number.isNaN(Date.parse(action.startAt))) throw new Error('الموعد يحتاج تاريخ بداية واضحًا.'); const endAt = action.endAt || new Date(Date.parse(action.startAt) + 3600000).toISOString(); if (Date.parse(endAt) <= Date.parse(action.startAt)) throw new Error('نهاية الموعد يجب أن تكون بعد بدايته.'); const event: CalendarEvent = { id, title: text(action.title, 'موعد جديد'), description: action.description || '', start_at: action.startAt, end_at: endAt, all_day: action.allDay || false, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo', recurrence: { frequency: action.recurrenceFrequency || 'none', interval: action.recurrenceInterval || 1, days_of_week: action.recurrenceDays || [], until: action.recurrenceUntil || null }, reminder_minutes: action.reminderMinutes ?? 15, task_id: action.parentId && next.tasks.some((item) => item.id === action.parentId) ? action.parentId : null, project_id: action.parentId && next.projects.some((item) => item.id === action.parentId) ? action.parentId : null, pillar_id: action.parentId && next.pillars.some((item) => item.id === action.parentId) ? action.parentId : null, is_cancelled: false, created_at: createdAt }; next.calendarEvents.push(event); break; }
    }
  }
  return { snapshot: next, createdJournalIds, removedAudioPaths };
}
