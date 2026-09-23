import React, { useState } from 'react';
import { 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  HeartHandshake, 
  Target, 
  Compass, 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  ArrowDown, 
  ChevronDown, 
  ChevronRight, 
  Zap, 
  AlertTriangle, 
  Scale, 
  Plus, 
  Link as LinkIcon, 
  Eye
} from 'lucide-react';
import { 
  Pillar, 
  Vision, 
  StrategicGoal, 
  Project, 
  Task, 
  TeamMember,
  EnergyLevel
} from '../types';
import { 
  calculatePillarProgress, 
  calculateVisionProgress, 
  calculateGoalProgress, 
  calculateProjectProgress,
  checkTaskDependencies 
} from '../utils/progressCalculator';
import { Avatar } from './Avatar';

interface StrategicHierarchyViewProps {
  pillars: Pillar[];
  visions: Vision[];
  goals: StrategicGoal[];
  projects: Project[];
  tasks: Task[];
  members: TeamMember[];
  onToggleTaskComplete: (taskId: string) => void;
  onSelectTask: (task: Task) => void;
  onSelectProject: (projectId: string) => void;
  onNewGoal?: () => void;
}

export const StrategicHierarchyView: React.FC<StrategicHierarchyViewProps> = ({
  pillars,
  visions,
  goals,
  projects,
  tasks,
  members,
  onToggleTaskComplete,
  onSelectTask,
  onSelectProject,
}) => {
  // Expanded state for tree nodes
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({
    'pil-1': true,
    'pil-2': true,
    'pil-3': true,
  });
  const [expandedVisions, setExpandedVisions] = useState<Record<string, boolean>>({
    'vis-1': true,
    'vis-2': true,
    'vis-3': true,
  });
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({
    'goal-1': true,
    'goal-2': true,
    'goal-3': true,
  });
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // Filter state
  const [selectedPillarId, setSelectedPillarId] = useState<string>('all');

  // Ripple feedback when a task is clicked
  const [rippleFeedback, setRippleFeedback] = useState<string | null>(null);

  const togglePillar = (id: string) => {
    setExpandedPillars((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleVision = (id: string) => {
    setExpandedVisions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGoal = (id: string) => {
    setExpandedGoals((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculate Overall Corporate Strategic Progress
  let totalPillarsPercentage = 0;
  pillars.forEach((pil) => {
    const stats = calculatePillarProgress(pil, visions, goals, projects, tasks);
    totalPillarsPercentage += stats.percentage;
  });
  const overallStrategicProgress = pillars.length > 0
    ? Math.round(totalPillarsPercentage / pillars.length)
    : 0;

  const handleTaskCheck = (task: Task) => {
    const proj = projects.find((p) => p.id === task.projectId);
    const goal = goals.find((g) => g.id === proj?.goalId);
    const vis = visions.find((v) => v.id === goal?.visionId);
    const pil = pillars.find((p) => p.id === vis?.pillarId);

    const isCompleting = task.status !== 'completed';
    onToggleTaskComplete(task.id);

    if (isCompleting) {
      setRippleFeedback(
        `⚡ سريان الإنجاز التصاعدي: اكتملت "${task.title.slice(0, 32)}..." رفعت تقدم المشروع [${proj?.name.slice(0, 20)}...] ثم الهدف [${goal?.title.slice(0, 20)}...] وصولاً لركيزة [${pil?.title || ''}]!`
      );
      setTimeout(() => setRippleFeedback(null), 5500);
    }
  };

  const getEnergyBadge = (level?: EnergyLevel) => {
    switch (level) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <span>🚀</span>
            <span>تركيز عميق</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span>⚡</span>
            <span>طاقة متوسطة</span>
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span>🔋</span>
            <span>طاقة خفيفة</span>
          </span>
        );
    }
  };

  const getPillarIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-indigo-600" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'HeartHandshake': return <HeartHandshake className="w-5 h-5 text-violet-600" />;
      default: return <Target className="w-5 h-5 text-indigo-600" />;
    }
  };

  const filteredPillars = selectedPillarId === 'all'
    ? pillars
    : pillars.filter((p) => p.id === selectedPillarId);

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Rollup Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Layers className="w-5 h-5" />
              <h2 className="text-base font-bold text-slate-900">
                الهيكل الاستراتيجي وسريان التقدم التصاعدي (Strategic Cascade)
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ربط هرمي كامل من الركائز الاستراتيجية الكبرى وصولاً إلى المهام الدقيقة، مع حساب وتحديث التقدم تصاعدياً من الأسفل للأعلى.
            </p>
          </div>

          {/* Overall Rollup Indicator */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg p-3 shrink-0">
            <div>
              <span className="text-[11px] text-slate-500 block font-medium">مؤشر الإنجاز الاستراتيجي العام:</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-indigo-600">
                  {overallStrategicProgress}%
                </span>
                <span className="text-[11px] text-slate-400">من أصل 3 ركائز</span>
              </div>
            </div>
            <div className="w-24 bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${overallStrategicProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 5-Tier Pipeline Visual Indicator */}
        <div className="pt-4">
          <div className="text-[11px] font-semibold text-slate-500 mb-2">
            تسلسل سريان الأثر والتأثير في المنظومة:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold flex flex-col items-center">
              <span className="text-[10px] text-indigo-600 uppercase font-mono">Tier 1</span>
              <span>🏛️ الركائز (Pillars)</span>
              <span className="text-[10px] text-indigo-500 font-normal mt-0.5">{pillars.length} ركائز</span>
            </div>
            <div className="p-2.5 rounded-md bg-purple-50 border border-purple-200 text-purple-900 font-bold flex flex-col items-center">
              <span className="text-[10px] text-purple-600 uppercase font-mono">Tier 2</span>
              <span>🔭 الرؤية (Vision)</span>
              <span className="text-[10px] text-purple-500 font-normal mt-0.5">{visions.length} رؤى</span>
            </div>
            <div className="p-2.5 rounded-md bg-blue-50 border border-blue-200 text-blue-900 font-bold flex flex-col items-center">
              <span className="text-[10px] text-blue-600 uppercase font-mono">Tier 3</span>
              <span>🎯 الأهداف (Goals)</span>
              <span className="text-[10px] text-blue-500 font-normal mt-0.5">{goals.length} أهداف</span>
            </div>
            <div className="p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex flex-col items-center">
              <span className="text-[10px] text-emerald-600 uppercase font-mono">Tier 4</span>
              <span>📁 المشاريع (Projects)</span>
              <span className="text-[10px] text-emerald-500 font-normal mt-0.5">{projects.length} مشاريع</span>
            </div>
            <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-bold flex flex-col items-center">
              <span className="text-[10px] text-amber-600 uppercase font-mono">Tier 5</span>
              <span>✅ المهام (Tasks)</span>
              <span className="text-[10px] text-amber-500 font-normal mt-0.5">{tasks.length} مهمة</span>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">تصفية حسب الركيزة:</span>
            <select
              value={selectedPillarId}
              onChange={(e) => setSelectedPillarId(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md text-slate-800 font-medium cursor-pointer"
            >
              <option value="all">كافة الركائز ({pillars.length})</option>
              {pillars.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-slate-500">
            انقر على أي سهم لتوسيع أو طي أي مستوى، وجرب إتمام المهام لتشاهد صعود النسب مباشرة!
          </div>
        </div>
      </div>

      {/* Ripple Live Feedback Banner */}
      {rippleFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-900 shadow-sm animate-pulse flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{rippleFeedback}</span>
        </div>
      )}

      {/* 2. The Cascade Tree */}
      <div className="space-y-4">
        {filteredPillars.map((pillar) => {
          const isPillarOpen = expandedPillars[pillar.id] ?? true;
          const pillarStats = calculatePillarProgress(pillar, visions, goals, projects, tasks);
          const linkedVisions = visions.filter((v) => v.pillarId === pillar.id);

          return (
            <div 
              key={pillar.id}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs transition-all"
            >
              {/* Pillar Header */}
              <div 
                onClick={() => togglePillar(pillar.id)}
                className="p-4 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer flex items-center justify-between gap-4 border-b border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button className="text-slate-400 p-0.5">
                    {isPillarOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="p-2 bg-white rounded-md border border-slate-200 shadow-2xs">
                    {getPillarIcon(pillar.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        الركيزة الاستراتيجية (Pillar)
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {pillar.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {pillar.description}
                    </p>
                  </div>
                </div>

                {/* Pillar Stats Rollup */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-left">
                    <span className="text-[11px] text-slate-500 block">تقدم الركيزة المحسوب:</span>
                    <span className="font-mono text-base font-bold text-indigo-600">
                      {pillarStats.percentage}%
                    </span>
                  </div>
                  <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden hidden sm:block">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pillarStats.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Pillar Content: Visions */}
              {isPillarOpen && (
                <div className="p-4 space-y-4 bg-white">
                  {linkedVisions.length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-4">
                      لا توجد رؤى استراتيجية مضافة ضمن هذه الركيزة حتى الآن.
                    </div>
                  ) : (
                    linkedVisions.map((vision) => {
                      const isVisionOpen = expandedVisions[vision.id] ?? true;
                      const visionStats = calculateVisionProgress(vision, goals, projects, tasks);
                      const linkedGoals = goals.filter((g) => g.visionId === vision.id);

                      return (
                        <div 
                          key={vision.id}
                          className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/40"
                        >
                          {/* Vision Header */}
                          <div 
                            onClick={() => toggleVision(vision.id)}
                            className="p-3 bg-slate-50 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between gap-3 border-b border-slate-200"
                          >
                            <div className="flex items-center gap-2.5">
                              <button className="text-slate-400 p-0.5">
                                {isVisionOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>
                              <Compass className="w-4 h-4 text-purple-600" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                    الرؤية (Vision {vision.timeHorizon})
                                  </span>
                                  <span className="text-xs font-bold text-slate-800">
                                    {vision.title}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Vision Rollup Progress */}
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-mono text-xs font-bold text-purple-700">
                                {visionStats.percentage}%
                              </span>
                              <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden hidden sm:block">
                                <div
                                  className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${visionStats.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Vision Content: Goals */}
                          {isVisionOpen && (
                            <div className="p-3 space-y-3 bg-white">
                              {linkedGoals.length === 0 ? (
                                <div className="text-xs text-slate-400 text-center py-2">
                                  لا توجد أهداف استراتيجية مضافة ضمن هذه الرؤية.
                                </div>
                              ) : (
                                linkedGoals.map((goal) => {
                                  const isGoalOpen = expandedGoals[goal.id] ?? true;
                                  const goalStats = calculateGoalProgress(goal, projects, tasks);
                                  const linkedProjects = projects.filter((p) => p.goalId === goal.id);

                                  return (
                                    <div 
                                      key={goal.id}
                                      className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-2xs"
                                    >
                                      {/* Goal Header */}
                                      <div 
                                        onClick={() => toggleGoal(goal.id)}
                                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-3 border-b border-slate-100"
                                      >
                                        <div className="flex items-center gap-2">
                                          <button className="text-slate-400 p-0.5">
                                            {isGoalOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                          </button>
                                          <Target className="w-4 h-4 text-blue-600" />
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                                الهدف ({goal.quarter})
                                              </span>
                                              <span className="text-xs font-semibold text-slate-900">
                                                {goal.title}
                                              </span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 block mt-0.5">
                                              المؤشر المستهدف: {goal.targetMetric}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Goal Rollup Progress */}
                                        <div className="flex items-center gap-3 shrink-0">
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                            goalStats.health === 'completed'
                                              ? 'bg-emerald-50 text-emerald-700'
                                              : goalStats.health === 'delayed'
                                              ? 'bg-rose-50 text-rose-700'
                                              : goalStats.health === 'at_risk'
                                              ? 'bg-amber-50 text-amber-700'
                                              : 'bg-blue-50 text-blue-700'
                                          }`}>
                                            {goalStats.health === 'completed' && 'محقق'}
                                            {goalStats.health === 'delayed' && 'متأخر'}
                                            {goalStats.health === 'at_risk' && 'معرض للخطر'}
                                            {goalStats.health === 'on_track' && 'نشط ومنضبط'}
                                          </span>
                                          <span className="font-mono text-xs font-bold text-blue-700">
                                            {goalStats.percentage}%
                                          </span>
                                        </div>
                                      </div>

                                      {/* Goal Content: Projects */}
                                      {isGoalOpen && (
                                        <div className="p-3 bg-slate-50/50 space-y-2.5">
                                          {linkedProjects.length === 0 ? (
                                            <div className="text-xs text-slate-400 text-center py-2">
                                              لا توجد مشاريع مرتبطة بهذا الهدف حتى الآن.
                                            </div>
                                          ) : (
                                            linkedProjects.map((project) => {
                                              const isProjectOpen = expandedProjects[project.id] ?? false;
                                              const projStats = calculateProjectProgress(project, tasks);
                                              const projectTasks = tasks.filter((t) => t.projectId === project.id);

                                              return (
                                                <div 
                                                  key={project.id}
                                                  className="border border-slate-200 rounded bg-white overflow-hidden"
                                                >
                                                  {/* Project Bar */}
                                                  <div className="p-2.5 flex items-center justify-between gap-3 text-xs">
                                                    <div className="flex items-center gap-2">
                                                      <button 
                                                        onClick={() => toggleProject(project.id)}
                                                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                                        title="عرض مهام المشروع"
                                                      >
                                                        {isProjectOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                                      </button>
                                                      <FolderKanban className="w-3.5 h-3.5 text-emerald-600" />
                                                      <span 
                                                        onClick={() => onSelectProject(project.id)}
                                                        className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer"
                                                      >
                                                        {project.name}
                                                      </span>
                                                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                                                        ({projStats.completedTasks}/{projStats.totalTasks} مهام)
                                                      </span>
                                                    </div>

                                                    {/* Project Progress */}
                                                    <div className="flex items-center gap-2.5 shrink-0">
                                                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                                                        <div
                                                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                                          style={{ width: `${projStats.percentage}%` }}
                                                        />
                                                      </div>
                                                      <span className="font-mono font-bold text-emerald-700">
                                                        {projStats.percentage}%
                                                      </span>
                                                      <button
                                                        onClick={() => toggleProject(project.id)}
                                                        className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
                                                      >
                                                        {isProjectOpen ? 'طي المهام' : 'عرض المهام'}
                                                      </button>
                                                    </div>
                                                  </div>

                                                  {/* Project Tasks List (Tier 5: Tasks) */}
                                                  {isProjectOpen && (
                                                    <div className="border-t border-slate-100 bg-slate-50/70 p-2 space-y-1.5">
                                                      {projectTasks.map((task) => {
                                                        const depCheck = checkTaskDependencies(task, tasks);
                                                        const assignee = members.find((m) => m.id === task.assigneeId);

                                                        return (
                                                          <div
                                                            key={task.id}
                                                            className={`p-2 rounded border flex items-center justify-between gap-3 text-xs transition-colors ${
                                                              task.status === 'completed'
                                                                ? 'bg-white/80 border-slate-200'
                                                                : depCheck.isBlocked
                                                                ? 'bg-amber-50/50 border-amber-200'
                                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                                            }`}
                                                          >
                                                            {/* Checkbox and Title */}
                                                            <div className="flex items-center gap-2 flex-1 truncate">
                                                              <input
                                                                type="checkbox"
                                                                checked={task.status === 'completed'}
                                                                onChange={() => handleTaskCheck(task)}
                                                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                                              />
                                                              <span 
                                                                onClick={() => onSelectTask(task)}
                                                                className={`truncate cursor-pointer hover:text-indigo-600 font-medium ${
                                                                  task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                                                                }`}
                                                              >
                                                                {task.title}
                                                              </span>
                                                              {depCheck.isBlocked && (
                                                                <span 
                                                                  title={`معطلة بانتظار: ${depCheck.blockingTasks.map((b) => b.title).join('، ')}`}
                                                                  className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded shrink-0"
                                                                >
                                                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                                                  <span>معلقة باعتمادية</span>
                                                                </span>
                                                              )}
                                                            </div>

                                                            {/* Strategic Attributes (Impact, Value, Energy) */}
                                                            <div className="flex items-center gap-2 shrink-0">
                                                              {getEnergyBadge(task.energyLevel)}
                                                              <span 
                                                                title="درجة التأثير الاستراتيجي (1-10)"
                                                                className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100"
                                                              >
                                                                أثر: {task.impactScore || 5}/10
                                                              </span>
                                                              <span 
                                                                title="القيمة الناتجة (1-10)"
                                                                className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100"
                                                              >
                                                                قيمة: {task.valueScore || 5}/10
                                                              </span>
                                                              {assignee && (
                                                                <Avatar
                                                                  name={assignee.name}
                                                                  avatar={assignee.avatar}
                                                                  size="xs"
                                                                  title={assignee.name}
                                                                />
                                                              )}
                                                            </div>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}

                                                </div>
                                              );
                                            })
                                          )}
                                        </div>
                                      )}

                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
