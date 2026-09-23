import { 
  Pillar, 
  Vision, 
  ValueGoal,
  StrategicGoal, 
  Project, 
  Task, 
  TeamMember, 
  Milestone,
  Habit,
  MuslimDayChecklist,
  KnowledgeItem,
  NoteIdea,
  InboxItem,
  ReviewCycleEntry 
} from '../types';
import { 
  INITIAL_PILLARS, 
  INITIAL_VALUE_GOALS,
  INITIAL_VISIONS, 
  INITIAL_GOALS, 
  INITIAL_MEMBERS, 
  INITIAL_PROJECTS, 
  INITIAL_TASKS, 
  INITIAL_MILESTONES,
  INITIAL_HABITS,
  INITIAL_MUSLIM_DAY,
  INITIAL_KNOWLEDGE_ITEMS,
  INITIAL_NOTES_IDEAS,
  INITIAL_INBOX,
  INITIAL_REVIEWS
} from '../data/initialData';

const STORAGE_KEYS = {
  PILLARS: 'pos_pillars_v3',
  VALUE_GOALS: 'pos_value_goals_v3',
  VISIONS: 'pos_visions_v3',
  GOALS: 'pos_goals_v3',
  PROJECTS: 'pos_projects_v3',
  TASKS: 'pos_tasks_v3',
  MEMBERS: 'pos_members_v3',
  MILESTONES: 'pos_milestones_v3',
  HABITS: 'pos_habits_v3',
  MUSLIM_DAY: 'pos_muslim_day_v3',
  KNOWLEDGE: 'pos_knowledge_v3',
  NOTES: 'pos_notes_v3',
  INBOX: 'pos_inbox_v3',
  REVIEWS: 'pos_reviews_v3',
};

// 1. Pillars
export function getStoredPillars(): Pillar[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PILLARS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load pillars', e);
  }
  return INITIAL_PILLARS;
}

export function savePillars(pillars: Pillar[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PILLARS, JSON.stringify(pillars));
  } catch (e) {
    console.error('Failed to save pillars', e);
  }
}

// 2. Value Goals
export function getStoredValueGoals(): ValueGoal[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VALUE_GOALS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load value goals', e);
  }
  return INITIAL_VALUE_GOALS;
}

export function saveValueGoals(valGoals: ValueGoal[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.VALUE_GOALS, JSON.stringify(valGoals));
  } catch (e) {
    console.error('Failed to save value goals', e);
  }
}

// 3. Visions
export function getStoredVisions(): Vision[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VISIONS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load visions', e);
  }
  return INITIAL_VISIONS;
}

export function saveVisions(visions: Vision[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.VISIONS, JSON.stringify(visions));
  } catch (e) {
    console.error('Failed to save visions', e);
  }
}

// 4. Goals (Outcome Goals)
export function getStoredGoals(): StrategicGoal[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load goals', e);
  }
  return INITIAL_GOALS;
}

export function saveGoals(goals: StrategicGoal[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  } catch (e) {
    console.error('Failed to save goals', e);
  }
}

// 5. Projects
export function getStoredProjects(): Project[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load projects', e);
  }
  return INITIAL_PROJECTS;
}

export function saveProjects(projects: Project[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects', e);
  }
}

// 6. Tasks
export function getStoredTasks(): Task[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load tasks', e);
  }
  return INITIAL_TASKS;
}

export function saveTasks(tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks', e);
  }
}

// 7. Day Muslim
export function getStoredMuslimDay(): MuslimDayChecklist {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MUSLIM_DAY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load muslim day checklist', e);
  }
  return INITIAL_MUSLIM_DAY;
}

export function saveMuslimDay(day: MuslimDayChecklist) {
  try {
    localStorage.setItem(STORAGE_KEYS.MUSLIM_DAY, JSON.stringify(day));
  } catch (e) {
    console.error('Failed to save muslim day checklist', e);
  }
}

// 8. Habits
export function getStoredHabits(): Habit[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load habits', e);
  }
  return INITIAL_HABITS;
}

export function saveHabits(habits: Habit[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  } catch (e) {
    console.error('Failed to save habits', e);
  }
}

// 9. Knowledge Items
export function getStoredKnowledge(): KnowledgeItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load knowledge', e);
  }
  return INITIAL_KNOWLEDGE_ITEMS;
}

export function saveKnowledge(items: KnowledgeItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.KNOWLEDGE, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save knowledge', e);
  }
}

// 10. Notes & Ideas
export function getStoredNotes(): NoteIdea[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load notes', e);
  }
  return INITIAL_NOTES_IDEAS;
}

export function saveNotes(notes: NoteIdea[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save notes', e);
  }
}

// 11. Inbox Items
export function getStoredInbox(): InboxItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INBOX);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load inbox', e);
  }
  return INITIAL_INBOX;
}

export function saveInbox(inbox: InboxItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(inbox));
  } catch (e) {
    console.error('Failed to save inbox', e);
  }
}

// 12. Reviews
export function getStoredReviews(): ReviewCycleEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load reviews', e);
  }
  return INITIAL_REVIEWS;
}

export function saveReviews(reviews: ReviewCycleEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  } catch (e) {
    console.error('Failed to save reviews', e);
  }
}

// Members
export function getStoredMembers(): TeamMember[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load members', e);
  }
  return INITIAL_MEMBERS;
}

export function saveMembers(members: TeamMember[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.error('Failed to save members', e);
  }
}

// Milestones
export function getStoredMilestones(): Milestone[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MILESTONES);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load milestones', e);
  }
  return INITIAL_MILESTONES;
}

export function saveMilestones(milestones: Milestone[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(milestones));
  } catch (e) {
    console.error('Failed to save milestones', e);
  }
}

// Reset Demo Data
export function resetToDemoData() {
  savePillars(INITIAL_PILLARS);
  saveValueGoals(INITIAL_VALUE_GOALS);
  saveVisions(INITIAL_VISIONS);
  saveGoals(INITIAL_GOALS);
  saveProjects(INITIAL_PROJECTS);
  saveTasks(INITIAL_TASKS);
  saveMuslimDay(INITIAL_MUSLIM_DAY);
  saveHabits(INITIAL_HABITS);
  saveKnowledge(INITIAL_KNOWLEDGE_ITEMS);
  saveNotes(INITIAL_NOTES_IDEAS);
  saveInbox(INITIAL_INBOX);
  saveReviews(INITIAL_REVIEWS);
  saveMembers(INITIAL_MEMBERS);
  saveMilestones(INITIAL_MILESTONES);
}
