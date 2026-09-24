import React from 'react';
import { 
  CheckCircle2, 
  Plus, 
  Search, 
  FileText, 
  RotateCcw,
  LayoutGrid,
  Kanban,
  ListTodo,
  TrendingUp,
  Layers,
  Sparkles,
  Zap,
  Home,
  BookOpen,
  Calendar,
  Compass,
  Inbox
} from 'lucide-react';
import { Project } from '../types';

export type ActiveView = 
  | 'home' 
  | 'day_muslim' 
  | 'recommender' 
  | 'tasks' 
  | 'kanban' 
  | 'projects' 
  | 'alignment_zone' 
  | 'habits' 
  | 'vaults' 
  | 'reviews' 
  | 'inbox' 
  | 'analytics';

interface HeaderProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedProjectId: string | 'all';
  setSelectedProjectId: (id: string | 'all') => void;
  projects: Project[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNewTask: () => void;
  onNewProject: () => void;
  onOpenReport: () => void;
  onOpenQuickCapture: () => void;
  onResetData: () => void;
  unprocessedInboxCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  selectedProjectId,
  setSelectedProjectId,
  projects,
  searchQuery,
  setSearchQuery,
  onNewTask,
  onNewProject,
  onOpenReport,
  onOpenQuickCapture,
  onResetData,
  unprocessedInboxCount = 0,
}) => {
  const primaryNavItems: { id: ActiveView; label: string; icon: string; badge?: string }[] = [
    { id: 'home', label: 'الرئيسية', icon: '🏠' },
    { id: 'day_muslim', label: 'يوم المسلم', icon: '🕌' },
    { id: 'recommender', label: 'أفضل مهمة الآن', icon: '⚡' },
    { id: 'tasks', label: 'المهام', icon: '📋' },
    { id: 'kanban', label: 'لوحة كانبان', icon: '📊' },
    { id: 'projects', label: 'المشاريع', icon: '📁' },
    { id: 'alignment_zone', label: 'الهيكل الاستراتيجي', icon: '🧭', badge: '5 طبقات' },
    { id: 'habits', label: 'العادات والروتين', icon: '🔄' },
    { id: 'vaults', label: 'المستودع', icon: '📚' },
    { id: 'reviews', label: 'المراجعات', icon: '⏳' },
    { id: 'inbox', label: 'صندوق الوارد', icon: '📥', badge: unprocessedInboxCount > 0 ? `${unprocessedInboxCount}` : undefined },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      {/* Zone 1, 2, 3 Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Zone 1: Wordmark */}
          <div 
            onClick={() => setActiveView('home')}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center text-white shadow-sm border border-slate-800">
              <span className="text-base">🏠</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-950 leading-tight">
                  Personal OS
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-bold rounded border border-indigo-100">
                  Notion Life OS
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                نظام إدارة الحياة والأولويات
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-1">
            {primaryNavItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isActive ? 'bg-indigo-500 text-white' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Quick Capture Button */}
            <button
              onClick={onOpenQuickCapture}
              title="التقاط سريع لمهمة أو فكرة"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span className="hidden sm:inline">التقاط سريع</span>
            </button>

            {/* Best Task Button */}
            <button
              onClick={() => setActiveView('recommender')}
              title="اقتراح أفضل مهمة للقيام بها الآن"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeView === 'recommender'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">أفضل مهمة</span>
            </button>

            <button
              onClick={onOpenReport}
              title="تصدير تقرير الإنجاز"
              className="hidden lg:flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>التقرير</span>
            </button>

            <button
              onClick={onNewTask}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>مهمة</span>
            </button>

            <button
              onClick={onResetData}
              title="إعادة تعيين البيانات النموذجية"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Medium/Small screen Navigation Bar */}
        <div className="flex xl:hidden items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {primaryNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
                activeView === item.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-amber-200 text-amber-900">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Project Filter Bar */}
        <div className="py-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث شامل في المهام، المشاريع، الركائز، والمستودع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-500 font-medium">تصفية حسب المشروع:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">جميع المشاريع ({projects.length})</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
