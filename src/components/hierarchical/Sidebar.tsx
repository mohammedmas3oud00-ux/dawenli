import React from 'react';
import { 
  GitFork, 
  Plus, 
  X, 
  Moon, 
  Sun,
  Inbox,
  Repeat,
  BookOpen,
  Timer,
  Calendar,
  CheckSquare,
  Compass,
  Target,
  FolderKanban,
  FileCheck2,
  Bookmark
} from 'lucide-react';
import { SidebarTab } from '../../types/hierarchical';
import { useTheme } from '../../utils/theme';

interface SidebarProps {
  currentTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  counts: {
    pillars: number;
    visions: number;
    goals: number;
    projects: number;
    tasks: number;
    reviews?: number;
    inbox?: number;
    habits?: number;
    vaults?: number;
    focus?: number;
    timeBlocks?: number;
  };
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenQuickAdd?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  counts,
  isOpenMobile,
  onCloseMobile,
  onOpenQuickAdd,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  // Navigation Items with simplified natural Arabic names
  const executionItems: {
    id: SidebarTab;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    badge: number;
  }[] = [
    {
      id: 'hierarchy',
      label: 'نظرة عامة',
      sublabel: 'المسار الهرمي ونسب الإنجاز',
      icon: <GitFork className="w-4 h-4" />,
      badge: counts.pillars,
    },
    {
      id: 'tasks',
      label: 'قائمة المهام',
      sublabel: 'جميع المهام مصنفة حسب الأولوية',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: counts.tasks,
    },
    {
      id: 'focus',
      label: 'مؤقت التركيز',
      sublabel: 'جلسات العمل العميق (بومودورو)',
      icon: <Timer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      badge: counts.focus || 0,
    },
    {
      id: 'timeblocking',
      label: 'الجدول اليومي',
      sublabel: 'تنظيم أوقات وساعات اليوم',
      icon: <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      badge: counts.timeBlocks || 0,
    },
    {
      id: 'inbox',
      label: 'صندوق الأفكار',
      sublabel: 'التقاط الخواطر والمهام السريعة',
      icon: <Inbox className="w-4 h-4" />,
      badge: counts.inbox || 0,
    },
    {
      id: 'habits',
      label: 'متتبع العادات',
      sublabel: 'العادات اليومية ونسب الالتزام',
      icon: <Repeat className="w-4 h-4" />,
      badge: counts.habits || 0,
    },
  ];

  const planningItems: {
    id: SidebarTab;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    badge: number;
  }[] = [
    {
      id: 'pillars',
      label: 'مجالات الحياة',
      sublabel: 'الصحة، العمل، الأسرة، التطوير',
      icon: <span className="text-sm select-none" aria-hidden="true">🌱</span>,
      badge: counts.pillars,
    },
    {
      id: 'visions',
      label: 'الرؤية والاتجاه',
      sublabel: 'التطلعات متوسطة وبعيدة المدى',
      icon: <Compass className="w-4 h-4" />,
      badge: counts.visions,
    },
    {
      id: 'goals',
      label: 'الأهداف الكبرى',
      sublabel: 'المحطات الرئيسية والمستهدفات',
      icon: <Target className="w-4 h-4" />,
      badge: counts.goals,
    },
    {
      id: 'projects',
      label: 'المشاريع الحالية',
      sublabel: 'خطط تنفيذية محددة بمواعيد',
      icon: <FolderKanban className="w-4 h-4" />,
      badge: counts.projects,
    },
    {
      id: 'vaults',
      label: 'الملاحظات والمراجع',
      sublabel: 'خزينة المعرفة والروابط المفيدة',
      icon: <BookOpen className="w-4 h-4" />,
      badge: counts.vaults || 0,
    },
    {
      id: 'reviews',
      label: 'المراجعة والتقييم',
      sublabel: 'تقييم الإنجاز الأسبوعي والشهري',
      icon: <FileCheck2 className="w-4 h-4" />,
      badge: counts.reviews || 0,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop with smooth fade */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        aria-label="القائمة الجانبية الرئيسية"
        className={`fixed md:static inset-y-0 right-0 z-40 w-72 bg-white dark:bg-[#131c17] text-[#2d3731] dark:text-[#dbe6df] flex flex-col border-l border-[#e8e5de] dark:border-[#223028] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#f0eee9] dark:border-[#223028]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#174235] dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs select-none">
                د
              </div>
              <div>
                <h1 className="text-base font-black text-[#1a2420] dark:text-[#f0f6f2] tracking-tight">دَوّنـلي</h1>
                <p className="text-[11px] text-[#6b7b72] dark:text-[#8ea095]">نظام الإنتاجية الشخصية</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'التحويل إلى الوضع النهاري' : 'التحويل إلى الوضع الليلي'}
                title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
                className="p-1.5 rounded-lg text-[#6b7b72] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white hover:bg-[#f2efe8] dark:hover:bg-[#1a2620] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Mobile close button */}
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="إغلاق القائمة الجانبية"
                className="md:hidden p-1.5 rounded-lg text-[#6b7b72] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white hover:bg-[#f2efe8] dark:hover:bg-[#1a2620] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Capture Button */}
          {onOpenQuickAdd && (
            <button
              type="button"
              onClick={() => {
                onOpenQuickAdd();
                onCloseMobile();
              }}
              className="w-full mt-3.5 flex items-center justify-center gap-2 py-2.5 px-3 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden active:scale-98"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>إضافة فكرة أو مهمة سريعة</span>
            </button>
          )}
        </div>

        {/* Navigation list with simplified sections */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4" aria-label="أقسام النظام">
          
          {/* Group 1: Daily Execution */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold text-[#718278] dark:text-[#899c90] uppercase tracking-wider">
              العمل اليومي والتدفق
            </div>

            <div className="space-y-0.5" role="list">
              {executionItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="listitem"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-right transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden ${
                      isActive
                        ? 'bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-300 font-semibold shadow-2xs'
                        : 'text-[#48564e] dark:text-[#b4c4ba] hover:bg-[#f6f5f1] dark:hover:bg-[#17231d] hover:text-[#1a2420] dark:hover:text-white font-normal'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`shrink-0 ${isActive ? 'text-[#174235] dark:text-emerald-300' : 'text-[#6b7b72] dark:text-[#8ea095]'}`} aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className="text-xs truncate">{item.label}</span>
                    </div>

                    <span
                      className={`text-[11px] font-mono tabular-nums shrink-0 mr-2 px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'text-[#174235] dark:text-emerald-300 font-bold bg-white/70 dark:bg-black/30'
                          : 'text-[#6b7b72] dark:text-[#8ea095] bg-[#f0eee9] dark:bg-[#1c2a22]'
                      }`}
                      aria-label={`${item.badge} عناصر`}
                    >
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: Planning & Architecture */}
          <div className="pt-2 border-t border-[#f0eee9] dark:border-[#223028]">
            <div className="px-2 pb-1.5 text-[10px] font-bold text-[#718278] dark:text-[#899c90] uppercase tracking-wider">
              التخطيط الاستراتيجي والمعرفة
            </div>

            <div className="space-y-0.5" role="list">
              {planningItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="listitem"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-right transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden ${
                      isActive
                        ? 'bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-300 font-semibold shadow-2xs'
                        : 'text-[#48564e] dark:text-[#b4c4ba] hover:bg-[#f6f5f1] dark:hover:bg-[#17231d] hover:text-[#1a2420] dark:hover:text-white font-normal'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`shrink-0 ${isActive ? 'text-[#174235] dark:text-emerald-300' : 'text-[#6b7b72] dark:text-[#8ea095]'}`} aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className="text-xs truncate">{item.label}</span>
                    </div>

                    <span
                      className={`text-[11px] font-mono tabular-nums shrink-0 mr-2 px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'text-[#174235] dark:text-emerald-300 font-bold bg-white/70 dark:bg-black/30'
                          : 'text-[#6b7b72] dark:text-[#8ea095] bg-[#f0eee9] dark:bg-[#1c2a22]'
                      }`}
                      aria-label={`${item.badge} عناصر`}
                    >
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </nav>

        {/* Sidebar Footer with system status & profile */}
        <div className="p-3 border-t border-[#f0eee9] dark:border-[#223028] space-y-2 bg-[#fcfbfa] dark:bg-[#101713] text-xs">
          {/* User profile card */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#16201b] border border-[#eae7e0] dark:border-[#223028] shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#174235] dark:bg-emerald-400 shrink-0" aria-hidden="true" />
              <div className="truncate">
                <span className="font-bold text-xs text-[#1a2420] dark:text-white block truncate">مساحة العمل الشخصية</span>
                <span className="text-[10px] text-[#6b7b72] dark:text-[#8ea095] block truncate">الحساب التلقائي الصاعد نشط</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-[#6b7b72] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white hover:bg-[#f2efe8] dark:hover:bg-[#1e2a24] transition-colors cursor-pointer"
              title={isDark ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
