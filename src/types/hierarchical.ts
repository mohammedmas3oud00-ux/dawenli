/**
 * Core Hierarchical Data Layer Types
 * Architecture: Pillars → Visions → Value Goals → Projects → Tasks
 * Added: Comprehensive Review System (Daily, Weekly, Monthly, Quarterly, Yearly)
 */

export type PillarStatus = 'active' | 'archived';
export type VisionStatus = 'active' | 'archived';
export type ValueGoalStatus = 'not_started' | 'in_progress' | 'completed';
export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Pillar {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  pillar_group: string; // e.g. "Growth", "Vitality", "Impact", "Wealth", "Community"
  purpose: string;      // The pillar's "big why" guiding statement (prominently displayed)
  priority: number;     // Integer priority (1 = highest)
  show_on_home: boolean;
  status: PillarStatus;
  progress: number;     // Numeric 0 - 100 (auto-calculated)
  created_at: string;
  updated_at?: string;
}

export interface Vision {
  id: string;
  user_id?: string;
  pillar_id: string;    // FK -> Pillar
  title: string;
  description: string;
  timeframe?: string;   // e.g. "3-5 سنوات", "2026-2030"
  status: VisionStatus;
  progress: number;     // Numeric 0 - 100 (auto-calculated from Goals)
  created_at: string;
  updated_at?: string;
}

export interface ValueGoal {
  id: string;
  user_id?: string;
  pillar_id: string;    // FK -> Pillar
  vision_id?: string | null; // FK -> Vision
  title: string;
  description: string;
  status: ValueGoalStatus;
  target_date: string | null;
  progress: number;     // Numeric 0 - 100 (auto-calculated from Projects)
  created_at: string;
  updated_at?: string;
}

export type CustomFieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox';

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CustomFieldType;
  options?: string[]; // For select type
  entityType: 'task' | 'project';
}

export type CustomFieldValues = Record<string, string | number | boolean>;

export interface Project {
  id: string;
  user_id?: string;
  goal_id: string;      // FK -> ValueGoal
  title: string;
  description: string;
  status: ProjectStatus;
  progress: number;     // Numeric 0 - 100 (auto-calculated from Tasks)
  start_date: string;
  due_date: string;
  custom_fields?: CustomFieldValues;
  created_at: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  user_id?: string;
  project_id: string;   // FK -> Project
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  estimated_hours?: number;
  energy_level?: EnergyLevel;
  custom_fields?: CustomFieldValues;
  created_at: string;
  updated_at?: string;
}

// -------------------------------------------------------------
// REVIEW SYSTEM TYPES
// -------------------------------------------------------------
export type ReviewFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface SystemReviewSnapshot {
  tasks_completed_count: number;
  tasks_pending_count: number;
  tasks_overdue_count: number;
  projects_active_count: number;
  overall_completion_rate: number;
  pillar_distribution: { pillar_id: string; pillar_title: string; progress: number }[];
  top_active_pillar?: string;
  lagging_pillar?: string;
}

export interface ReviewActionItem {
  id: string;
  title: string;
  project_id?: string;
  priority?: TaskPriority;
  is_converted?: boolean;
}

export interface SystemReview {
  id: string;
  user_id?: string;
  frequency: ReviewFrequency;
  date: string; // e.g. "2026-09-24"
  title: string;
  rating: number; // 1 - 10

  // Relationship to the system
  focus_pillar_id?: string | null; // specific pillar or all
  focus_goal_ids?: string[];
  focus_project_ids?: string[];

  // Manual Reflection Answers
  wins: string;           // أبرز الانتصارات والإنجازات
  challenges: string;     // التحديات والمعوقات
  lessons: string;        // الدروس المستفادة والتحسينات
  next_commitments: string; // التزامات وأولويات الفترة القادمة
  notes: string;          // ملاحظات وتأملات عامة

  // Snapshot & System state at review time
  snapshot: SystemReviewSnapshot;

  // Smart Automated Audit & Recommendations
  system_health_score: number; // 0 - 100
  smart_summary: string;
  strengths: string[];
  bottlenecks: string[];
  recommendations: string[];
  action_items: ReviewActionItem[];

  is_ai_generated?: boolean;
  created_at: string;
  updated_at?: string;
}

// -------------------------------------------------------------
// GTD & PPV EXTENSIONS: INBOX, HABITS, VAULTS
// -------------------------------------------------------------
export type InboxSourceType = 'idea' | 'task_seed' | 'reference' | 'question' | 'link';
export type InboxStatus = 'inbox' | 'processed' | 'archived';

export interface InboxItem {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  source_type: InboxSourceType;
  url?: string;
  status: InboxStatus;
  created_at: string;
  processed_into?: {
    entity_type: 'task' | 'project' | 'goal' | 'habit' | 'vault';
    entity_id: string;
    target_title: string;
  };
}

export type HabitTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type HabitFrequency = 'daily' | 'weekdays' | 'custom_days';

export interface Habit {
  id: string;
  user_id?: string;
  pillar_id: string;    // Direct relation to Pillar
  title: string;
  description: string;
  frequency: HabitFrequency;
  target_days_per_week: number;
  time_of_day: HabitTimeOfDay;
  current_streak: number;
  longest_streak: number;
  best_streak?: number;
  completed_dates: string[]; // List of YYYY-MM-DD strings
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export type VaultType = 'notes' | 'books' | 'resources' | 'templates';
export type VaultStatus = 'active' | 'reading' | 'completed' | 'someday' | 'archived' | 'reference';

export interface VaultItem {
  id: string;
  user_id?: string;
  pillar_id: string;          // Related Pillar
  project_id?: string | null; // Optional relation to Project
  title: string;
  vault_type: VaultType;
  summary: string;
  content: string;
  author_or_source?: string;
  url?: string;
  tags: string[];
  rating?: number; // 1 to 5
  status?: VaultStatus;
  created_at: string;
  updated_at?: string;
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  type: 'root' | 'pillar' | 'vision' | 'goal' | 'project';
}

export type SidebarTab = 
  | 'hierarchy' 
  | 'pillars' 
  | 'visions' 
  | 'goals' 
  | 'projects' 
  | 'tasks' 
  | 'focus'
  | 'timeblocking'
  | 'inbox'
  | 'habits'
  | 'vaults'
  | 'reviews';

// -------------------------------------------------------------
// FOCUS & TIME BLOCKING TYPES
// -------------------------------------------------------------
export type EnergyLevel = 'high' | 'medium' | 'low';

export type FocusMode = 'pomodoro' | 'flowtime';

export interface FocusSessionRecord {
  id: string;
  task_id?: string | null;
  task_title?: string;
  project_title?: string;
  pillar_title?: string;
  mode: FocusMode;
  duration_seconds: number;
  date: string; // YYYY-MM-DD
  completed_at: string; // ISO
  notes?: string;
  break_seconds?: number;
  distractions_count?: number;
}

export type TimeBlockCategory = 
  | 'deep_work' 
  | 'shallow_work' 
  | 'meeting' 
  | 'health_habit' 
  | 'learning' 
  | 'rest' 
  | 'personal';

export interface TimeBlock {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  start_time: string; // "09:00"
  end_time: string; // "10:30"
  title: string;
  task_id?: string | null;
  project_id?: string | null;
  pillar_id?: string | null;
  category: TimeBlockCategory;
  color?: string;
  is_completed: boolean;
  notes?: string;
  created_at: string;
}

