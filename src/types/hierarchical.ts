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
  user_id?: string;
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
  due_date: string | null;
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
  worship_compliance_rate?: number;
  worship_streak?: number;
  worship_progression_summary?: string;
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
  converted_to?: 'task' | 'project' | 'goal' | 'habit' | 'vault' | null;
  converted_entity_id?: string | null;
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
  custom_days?: number[]; // JavaScript weekdays: Sunday = 0
  time_of_day: HabitTimeOfDay;
  current_streak: number;
  longest_streak: number;
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
  | 'reviews'
  | 'ibadat';

// -------------------------------------------------------------
// FOCUS & TIME BLOCKING TYPES
// -------------------------------------------------------------
export type EnergyLevel = 'high' | 'medium' | 'low';

export type FocusMode = 'pomodoro' | 'flowtime';

export interface FocusSessionRecord {
  id: string;
  user_id?: string;
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
  | 'personal'
  | 'worship';

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

// -------------------------------------------------------------
// IBADAT: A separate, private domain from general habits.
// -------------------------------------------------------------
export type WorshipCategory = 'salah' | 'sunnah_rawatib' | 'adhkar' | 'quran_wird' | 'qiyam' | 'fasting' | 'sadaqah' | 'custom_dua' | 'quran_hifz';
export type WorshipTrackingType = 'checkbox' | 'counter' | 'multi_option' | 'amount' | 'pages';
export type SalahPerformance = 'ada' | 'qada' | 'missed';
export type SalahCongregation = 'jamaah' | 'fard';

export interface WorshipDefinition {
  id: string;
  user_id?: string;
  pillar_id: string;
  vision_id?: string | null;
  goal_id?: string | null;
  title: string;
  category: WorshipCategory;
  tracking_type: WorshipTrackingType;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  scheduled_days?: number[];
  time_of_day?: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'morning' | 'evening' | 'night' | 'anytime';
  target_count?: number | null;
  target_pages?: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

export interface WorshipLog {
  id: string;
  user_id?: string;
  worship_id: string;
  date: string;
  is_completed: boolean;
  count?: number | null;
  amount?: number | null;
  pages_read?: number | null;
  performance?: SalahPerformance | null;
  congregation?: SalahCongregation | null;
  sunnah_completed?: boolean | null;
  rakaat_count?: number | null;
  performed_at_time?: string | null;
  fasting_type?: 'monday_thursday' | 'white_days' | 'dawood' | 'ramadan' | 'other' | null;
  notes?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface ProgressionStage { index: number; title: string; description: string; target_value: number; days_required: number; suggested_time?: string; }
export interface ProgressionPath {
  id: string; user_id?: string; worship_id: string; title: string; stages: ProgressionStage[];
  current_stage_index: number; stage_start_date: string; consecutive_days: number;
  auto_promote: boolean; last_promotion_date?: string | null; created_at: string; updated_at?: string;
}
export interface QuranKhatma {
  id: string; user_id?: string; worship_id: string; khatma_number: number; start_date: string; end_date?: string | null;
  target_days?: number | null; current_page: number; current_juz: number; daily_target_pages: number; is_completed: boolean; created_at: string; updated_at?: string;
}
export interface QuranHifzTracker {
  id: string; user_id?: string; worship_id: string; pillar_id: string; vision_id?: string | null; goal_id?: string | null;
  surahs: Array<{ surah_number: number; surah_name: string; total_ayat: number; memorized_ayat: number; last_review_date?: string; review_quality?: 'excellent' | 'good' | 'needs_review'; is_completed: boolean }>;
  total_memorized_pages: number; daily_review_pages: number; created_at: string; updated_at?: string;
}
export interface SleepSchedule {
  id: string; user_id?: string; pillar_id: string; ultimate_bedtime: string; ultimate_waketime: string;
  current_bedtime: string; current_waketime: string; adjustment_minutes: number; adjustment_frequency_days: number;
  linked_qiyam_path_id?: string | null; is_active: boolean; created_at: string; updated_at?: string;
}

export interface AppDataSnapshot {
  schemaVersion: 4;
  pillars: Pillar[];
  visions: Vision[];
  goals: ValueGoal[];
  projects: Project[];
  tasks: Task[];
  reviews: SystemReview[];
  inboxItems: InboxItem[];
  habits: Habit[];
  vaults: VaultItem[];
  focusSessions: FocusSessionRecord[];
  timeBlocks: TimeBlock[];
  customFieldDefinitions: CustomFieldDefinition[];
  worshipDefinitions: WorshipDefinition[];
  worshipLogs: WorshipLog[];
  progressionPaths: ProgressionPath[];
  quranKhatmas: QuranKhatma[];
  quranHifzTrackers: QuranHifzTracker[];
  sleepSchedules: SleepSchedule[];
}

