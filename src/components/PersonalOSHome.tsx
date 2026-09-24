import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Compass, 
  Flame, 
  Layers, 
  BookOpen, 
  CheckSquare, 
  ArrowLeft, 
  ArrowRight,
  TrendingUp, 
  FolderKanban, 
  FileText, 
  Plus, 
  Zap, 
  Heart,
  Scale,
  Sun,
  Moon,
  ChevronRight,
  Target,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { 
  Pillar, 
  Vision,
  Project, 
  Task, 
  Habit, 
  MuslimDayChecklist, 
  StrategicGoal, 
  ValueGoal,
  InboxItem 
} from '../types';
import { calculatePillarProgress, calculateProjectProgress } from '../utils/progressCalculator';

interface PersonalOSHomeProps {
  pillars: Pillar[];
  visions: Vision[];
  valueGoals: ValueGoal[];
  goals: StrategicGoal[];
  projects: Project[];
  tasks: Task[];
  habits: Habit[];
  muslimDay: MuslimDayChecklist;
  inbox: InboxItem[];
  onNavigate: (view: any) => void;
  onToggleMuslimCheck: (key: keyof MuslimDayChecklist) => void;
  onToggleHabit: (habitId: string) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onSelectTask: (task: Task) => void;
  onOpenQuickCapture: () => void;
}

export const PersonalOSHome: React.FC<PersonalOSHomeProps> = ({
  pillars,
  visions,
  valueGoals,
  goals,
  projects,
  tasks,
  habits,
  muslimDay,
  inbox,
  onNavigate,
  onToggleMuslimCheck,
  onToggleHabit,
  onToggleTaskComplete,
  onSelectTask,
  onOpenQuickCapture,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate today's Muslim day completion
  const muslimKeys: (keyof MuslimDayChecklist)[] = [
    'fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 
    'sunnahPrayers', 'morningAdhkar', 'eveningAdhkar', 
    'quranWird', 'qiyamOrWitr', 'sadaqah'
  ];
  const completedMuslimItems = muslimKeys.filter((k) => !!muslimDay[k]).length;
  const muslimDayPercent = Math.round((completedMuslimItems / muslimKeys.length) * 100);

  // Today's Top 3 Focus Actions
  const todayTasks = tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => (b.impactScore || 5) * (b.valueScore || 5) - (a.impactScore || 5) * (a.valueScore || 5))
    .slice(0, 3);

  // Unprocessed inbox count
  const unprocessedInboxCount = inbox.filter((i) => !i.processed).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Notion Workspace Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <span className="text-base">🏠</span>
              <span>Personal Operating System · نظام إدارة الحياة المتكامل</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>مركز القيادة اليومية</span>
              <span className="text-xs font-normal px-2.5 py-1 bg-white/10 rounded-md text-slate-200 border border-white/10">
                Home — Personal OS
              </span>
            </h1>
            
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              «ابدأ منها يوميًا» — ربط أفعالك اليومية بركائزك الكبرى وغاياتك العليا، مع الموازنة التامة بين العبادة وبناء الذات والعمل والإنتاجية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenQuickCapture}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>التقاط سريع</span>
            </button>

            <button
              onClick={() => onNavigate('recommender')}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all shadow-sm cursor-pointer border border-indigo-400/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>أفضل مهمة الآن</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notion Top Notice Aside */}
      <aside className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
        <div className="flex items-center gap-3">
          <span className="text-xl">🏠</span>
          <div>
            <span className="font-bold">الواجهة الرئيسية:</span>
            <span className="text-amber-800 mr-1.5">ابدأ منها يومك، راجع عباداتك، وحدد أولوياتك قبل الشروع في العمل.</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-amber-800 font-medium">
          <button 
            onClick={() => onNavigate('vaults')}
            className="hover:text-indigo-700 underline decoration-amber-300 underline-offset-4 cursor-pointer"
          >
            System Library (مستودع المعرفة)
          </button>
          <span>·</span>
          <button 
            onClick={() => onNavigate('reviews')}
            className="hover:text-indigo-700 underline decoration-amber-300 underline-offset-4 cursor-pointer"
          >
            Cycles & Reviews (المراجعات الدورية)
          </button>
        </div>
      </aside>

      {/* FOCUS & ALIGN (Notion Asides Matrix) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wider text-slate-500 uppercase flex items-center gap-2">
            <span>FOCUS & ALIGN · التركيز والتناغم الاستراتيجي</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Box 1: FOCUS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-indigo-300 transition-all">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold">
                🎯
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">FOCUS (مناطق التركيز)</h3>
                <p className="text-[11px] text-slate-500">التنفيذ اليومي والعمل المباشر</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => onNavigate('action_zone')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer text-right group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⚡</span>
                  <span className="font-semibold group-hover:underline">Action Zone (منطقة العمل)</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400 group-hover:text-indigo-600">
                  {tasks.filter((t) => t.status !== 'completed').length} مهام
                </span>
              </button>

              <button
                onClick={() => onNavigate('day_muslim')}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900 border border-emerald-100 transition-colors cursor-pointer text-right group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🕌</span>
                  <span className="font-bold">Day Muslim (يوم المسلم)</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-emerald-700">
                  {muslimDayPercent}% منجز
                </span>
              </button>

              <button
                onClick={() => onNavigate('inbox')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer text-right group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📥</span>
                  <span className="font-medium group-hover:underline">Inbox (صندوق الوارد)</span>
                </div>
                {unprocessedInboxCount > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono text-[10px] font-bold">
                    {unprocessedInboxCount} جديد
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">مفرغ</span>
                )}
              </button>

              <button
                onClick={() => onNavigate('projects')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer text-right group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📁</span>
                  <span className="font-medium group-hover:underline">Projects (المشاريع النشطة)</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  {projects.length} مشاريع
                </span>
              </button>

              <button
                onClick={() => onNavigate('notes')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer text-right group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📝</span>
                  <span className="font-medium group-hover:underline">Notes, Meetings & Ideas</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-180" />
              </button>

              <button
                onClick={() => onNavigate('vaults')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer text-right group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📚</span>
                  <span className="font-medium group-hover:underline">Knowledge Vault (المستودع)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-180" />
              </button>
            </div>
          </div>

          {/* Box 2: ALIGN */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-indigo-300 transition-all">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                🧭
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">ALIGN (المواءمة الكبرى)</h3>
                <p className="text-[11px] text-slate-500">ربط المسار بالغاية والوجهة</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => onNavigate('alignment_zone')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer text-right group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🏛️</span>
                  <span className="font-bold group-hover:underline">Alignment Zone (الهرم الاستراتيجي)</span>
                </div>
                <span className="font-mono text-[11px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {pillars.length} ركائز
                </span>
              </button>

              <button
                onClick={() => onNavigate('pillars_view')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer text-right group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">💎</span>
                  <span className="font-medium group-hover:underline">Pillars (الركائز الأساسية)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-180" />
              </button>

              <button
                onClick={() => onNavigate('alignment_zone')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer text-right group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🎯</span>
                  <span className="font-medium group-hover:underline">Outcome Goals (الأهداف المرحلية)</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  {goals.length} أهداف
                </span>
              </button>

              <button
                onClick={() => onNavigate('alignment_zone')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer text-right group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⚖️</span>
                  <span className="font-medium group-hover:underline">Value Goals (أهداف القيم والمبادئ)</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  {valueGoals.length} أهداف
                </span>
              </button>

              <button
                onClick={() => onNavigate('habits')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer text-right group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🔄</span>
                  <span className="font-medium group-hover:underline">Habits & Routines (العادات)</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-600">
                  {habits.length} عادات
                </span>
              </button>
            </div>
          </div>

          {/* Box 3: PERIOD REVIEWS & CYCLES */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
                  ⏳
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">CYCLES & REVIEWS</h3>
                  <p className="text-[11px] text-slate-500">دورات المراجعة والمحاسبة الدورية</p>
                </div>
              </div>

              {/* D / W / M / Q Buttons like in user Notion snippet */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <button
                  onClick={() => onNavigate('reviews')}
                  className="flex flex-col items-center justify-center py-2 px-1 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-lg transition-all cursor-pointer group"
                >
                  <span className="text-sm">☀️</span>
                  <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600">D (يومي)</span>
                </button>

                <button
                  onClick={() => onNavigate('reviews')}
                  className="flex flex-col items-center justify-center py-2 px-1 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-lg transition-all cursor-pointer group"
                >
                  <span className="text-sm">📆</span>
                  <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600">W (أسبوعي)</span>
                </button>

                <button
                  onClick={() => onNavigate('reviews')}
                  className="flex flex-col items-center justify-center py-2 px-1 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-lg transition-all cursor-pointer group"
                >
                  <span className="text-sm">🗓️</span>
                  <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600">M (شهري)</span>
                </button>

                <button
                  onClick={() => onNavigate('reviews')}
                  className="flex flex-col items-center justify-center py-2 px-1 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-lg transition-all cursor-pointer group"
                >
                  <span className="text-sm">🧭</span>
                  <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600">Q (ربعي)</span>
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => onNavigate('reviews')}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer text-right group"
                >
                  <span className="group-hover:underline">🏆 Accomplishments (سجل الإنجازات)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-180" />
                </button>

                <button
                  onClick={() => onNavigate('reviews')}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer text-right group"
                >
                  <span className="group-hover:underline">💡 Disappointments & Lessons (الدروس المستفادة)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-180" />
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              المراجعة الدورية هي سر الانضباط وتصحيح البوصلة باستمرار.
            </div>
          </div>

        </div>
      </section>

      {/* Grid: Day Muslim Snapshot + Habits Check-in + Today's Top Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 5 Cols: Day Muslim Snapshot */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                🕌
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">يوم المسلم (اليوم)</h3>
                <p className="text-[10px] text-slate-500">الصلاة في وقتها، الورد، والأذكار</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('day_muslim')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>فتح السجل الكامل</span>
              <ChevronRight className="w-3 h-3 rotate-180" />
            </button>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-slate-600">نسبة الالتزام بالعبادات اليوم:</span>
              <span className="font-mono font-bold text-emerald-700">{muslimDayPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-600 rounded-full transition-all duration-500" 
                style={{ width: `${muslimDayPercent}%` }}
              />
            </div>
          </div>

          {/* Prayers Checklist */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {[
              { id: 'fajr', label: 'الفجر' },
              { id: 'dhuhr', label: 'الظهر' },
              { id: 'asr', label: 'العصر' },
              { id: 'maghrib', label: 'المغرب' },
              { id: 'isha', label: 'العشاء' },
            ].map((p) => {
              const checked = !!muslimDay[p.id as keyof MuslimDayChecklist];
              return (
                <button
                  key={p.id}
                  onClick={() => onToggleMuslimCheck(p.id as keyof MuslimDayChecklist)}
                  className={`py-2 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                    checked
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="text-[11px] font-bold">{p.label}</div>
                  <div className="text-xs mt-0.5">{checked ? '✓' : '○'}</div>
                </button>
              );
            })}
          </div>

          {/* Core Daily Wirds */}
          <div className="space-y-2 pt-1 text-xs">
            <div 
              onClick={() => onToggleMuslimCheck('morningAdhkar')}
              className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                muslimDay.morningAdhkar ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">أذكار الصباح</span>
              </div>
              <input 
                type="checkbox" 
                checked={muslimDay.morningAdhkar} 
                onChange={() => onToggleMuslimCheck('morningAdhkar')}
                className="w-4 h-4 text-emerald-600 rounded-sm cursor-pointer"
              />
            </div>

            <div 
              onClick={() => onToggleMuslimCheck('eveningAdhkar')}
              className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                muslimDay.eveningAdhkar ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold">أذكار المساء</span>
              </div>
              <input 
                type="checkbox" 
                checked={muslimDay.eveningAdhkar} 
                onChange={() => onToggleMuslimCheck('eveningAdhkar')}
                className="w-4 h-4 text-emerald-600 rounded-sm cursor-pointer"
              />
            </div>

            <div 
              onClick={() => onToggleMuslimCheck('quranWird')}
              className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                muslimDay.quranWird ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-semibold block">ورد القرآن الكريم</span>
                  <span className="text-[10px] text-slate-500">{muslimDay.quranJuzOrSurah || 'الجزء اليومي'}</span>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={muslimDay.quranWird} 
                onChange={() => onToggleMuslimCheck('quranWird')}
                className="w-4 h-4 text-emerald-600 rounded-sm cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Top 3 Action Focus + Habit Tracker */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Top 3 Action Items */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  ⚡
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">أولويات اليوم</h3>
                  <p className="text-[10px] text-slate-500">أعلى المهام أثراً وقيمة بحسب خوارزمية الترتيب</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>جميع المهام ({tasks.length})</span>
                <ChevronRight className="w-3 h-3 rotate-180" />
              </button>
            </div>

            <div className="space-y-2">
              {todayTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-lg">
                  أحسنت! لا توجد مهام ذات أولوية معلقة لليوم.
                </div>
              ) : (
                todayTasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg flex items-center justify-between gap-3 transition-colors text-xs"
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={task.status === 'completed'}
                          onChange={() => onToggleTaskComplete(task.id)}
                          className="mt-0.5 w-4 h-4 text-indigo-600 rounded-sm cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 
                            onClick={() => onSelectTask(task)}
                            className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer truncate"
                          >
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="truncate max-w-[120px]">{project?.name || 'مشروع عام'}</span>
                            <span>·</span>
                            <span className="font-mono text-indigo-600 font-semibold">أثر: {task.impactScore}/10</span>
                            <span>·</span>
                            <span>{task.dueDate}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigate('recommender')}
                        title="تنفيذ في Focus Mode"
                        className="px-2 py-1 bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 text-slate-700 rounded text-[11px] font-semibold transition-all shrink-0 cursor-pointer"
                      >
                        تركيز ⚡
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Habits Snapshot */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                  🔄
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">عادات اليوم</h3>
                  <p className="text-[10px] text-slate-500">التكرار اليومي هو أساس صياغة الهوية</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('habits')}
                className="text-xs font-bold text-purple-700 hover:text-purple-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>مصفوفة العادات</span>
                <ChevronRight className="w-3 h-3 rotate-180" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {habits.slice(0, 4).map((habit) => {
                const isDoneToday = !!habit.history[todayStr];
                return (
                  <div
                    key={habit.id}
                    onClick={() => onToggleHabit(habit.id)}
                    className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                      isDoneToday 
                        ? 'bg-purple-50/60 border-purple-200 text-purple-950' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input 
                        type="checkbox" 
                        checked={isDoneToday} 
                        onChange={() => onToggleHabit(habit.id)}
                        className="w-4 h-4 text-purple-600 rounded-sm cursor-pointer"
                      />
                      <span className="font-semibold truncate">{habit.title}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-amber-600 font-bold shrink-0">
                      <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{habit.streak} يوم</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* PILLARS GALLERY (Directly Matching User CSV Data) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>🏛️ الركائز الكبرى</span>
            </h2>
            <p className="text-xs text-slate-500">
              الأساس البنيوي الذي تتفرع منه الرؤى والأهداف والمشاريع وعادات الحياة.
            </p>
          </div>

          <button
            onClick={() => onNavigate('alignment_zone')}
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>الهرم الاستراتيجي الكامل (5 طبقات)</span>
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>

        {/* Pillars Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map((pillar) => {
            const pillarStats = calculatePillarProgress(pillar, visions, goals, projects, tasks);
            
            // Formula progress stars matching user's CSV (✩✩✩✩✩✩✩✩✩✩ / ★★★★★★★☆☆☆)
            const filledStars = Math.round(pillarStats.percentage / 10);
            const emptyStars = 10 - filledStars;
            const starsDisplay = '★'.repeat(filledStars) + '☆'.repeat(emptyStars);

            return (
              <div 
                key={pillar.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: Group & Priority */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                      {pillar.group || 'Growth'}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      أولوية #{pillar.priority || pillar.order}
                    </span>
                  </div>

                  {/* Title & Icon */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-lg">
                        {pillar.id === 'pil-allah' ? '🕌' : pillar.id === 'pil-self' ? '✨' : pillar.id === 'pil-health' ? '💪' : pillar.id === 'pil-work' ? '💻' : pillar.id === 'pil-wealth' ? '💰' : '🤝'}
                      </span>
                      <span>{pillar.title}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  {/* Purpose (الغاية الكبرى) */}
                  {pillar.purpose && (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[11px] text-slate-700">
                      <span className="font-bold text-slate-900 block mb-0.5">الغاية الكبرى | Purpose:</span>
                      <p className="line-clamp-2 text-slate-600">{pillar.purpose}</p>
                    </div>
                  )}

                  {/* Value Goals Tags */}
                  {pillar.valueGoals && pillar.valueGoals.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        أهداف القيم:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {pillar.valueGoals.map((vg, i) => (
                          <span 
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                          >
                            {vg}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Rollup Progress & Stars */}
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">التقدم المحسوب:</span>
                    <span className="font-mono font-bold text-slate-900">{pillarStats.percentage}%</span>
                  </div>

                  {/* Star Rating Formula Progress like in user Notion CSV */}
                  <div className="text-amber-500 text-sm tracking-wider font-mono text-center bg-amber-50/50 py-1 rounded border border-amber-100">
                    {starsDisplay}
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-900 rounded-full transition-all"
                      style={{ width: `${pillarStats.percentage}%` }}
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
