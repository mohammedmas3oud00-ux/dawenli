export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'completed';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed';

export type EnergyLevel = 'low' | 'medium' | 'high'; // 🔋 منخفض | ⚡ متوسط | 🚀 عالي

export type StrategicGoalStatus = 'active' | 'achieved' | 'at_risk' | 'delayed';

export type ProjectCategory = 
  | 'تطوير البرمجيات'
  | 'التصميم وتجربة المستخدم'
  | 'التسويق الرقمي'
  | 'البنية التحتية والشبكات'
  | 'إدارة العمليات'
  | 'الجودة والاختبار'
  | 'عام';

export type ProgressCalculationMode = 'standard' | 'weighted' | 'subtask_inclusive';

// 1. Pillar (الركائز الكبرى في الـ Personal OS)
export interface Pillar {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  group?: 'Growth' | 'Vitality' | 'Impact' | 'Wealth' | 'Community' | 'Core';
  purpose?: string; // الغاية الكبرى | Purpose
  valueGoals?: string[]; // أهداف القيم المرتبطة
  habits?: string[];
  priority?: number;
  showOnHome?: boolean;
}

// 2. Vision (الرؤية)
export interface Vision {
  id: string;
  pillarId: string;
  title: string;
  description: string;
  timeHorizon: string;
  targetYear: number;
}

// 3. Value Goal (أهداف القيم والمبادئ)
export interface ValueGoal {
  id: string;
  pillarId: string;
  title: string;
  description: string;
  why: string; // لماذا هذا الهدف قيمي مهم
  status: 'active' | 'archived';
  outcomeGoalIds?: string[];
}

// 4. Outcome Goal (الأهداف المرحلية الرقمية - Outcome Goals)
export interface StrategicGoal {
  id: string;
  visionId?: string;
  pillarId?: string;
  valueGoalId?: string;
  title: string;
  description: string;
  targetMetric: string;
  currentMetric?: string;
  quarter: string;
  dueDate: string;
  weight: number; // 1 to 10
  status: StrategicGoalStatus;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
}

// 5. Action Items / Tasks
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  weight: number; // 1 to 10 - صعوبة أو وزن المهمة
  estimatedHours: number;
  loggedHours: number;
  startDate: string;
  dueDate: string;
  assigneeId: string;
  subtasks: SubTask[];
  tags: string[];
  createdAt: string;
  completedAt?: string;

  // خصائص الأثر والأولوية الذكية والربط الاستراتيجي
  valueScore: number; // 1 to 10 - القيمة الناتجة
  impactScore: number; // 1 to 10 - التأثير الاستراتيجي
  energyLevel: EnergyLevel; // 'low' (🔋) | 'medium' (⚡) | 'high' (🚀)
  dependencies: string[]; // معرّفات المهام التي يجب إنجازها أولاً
  goalAlignmentScore?: number; // 1 to 10 - قوة الارتباط بالهدف الأكبر
  isTodayAction?: boolean; // للمهام اليومية في Action Zone
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  dueDate: string;
  completed: boolean;
  order: number;
}

// 6. Project (المشاريع)
export interface Project {
  id: string;
  goalId?: string; // رابط الهدف الاستراتيجي أو Outcome Goal
  pillarId?: string; // رابط الركيزة المباشر
  name: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: Priority;
  startDate: string;
  dueDate: string;
  calculationMode: ProgressCalculationMode;
  targetBudgetHours?: number;
  color: string;
  memberIds: string[];
  createdAt: string;
}

// 7. Day Muslim (يوم المسلم - العبادات والورد اليومي)
export interface MuslimDayChecklist {
  date: string; // YYYY-MM-DD
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  sunnahPrayers: boolean; // السنن والرواتب
  morningAdhkar: boolean; // أذكار الصباح
  eveningAdhkar: boolean; // أذكار المساء
  quranWird: boolean; // ورد القرآن الكريم
  quranJuzOrSurah?: string; // ما تمت قراءته
  qiyamOrWitr: boolean; // قيام الليل / الوتر
  sadaqah: boolean; // صدقة اليوم
  reflectionNote?: string; // محاسبة النفس وتأمل
}

// 8. Habits & Routines (العادات والروتينات)
export interface Habit {
  id: string;
  title: string;
  category: 'Spiritual' | 'Physical' | 'Mental' | 'Work' | 'Other';
  pillarId?: string;
  frequency: 'daily' | 'weekdays' | 'weekly';
  targetDaysPerWeek: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  streak: number;
  history: Record<string, boolean>; // 'YYYY-MM-DD': true
}

// 9. Knowledge Vault Item (مستودع المعرفة: كتب، وسائط، دورات، مستندات)
export type KnowledgeVaultType = 'book' | 'course' | 'media' | 'document' | 'tool';

export interface KnowledgeItem {
  id: string;
  title: string;
  type: KnowledgeVaultType;
  authorOrSource: string;
  pillarId?: string;
  status: 'want_to_consume' | 'in_progress' | 'completed';
  rating?: number; // 1 to 5
  keyTakeaway: string;
  url?: string;
  tags: string[];
  addedAt: string;
}

// 10. Notes, Meetings & Ideas (الملاحظات والأفكار والاجتماعات)
export interface NoteIdea {
  id: string;
  title: string;
  content: string;
  type: 'idea' | 'meeting' | 'note';
  tags: string[];
  pillarId?: string;
  projectId?: string;
  pinned: boolean;
  createdAt: string;
}

// 11. Quick Capture Inbox Item (صندوق الوارد السريع)
export interface InboxItem {
  id: string;
  text: string;
  createdAt: string;
  type: 'task' | 'idea' | 'note' | 'resource';
  processed: boolean;
}

// 12. Cycles & Reviews (الدورات والمراجعات: يومية، أسبوعية، إنجازات وتحديات)
export interface ReviewCycleEntry {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  date: string;
  title: string;
  score: number; // 1 to 10
  accomplishments: string[]; // Accomplishments - ما تحقق بنجاح
  disappointmentsAndLessons: string[]; // Disappointments & Lessons - العثرات والدروس
  gratitude: string[]; // الامتنان والحمد
  notes: string;
}

// Rollup calculation stats interfaces
export interface ProjectProgressStats {
  percentage: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  inReviewTasks: number;
  todoTasks: number;
  totalWeight: number;
  completedWeight: number;
  totalEstimatedHours: number;
  loggedHours: number;
  totalSubtasks: number;
  completedSubtasks: number;
  isOverdue: boolean;
  daysRemaining: number;
  health: 'on_track' | 'at_risk' | 'delayed' | 'completed';
}

export interface GoalProgressStats {
  percentage: number;
  totalProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  health: 'on_track' | 'at_risk' | 'delayed' | 'completed';
}

export interface VisionProgressStats {
  percentage: number;
  totalGoals: number;
  completedGoals: number;
  totalProjects: number;
  totalTasks: number;
}

export interface PillarProgressStats {
  percentage: number;
  totalVisions: number;
  totalGoals: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
}

export interface RecommendedTaskResult {
  task: Task;
  project?: Project;
  goal?: StrategicGoal;
  vision?: Vision;
  pillar?: Pillar;
  priorityScore: number;
  fitScore: number;
  reason: string;
  isBlocked: boolean;
  blockingTasks: Task[];
}
