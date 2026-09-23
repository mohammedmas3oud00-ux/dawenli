import React from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Layers,
  Scale
} from 'lucide-react';
import { Project, Task, TeamMember } from '../types';
import { calculateProjectProgress } from '../utils/progressCalculator';
import { Avatar } from './Avatar';

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  members: TeamMember[];
  onSelectProject: (projectId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  tasks,
  members,
  onSelectProject,
  onEditProject,
  onDeleteProject,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const stats = calculateProjectProgress(project, tasks);

  const assignedMembers = members.filter((m) =>
    project.memberIds.includes(m.id)
  );

  const getHealthBadge = () => {
    switch (stats.health) {
      case 'completed':
        return <span className="text-emerald-700 font-medium">مكتمل بالكامل</span>;
      case 'delayed':
        return <span className="text-rose-600 font-medium">متأخر عن الجدول</span>;
      case 'at_risk':
        return <span className="text-amber-600 font-medium">معرض للتأخير</span>;
      case 'on_track':
      default:
        return <span className="text-emerald-600 font-medium">على المسار الصحيح</span>;
    }
  };

  const getPriorityLabel = () => {
    switch (project.priority) {
      case 'urgent': return 'أولوية عاجلة';
      case 'high': return 'أولوية مرتفعة';
      case 'medium': return 'أولوية متوسطة';
      case 'low': return 'أولوية منخفضة';
    }
  };

  const getModeLabel = () => {
    switch (project.calculationMode) {
      case 'weighted': return 'حساب وزني (نقاط الصعوبة)';
      case 'subtask_inclusive': return 'حساب عميق (مهام فرعية)';
      case 'standard': return 'حساب قياسي (نسبة عددية)';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between hover:border-slate-300 transition-shadow">
      
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{project.category}</span>
            <span aria-hidden="true">·</span>
            <span>{getPriorityLabel()}</span>
            <span aria-hidden="true">·</span>
            {getHealthBadge()}
          </div>

          {/* Context menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute left-0 mt-1 w-36 bg-white border border-slate-200 rounded-md shadow-md py-1 z-20 text-xs">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEditProject(project);
                    }}
                    className="w-full text-right px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل المشروع</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDeleteProject(project.id);
                    }}
                    className="w-full text-right px-3 py-1.5 hover:bg-rose-50 flex items-center gap-2 text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف المشروع</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Project Name & Description */}
        <h3 
          onClick={() => onSelectProject(project.id)}
          className="text-base font-bold text-slate-900 mb-1.5 hover:text-indigo-600 cursor-pointer transition-colors"
        >
          {project.name}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">
          {project.description}
        </p>
      </div>

      {/* Progress Calculation Section */}
      <div className="pt-3 border-t border-slate-100 mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold text-slate-900">نسبة التقدم المحسوبة:</span>
            <span className="text-[11px] text-slate-400">({getModeLabel()})</span>
          </div>
          <span className="text-sm font-bold text-slate-900">
            {stats.percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2.5">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              stats.percentage === 100
                ? 'bg-emerald-500'
                : stats.health === 'delayed'
                ? 'bg-rose-500'
                : stats.health === 'at_risk'
                ? 'bg-amber-500'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${stats.percentage}%` }}
          />
        </div>

        {/* Task Counts breakdown */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>{stats.completedTasks} مكتملة</span>
            <span aria-hidden="true">·</span>
            <span>{stats.inProgressTasks} قيد التنفيذ</span>
            <span aria-hidden="true">·</span>
            <span>{stats.todoTasks} قيد الانتظار</span>
          </div>
          <span className="font-medium text-slate-700">
            {stats.completedWeight} / {stats.totalWeight} نقطة جهد
          </span>
        </div>
      </div>

      {/* Footer Info & Team */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        
        {/* Dates and deadline */}
        <div className="flex items-center gap-1.5 text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>الموعد: {project.dueDate}</span>
          {stats.daysRemaining >= 0 ? (
            <span className="text-[11px] text-slate-400">({stats.daysRemaining} يوم متبقي)</span>
          ) : (
            <span className="text-[11px] text-rose-600 font-medium">(متأخر {Math.abs(stats.daysRemaining)} يوم)</span>
          )}
        </div>

        {/* Team Avatars & Go to tasks */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5 rtl:space-x-reverse overflow-hidden">
            {assignedMembers.slice(0, 3).map((m) => (
              <Avatar
                key={m.id}
                name={m.name}
                avatar={m.avatar}
                size="sm"
                title={`${m.name} (${m.role})`}
              />
            ))}
            {assignedMembers.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 ring-2 ring-white flex items-center justify-center text-[10px] font-medium">
                +{assignedMembers.length - 3}
              </div>
            )}
          </div>

          <button
            onClick={() => onSelectProject(project.id)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
            title="عرض مهام المشروع"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
