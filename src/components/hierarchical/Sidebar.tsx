import React from 'react';
import { 
  Layers, 
  Eye, 
  Target, 
  Folder, 
  CheckSquare, 
  GitFork, 
  Plus, 
  X, 
  Moon, 
  User, 
  Activity,
  Inbox,
  Repeat,
  BookOpen,
  Timer,
  Calendar
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  counts,
  isOpenMobile,
  onCloseMobile,
  onOpenQuickAdd,
}) => {
  // Navigation organized into PPV & GTD sections
  const executionItems: {
    id: SidebarTab;
    label: string;
    icon: React.ReactNode;
    badge: number;
  }[] = [
    {
      id: 'hierarchy',
      label: 'الرئيسية (التصفح الهرمي)',
      icon: <GitFork className="w-4 h-4" />,
      badge: counts.pillars,
    },
    {
      id: 'focus',
      label: 'جلسات التركيز (Pomodoro)',
      icon: <Timer className="w-4 h-4 text-emerald-700" />,
      badge: counts.focus || 0,
    },
    {
      id: 'timeblocking',
      label: 'حجب الوقت (Time Blocking)',
      icon: <Calendar className="w-4 h-4 text-sky-700" />,
      badge: counts.timeBlocks || 0,
    },
    {
      id: 'inbox',
      label: 'صندوق الوارد (GTD Inbox)',
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
      label: 'متتبع العادات (Habits)',
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
      label: 'الركائز الأساسية (Pillars)',
      icon: <span className="text-sm">🏛️</span>,
      badge: counts.pillars,
    },
    {
      id: 'visions',
      label: 'الرؤى المستقبلية (Visions)',
      icon: <Eye className="w-4 h-4" />,
      badge: counts.visions,
    },
    {
      id: 'goals',
      label: 'أهداف القيمة (Goals)',
      icon: <Target className="w-4 h-4" />,
      badge: counts.goals,
    },
    {
      id: 'projects',
      label: 'المشروعات التنفيذية (Projects)',
      icon: <Folder className="w-4 h-4" />,
      badge: counts.projects,
    },
    {
      id: 'vaults',
      label: 'خزائن المعرفة (Vaults)',
      icon: <BookOpen className="w-4 h-4" />,
      badge: counts.vaults || 0,
    },
    {
      id: 'reviews',
      label: 'المراجعات الدورية (Reviews)',
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
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-2xs md:hidden"
        />
      )}

      {/* Sidebar Container styled like Dawenli OS */}
      <aside
        className={`fixed md:static inset-y-0 right-0 z-40 w-64 bg-white text-[#2d3731] flex flex-col border-l border-[#e8e5de] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-xl' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#f0eee9]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#174235] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                د
              </div>
              <div>
                <h2 className="text-sm font-black text-[#1a2420] tracking-tight">دَوّنـلي</h2>
                <p className="text-[10px] text-[#78847d] font-medium">منظومة الحياة والتنفيذ</p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 rounded text-[#78847d] hover:text-[#1a2420]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Capture Button (التقاط سريع) matching screenshot */}
          {onOpenQuickAdd && (
            <button
              onClick={() => {
                onOpenQuickAdd();
                onCloseMobile();
              }}
              className="w-full mt-3.5 flex items-center justify-center gap-2 py-2 px-3 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>التقاط سريع</span>
            </button>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          {/* Group 1: Execution & Flow */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-semibold text-[#89958e] uppercase tracking-wider">
              التنفيذ والتدفق اليومي
            </div>

            <div className="space-y-0.5">
              {executionItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-right transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#ebf4f0] text-[#174235] font-semibold'
                        : 'text-[#4e5a53] hover:bg-[#f6f5f1] hover:text-[#1a2420] font-normal'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`shrink-0 ${isActive ? 'text-[#174235]' : 'text-[#79857e]'}`}>
                        {item.icon}
                      </span>
                      <span className="text-xs truncate">{item.label}</span>
                    </div>

                    <span
                      className={`text-[11px] font-mono tabular-nums shrink-0 mr-2 ${
                        isActive
                          ? 'text-[#174235] font-semibold'
                          : 'text-[#9aa69f]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: Life Architecture & Vaults */}
          <div className="pt-2 border-t border-[#f0eee9]">
            <div className="px-2 pb-1.5 text-[10px] font-semibold text-[#89958e] uppercase tracking-wider">
              البنية الاستراتيجية والمعرفة
            </div>

            <div className="space-y-0.5">
              {strategicItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-right transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#ebf4f0] text-[#174235] font-semibold'
                        : 'text-[#4e5a53] hover:bg-[#f6f5f1] hover:text-[#1a2420] font-normal'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`shrink-0 ${isActive ? 'text-[#174235]' : 'text-[#79857e]'}`}>
                        {item.icon}
                      </span>
                      <span className="text-xs truncate">{item.label}</span>
                    </div>

                    <span
                      className={`text-[11px] font-mono tabular-nums shrink-0 mr-2 ${
                        isActive
                          ? 'text-[#174235] font-semibold'
                          : 'text-[#9aa69f]'
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

        {/* Sidebar Footer matching Dawenli */}
        <div className="p-3 border-t border-[#f0eee9] space-y-2 bg-[#fcfbfa] text-xs">
          {/* User profile card */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#eae7e0]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#174235]" />
              <div>
                <span className="font-bold text-xs text-[#1a2420] block">محمد</span>
                <span className="text-[10px] text-[#808c85]">مساحتك الشخصية</span>
              </div>
            </div>
            <div className="w-6 h-6 rounded-md bg-[#f2efe8] text-[#57645d] flex items-center justify-center text-[10px] font-bold">
              م
            </div>
          </div>

          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-[#77847d]">
            <span>الحساب التلقائي الصاعد</span>
            <span className="text-[#174235] font-bold">نشط ✓</span>
          </div>
        </div>
      </aside>
    </>
  );
};
