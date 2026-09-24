import React from 'react';
import { 
  GitFork, 
  CheckSquare, 
  Plus, 
  Timer, 
  Menu 
} from 'lucide-react';
import { SidebarTab } from '../../types/hierarchical';

interface MobileBottomNavProps {
  currentTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  onOpenQuickAdd: () => void;
  onOpenMobileMenu: () => void;
  tasksCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickAdd,
  onOpenMobileMenu,
  tasksCount,
}) => {
  return (
    <nav
      role="navigation"
      aria-label="شريط التنقل السفلي للجوال"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-[#131c17]/95 backdrop-blur-md border-t border-[#e8e5de] dark:border-[#223028] px-3 py-1.5 flex items-center justify-around shadow-lg safe-bottom"
    >
      {/* 1. Overview */}
      <button
        type="button"
        onClick={() => onSelectTab('hierarchy')}
        aria-label="الرئيسية ونظرة عامة"
        className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
          currentTab === 'hierarchy'
            ? 'text-[#174235] dark:text-emerald-400 font-bold'
            : 'text-[#6b7b72] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white'
        }`}
      >
        <GitFork className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] leading-tight">الرئيسية</span>
      </button>

      {/* 2. Tasks */}
      <button
        type="button"
        onClick={() => onSelectTab('tasks')}
        aria-label="قائمة المهام"
        className={`relative flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
          currentTab === 'tasks'
            ? 'text-[#174235] dark:text-emerald-400 font-bold'
            : 'text-[#6b7b72] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white'
        }`}
      >
        <CheckSquare className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] leading-tight">المهام</span>
        {tasksCount > 0 && (
          <span className="absolute top-0.5 left-2 bg-[#174235] dark:bg-emerald-600 text-white text-[9px] font-mono font-bold px-1 rounded-full min-w-[14px] text-center">
            {tasksCount}
          </span>
        )}
      </button>

      {/* 3. Center Quick Add Button (Prominent thumb target) */}
      <div className="relative -top-2 flex items-center justify-center">
        <button
          type="button"
          onClick={onOpenQuickAdd}
          aria-label="إضافة سريعة لمهمة أو فكرة جديدة"
          className="w-12 h-12 rounded-full bg-[#174235] dark:bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:bg-[#12352a] dark:hover:bg-emerald-700 transition-transform active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* 4. Focus Timer */}
      <button
        type="button"
        onClick={() => onSelectTab('focus')}
        aria-label="مؤقت التركيز وجلسات العمل العميق"
        className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
          currentTab === 'focus'
            ? 'text-[#174235] dark:text-emerald-400 font-bold'
            : 'text-[#6b7b72] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white'
        }`}
      >
        <Timer className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] leading-tight">التركيز</span>
      </button>

      {/* 5. More Menu / Drawer */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        aria-label="فتح القائمة الكاملة ومجالات الحياة"
        className="flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl text-[#6b7b72] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white transition-all cursor-pointer"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] leading-tight">المزيد</span>
      </button>
    </nav>
  );
};
