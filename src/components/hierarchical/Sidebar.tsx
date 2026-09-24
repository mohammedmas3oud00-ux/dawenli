import React from 'react';
import { 
  Eye, 
  Target, 
  Folder, 
  CheckSquare, 
  GitFork, 
  Plus, 
  X, 
  Moon, 
  Sun,
  User, 
  Activity,
  Inbox,
  Repeat,
  BookOpen,
  Timer,
  Calendar,
  Mic,
  Sparkles,
  LogIn,
  LogOut
} from 'lucide-react';
import { SidebarTab } from '../../types/hierarchical';

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
  onOpenVoiceAi?: () => void;
  isDark?: boolean;
  onToggleDark?: () => void;
  currentUser?: { email: string; isGuest?: boolean } | null;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  counts,
  isOpenMobile,
  onCloseMobile,
  onOpenQuickAdd,
  onOpenVoiceAi,
  isDark = false,
  onToggleDark,
  currentUser,
  onOpenAuth,
  onSignOut,
}) => {
  // Navigation organized into Arabic-only labels
  const executionItems: {
    id: SidebarTab;
    label: string;
    icon: React.ReactNode;
    badge: number;
  }[] = [
    {
      id: 'hierarchy',
      label: 'الرئيسية',
      icon: <GitFork className="w-4 h-4" />,
      badge: counts.pillars,
    },
    {
      id: 'focus',
      label: 'جلسات التركيز',
      icon: <Timer className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />,
      badge: counts.focus || 0,
    },
    {
      id: 'timeblocking',
      label: 'حجب الوقت',
      icon: <Calendar className="w-4 h-4 text-sky-700 dark:text-sky-400" />,
      badge: counts.timeBlocks || 0,
    },
    {
      id: 'inbox',
      label: 'صندوق الوارد',
      icon: <Inbox className="w-4 h-4" />,
      badge: counts.inbox || 0,
    },
    {
      id: 'tasks',
      label: 'كل المهام اليومية',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: counts.tasks,
    },
    {
      id: 'habits',
      label: 'متتبع العادات',
      icon: <Repeat className="w-4 h-4" />,
      badge: counts.habits || 0,
    },
  ];

  const strategicItems: {
    id: SidebarTab;
    label: string;
    icon: React.ReactNode;
    badge: number;
  }[] = [
    {
      id: 'pillars',
      label: 'الركائز الأساسية',
      icon: <span className="text-sm">🏛️</span>,
      badge: counts.pillars,
    },
    {
      id: 'visions',
      label: 'الرؤى المستقبلية',
      icon: <Eye className="w-4 h-4" />,
      badge: counts.visions,
    },
    {
      id: 'goals',
      label: 'أهداف القيمة',
      icon: <Target className="w-4 h-4" />,
      badge: counts.goals,
    },
    {
      id: 'projects',
      label: 'المشروعات التنفيذية',
      icon: <Folder className="w-4 h-4" />,
      badge: counts.projects,
    },
    {
      id: 'vaults',
      label: 'خزائن المعرفة',
      icon: <BookOpen className="w-4 h-4" />,
      badge: counts.vaults || 0,
    },
    {
      id: 'reviews',
      label: 'المراجعات الدورية',
      icon: <Activity className="w-4 h-4" />,
      badge: counts.reviews || 0,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-2xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 right-0 z-40 w-64 shrink-0 h-full bg-white dark:bg-slate-900 text-[#2d3731] dark:text-slate-200 flex flex-col border-l border-[#e8e5de] dark:border-slate-800 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#f0eee9] dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#174235] dark:bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                د
              </div>
              <div>
                <h2 className="text-sm font-black text-[#1a2420] dark:text-slate-100 tracking-tight">دَوّنـلي</h2>
                <p className="text-[10px] text-[#78847d] dark:text-slate-400 font-medium">منظومة الحياة والتنفيذ</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onToggleDark && (
                <button
                  type="button"
                  onClick={onToggleDark}
                  className="p-1.5 rounded-lg text-[#78847d] dark:text-slate-400 hover:text-[#1a2420] dark:hover:text-slate-100 hover:bg-[#f2efe8] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded text-[#78847d] hover:text-[#1a2420] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons: Voice AI & Quick Capture */}
          <div className="mt-3.5 space-y-1.5">
            {onOpenVoiceAi && (
              <button
                type="button"
                onClick={() => {
                  onOpenVoiceAi();
                  onCloseMobile();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer group"
                title="تحدث بصوتك والتحليل الذكي بالذكاء الاصطناعي"
              >
                <Mic className="w-4 h-4 animate-pulse text-amber-100" />
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>تحدث بصوتك</span>
              </button>
            )}

            {onOpenQuickAdd && (
              <button
                type="button"
                onClick={() => {
                  onOpenQuickAdd();
                  onCloseMobile();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12352a] dark:hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>التقاط سريع</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          {/* Group 1: Execution & Flow */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-semibold text-[#89958e] dark:text-slate-500 uppercase tracking-wider">
              التنفيذ والتدفق اليومي
            </div>

            <div className="space-y-0.5">
              {executionItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-right transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#ebf4f0] dark:bg-emerald-950/80 text-[#174235] dark:text-emerald-300 font-bold'
                        : 'text-[#4e5a53] dark:text-slate-300 hover:bg-[#f6f5f1] dark:hover:bg-slate-800 hover:text-[#1a2420] dark:hover:text-slate-100 font-normal'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`shrink-0 ${isActive ? 'text-[#174235] dark:text-emerald-400' : 'text-[#79857e] dark:text-slate-500'}`}>
                        {item.icon}
                      </span>
                      <span className="text-xs truncate">{item.label}</span>
                    </div>

                    <span
                      className={`text-[11px] font-mono tabular-nums shrink-0 mr-2 ${
                        isActive
                          ? 'text-[#174235] dark:text-emerald-300 font-bold'
                          : 'text-[#9aa69f] dark:text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: Strategic PPV Architecture */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-semibold text-[#89958e] dark:text-slate-500 uppercase tracking-wider">
              البنية الاستراتيجية
            </div>

            <div className="space-y-0.5">
              {strategicItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-right transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#ebf4f0] dark:bg-emerald-950/80 text-[#174235] dark:text-emerald-300 font-bold'
                        : 'text-[#4e5a53] dark:text-slate-300 hover:bg-[#f6f5f1] dark:hover:bg-slate-800 hover:text-[#1a2420] dark:hover:text-slate-100 font-normal'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`shrink-0 ${isActive ? 'text-[#174235] dark:text-emerald-400' : 'text-[#79857e] dark:text-slate-500'}`}>
                        {item.icon}
                      </span>
                      <span className="text-xs truncate">{item.label}</span>
                    </div>

                    <span
                      className={`text-[11px] font-mono tabular-nums shrink-0 mr-2 ${
                        isActive
                          ? 'text-[#174235] dark:text-emerald-300 font-bold'
                          : 'text-[#9aa69f] dark:text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Sidebar Footer with Auth Profile */}
        <div className="p-3 border-t border-[#f0eee9] dark:border-slate-800 space-y-2 bg-[#fcfbfa] dark:bg-slate-900/90 text-xs">
          {currentUser ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-[#eae7e0] dark:border-slate-700">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-xs text-[#1a2420] dark:text-slate-100 block truncate">
                    {currentUser.email ? currentUser.email.split('@')[0] : 'حساب مستخدم'}
                  </span>
                  <span className="text-[10px] text-[#808c85] dark:text-slate-400 block truncate">
                    {currentUser.isGuest ? 'جلسة ضيف محلية' : currentUser.email}
                  </span>
                </div>
              </div>
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-1 text-[#808c85] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#f6f5f1] dark:hover:bg-slate-700 border border-[#eae7e0] dark:border-slate-700 text-[#174235] dark:text-emerald-400 font-bold transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <LogIn className="w-3.5 h-3.5" />
                <span>تسجيل الدخول / حساب جديد</span>
              </div>
              <span className="text-[10px] bg-[#ebf4f0] dark:bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-300">دخول</span>
            </button>
          )}

          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-[#77847d] dark:text-slate-400">
            <span>الحساب التلقائي الصاعد</span>
            <span className="text-[#174235] dark:text-emerald-400 font-bold">نشط ✓</span>
          </div>
        </div>
      </aside>
    </>
  );
};
