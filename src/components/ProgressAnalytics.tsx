import React, { useState } from 'react';
import { 
  TrendingUp, 
  Scale, 
  Calculator, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  Users, 
  AlertCircle
} from 'lucide-react';
import { Project, Task, TeamMember } from '../types';
import { calculateProjectProgress } from '../utils/progressCalculator';

interface ProgressAnalyticsProps {
  projects: Project[];
  tasks: Task[];
  members: TeamMember[];
}

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({
  projects,
  tasks,
  members,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || ''
  );
  
  // State for What-If Simulator: IDs of tasks hypothetically completed
  const [simulatedCompletedTaskIds, setSimulatedCompletedTaskIds] = useState<string[]>([]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Current real stats for selected project
  const currentStats = selectedProject ? calculateProjectProgress(selectedProject, tasks) : null;

  // Calculate simulated stats if user checked any tasks in simulator
  const simulatedTasks = tasks.map((t) => {
    if (simulatedCompletedTaskIds.includes(t.id)) {
      return {
        ...t,
        status: 'completed' as const,
        subtasks: t.subtasks?.map((s) => ({ ...s, completed: true })) || [],
      };
    }
    return t;
  });

  const simulatedStats = selectedProject
    ? calculateProjectProgress(selectedProject, simulatedTasks)
    : null;

  const toggleSimulationTask = (taskId: string) => {
    if (simulatedCompletedTaskIds.includes(taskId)) {
      setSimulatedCompletedTaskIds(simulatedCompletedTaskIds.filter((id) => id !== taskId));
    } else {
      setSimulatedCompletedTaskIds([...simulatedCompletedTaskIds, taskId]);
    }
  };

  const projectTasks = tasks.filter((t) => t.projectId === selectedProjectId);
  const incompleteTasks = projectTasks.filter((t) => t.status !== 'completed');

  if (projects.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500 text-xs">
        لا توجد مشاريع مضافة حتى الآن لعرض الحسابات والتحليلات. يرجى إنشاء مشروع أولاً.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Project Selector */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Calculator className="w-5 h-5" />
              <h2 className="text-base font-bold text-slate-900">
                محرك حساب وتحليل تقدم المشاريع
              </h2>
            </div>
            <p className="text-xs text-slate-600">
              شرح معادلات الاحتساب ومحاكاة القفزات الإنجازية بناءً على أوزان المهام وساعات العمل.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">اختر المشروع:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSimulatedCompletedTaskIds([]);
              }}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-800 font-semibold focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Current Project Progress Breakdown & Formula */}
      {selectedProject && currentStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main gauge and stats */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium mb-1">
                النتيجة الحالية المحسوبة
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-bold font-mono text-slate-900">
                  {currentStats.percentage}%
                </span>
                <span className="text-xs font-semibold text-indigo-600">
                  {selectedProject.calculationMode === 'weighted'
                    ? 'محسوب بالأوزان'
                    : selectedProject.calculationMode === 'subtask_inclusive'
                    ? 'شامل المهام الفرعية'
                    : 'محسوب بعدد المهام'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-4">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${currentStats.percentage}%` }}
                />
              </div>

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">المهام المكتملة:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {currentStats.completedTasks} من أصل {currentStats.totalTasks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">نقاط الجهد المنجزة:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {currentStats.completedWeight} من أصل {currentStats.totalWeight} نقطة
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المهام الفرعية المنجزة:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {currentStats.completedSubtasks} من أصل {currentStats.totalSubtasks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ساعات العمل الفعلية:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {currentStats.loggedHours} / {currentStats.totalEstimatedHours} ساعة
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">حالة المسار:</span>
              <span className={`font-semibold ${
                currentStats.health === 'completed'
                  ? 'text-emerald-700'
                  : currentStats.health === 'delayed'
                  ? 'text-rose-600'
                  : currentStats.health === 'at_risk'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}>
                {currentStats.health === 'completed' && 'مكتمل بنجاح'}
                {currentStats.health === 'delayed' && 'متأخر زمنياً'}
                {currentStats.health === 'at_risk' && 'معرض للتأخير'}
                {currentStats.health === 'on_track' && 'على المسار الصحيح'}
              </span>
            </div>
          </div>

          {/* Explanation of the formula used */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 lg:col-span-2">
            <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>معادلة الاحتساب البرمجية المعتمدة لهذا المشروع:</span>
            </h3>

            {selectedProject.calculationMode === 'weighted' && (
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-md border border-slate-200">
                <div className="font-mono text-slate-900 font-bold bg-white p-2.5 rounded border border-slate-200 text-center text-xs">
                  النسبة = (مجموع أوزان المهام المكتملة + نسب المهام قيد التنفيذ والمراجعة) ÷ إجمالي الأوزان × 100
                </div>
                <p>
                  <strong>لماذا هذا الأسلوب؟</strong> لا تتساوى المهام في الأثر؛ فإنجاز مهمة بنية تحتية وزنها <span className="font-mono font-bold">8 نقاط</span> يرفع نسبة المشروع أكثر من إنجاز مهمة تنسيق وزنها <span className="font-mono font-bold">2 نقطة</span>.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="font-semibold text-emerald-700 block">مكتملة:</span>
                    <span>100% من وزن المهمة</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="font-semibold text-amber-700 block">قيد المراجعة:</span>
                    <span>85% من وزن المهمة</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="font-semibold text-blue-700 block">قيد التنفيذ:</span>
                    <span>نسبة المهام الفرعية أو 45%</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="font-semibold text-slate-700 block">قيد الانتظار:</span>
                    <span>0%</span>
                  </div>
                </div>
              </div>
            )}

            {selectedProject.calculationMode === 'subtask_inclusive' && (
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-md border border-slate-200">
                <div className="font-mono text-slate-900 font-bold bg-white p-2.5 rounded border border-slate-200 text-center text-xs">
                  النسبة = (60% × أوزان المهام الرئيسية) + (40% × معدل اكتمال المهام الفرعية الدقيقة)
                </div>
                <p>
                  <strong>حساب عميق ومتعدد الطبقات:</strong> يضمن عدم بقاء التقدم ثابتاً أثناء تنفيذ مهمة ضخمة؛ فكلما أتم الفريق مهمة فرعية ترتفع نسبة المشروع تدريجياً وبشكل فوري!
                </p>
              </div>
            )}

            {selectedProject.calculationMode === 'standard' && (
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-md border border-slate-200">
                <div className="font-mono text-slate-900 font-bold bg-white p-2.5 rounded border border-slate-200 text-center text-xs">
                  النسبة = (عدد المهام المكتملة ÷ إجمالي عدد المهام) × 100
                </div>
                <p>
                  <strong>الحساب القياسي:</strong> يعامل جميع المهام بشكل متساوٍ، وهو مثالي للمشاريع ذات المهام المتماثلة في الحجم والوقت.
                </p>
              </div>
            )}

            {/* Task Weight Table */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-slate-900 block mb-2">
                جدول أوزان مهام هذا المشروع وتأثيرها:
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {projectTasks.map((t) => {
                  const weightPercent = currentStats.totalWeight > 0
                    ? Math.round((t.weight / currentStats.totalWeight) * 100)
                    : 0;

                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-1 px-2.5 bg-slate-50 rounded text-xs"
                    >
                      <div className="flex items-center gap-2 truncate max-w-sm">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          t.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-300'
                        }`} />
                        <span className="truncate">{t.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 shrink-0 font-mono">
                        <span>وزن: {t.weight} ن</span>
                        <span className="text-indigo-600 font-medium">({weightPercent}% من المشروع)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 3. What-If Simulator (محاكي حساب القفزات الإنجازية) */}
      {selectedProject && currentStats && incompleteTasks.length > 0 && simulatedStats && (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>مختبر محاكاة التقدم</span>
              </h3>
              <p className="text-xs text-slate-600">
                حدد المهام غير المكتملة لترى فوراً كيف ستقفز نسبة إنجاز المشروع وصحته عند إتمامها!
              </p>
            </div>

            {/* Simulation Comparison Result Pill */}
            <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <div className="text-xs">
                <span className="text-slate-500 block">النسبة بعد المحاكاة:</span>
                <span className="font-mono text-base font-bold text-emerald-600">
                  {simulatedStats.percentage}%
                </span>
              </div>
              <div className="text-xs border-r border-slate-200 pr-3">
                <span className="text-slate-500 block">القفزة المتوقعة:</span>
                <span className="font-mono text-base font-bold text-indigo-600">
                  +{Math.max(0, simulatedStats.percentage - currentStats.percentage)}%
                </span>
              </div>
              {simulatedCompletedTaskIds.length > 0 && (
                <button
                  onClick={() => setSimulatedCompletedTaskIds([])}
                  className="text-xs text-slate-400 hover:text-slate-700 underline cursor-pointer"
                >
                  إعادة ضبط
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {incompleteTasks.map((task) => {
              const isSimulated = simulatedCompletedTaskIds.includes(task.id);
              const weightImpact = currentStats.totalWeight > 0
                ? Math.round((task.weight / currentStats.totalWeight) * 100)
                : 0;

              return (
                <div
                  key={task.id}
                  onClick={() => toggleSimulationTask(task.id)}
                  className={`p-3 rounded-md border text-xs cursor-pointer transition-all ${
                    isSimulated
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={isSimulated}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 pointer-events-none"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 leading-snug mb-1">
                        {task.title}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>الوزن: {task.weight} نقاط</span>
                        <span className="text-indigo-600 font-medium">
                          +{weightImpact}% قفزة
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Cross-Projects Comparison Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span>مقارنة نسب إنجاز جميع المشاريع في المنصة</span>
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          نظرة شمولية توضح تقدم كل مسار عمل بناءً على أوزان مهامه.
        </p>

        <div className="space-y-3.5">
          {projects.map((proj) => {
            const stats = calculateProjectProgress(proj, tasks);

            return (
              <div key={proj.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{proj.name}</span>
                    <span className="text-[11px] text-slate-400">({proj.category})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">
                      {stats.completedTasks}/{stats.totalTasks} مهام
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {stats.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      stats.percentage === 100
                        ? 'bg-emerald-500'
                        : stats.health === 'delayed'
                        ? 'bg-rose-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
