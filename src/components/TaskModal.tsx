import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Scale, Clock, CheckSquare, Zap, Target, Sparkles, AlertCircle } from 'lucide-react';
import { Task, Project, TeamMember, TaskStatus, Priority, SubTask, EnergyLevel } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  initialTask?: Task | null;
  projects: Project[];
  members: TeamMember[];
  allTasks?: Task[];
  defaultProjectId?: string;
  defaultStatus?: TaskStatus;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  projects,
  members,
  allTasks = [],
  defaultProjectId,
  defaultStatus = 'todo',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<Priority>('medium');
  const [weight, setWeight] = useState<number>(5);
  const [impactScore, setImpactScore] = useState<number>(7);
  const [valueScore, setValueScore] = useState<number>(7);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [goalAlignmentScore, setGoalAlignmentScore] = useState<number>(8);
  const [estimatedHours, setEstimatedHours] = useState<number>(10);
  const [loggedHours, setLoggedHours] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description);
      setProjectId(initialTask.projectId);
      setStatus(initialTask.status);
      setPriority(initialTask.priority);
      setWeight(initialTask.weight || 5);
      setImpactScore(initialTask.impactScore || 7);
      setValueScore(initialTask.valueScore || 7);
      setEnergyLevel(initialTask.energyLevel || 'medium');
      setDependencies(initialTask.dependencies || []);
      setGoalAlignmentScore(initialTask.goalAlignmentScore || 8);
      setEstimatedHours(initialTask.estimatedHours || 10);
      setLoggedHours(initialTask.loggedHours || 0);
      setStartDate(initialTask.startDate);
      setDueDate(initialTask.dueDate);
      setAssigneeId(initialTask.assigneeId);
      setSubtasks(initialTask.subtasks || []);
      setTagInput(initialTask.tags?.join(', ') || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setProjectId(defaultProjectId || projects[0]?.id || '');
      setStatus(defaultStatus);
      setPriority('medium');
      setWeight(5);
      setImpactScore(7);
      setValueScore(7);
      setEnergyLevel('medium');
      setDependencies([]);
      setGoalAlignmentScore(8);
      setEstimatedHours(8);
      setLoggedHours(0);
      setStartDate(today);
      setDueDate(nextWeek);
      setAssigneeId(members[0]?.id || '');
      setSubtasks([]);
      setTagInput('');
    }
  }, [initialTask, isOpen, defaultProjectId, defaultStatus, projects, members]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: SubTask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleToggleDependency = (depTaskId: string) => {
    setDependencies((prev) => 
      prev.includes(depTaskId)
        ? prev.filter((id) => id !== depTaskId)
        : [...prev, depTaskId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      title: title.trim(),
      description: description.trim(),
      projectId,
      status,
      priority,
      weight: Number(weight) || 1,
      impactScore: Number(impactScore) || 5,
      valueScore: Number(valueScore) || 5,
      energyLevel,
      dependencies,
      goalAlignmentScore: Number(goalAlignmentScore) || 8,
      estimatedHours: Number(estimatedHours) || 0,
      loggedHours: Number(loggedHours) || 0,
      startDate,
      dueDate,
      assigneeId,
      subtasks,
      tags,
    });
    onClose();
  };

  // Potential dependencies: other tasks in the same project, excluding current task
  const potentialDependencies = allTasks.filter(
    (t) => t.projectId === projectId && t.id !== initialTask?.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-xl w-full shadow-xl border border-slate-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {initialTask ? 'تعديل المهمة الاستراتيجية' : 'إضافة مهمة استراتيجية جديدة'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              عنوان المهمة <span className="text-rose-500">*</span>:
            </label>
            <input
              type="text"
              required
              placeholder="مثال: إعداد واجهات بوابات الدفع الإلكتروني"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Project & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                المشروع التابع له:
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 cursor-pointer font-medium"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                المسؤول عن التنفيذ:
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 cursor-pointer"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              تفاصيل وملاحظات المهمة:
            </label>
            <textarea
              rows={2}
              placeholder="شرح متطلبات التنفيذ، معايير القبول، وروابط المراجع..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Strategic Attributes Block: Energy, Impact, Value, Alignment */}
          <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-3">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>الخصائص الاستراتيجية وتحديد الأولويات الذكية:</span>
            </span>

            {/* Energy Level Required */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                مستوى الطاقة والتركيز المطلوب للمهمة:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'low', label: '🔋 طاقة خفيفة', desc: 'مهام سريعة / روتينية' },
                  { id: 'medium', label: '⚡ طاقة متوسطة', desc: 'عمل تنفيذي منتظم' },
                  { id: 'high', label: '🚀 تركيز عميق', desc: 'تفكير استراتيجي وابتكار' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEnergyLevel(item.id as EnergyLevel)}
                    className={`p-2 rounded border text-right transition-colors cursor-pointer ${
                      energyLevel === item.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className={`text-[10px] ${energyLevel === item.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Impact & Value Score Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>التأثير الاستراتيجي:</span>
                  <span className="font-mono text-indigo-600 font-bold">{impactScore}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={impactScore}
                  onChange={(e) => setImpactScore(Number(e.target.value))}
                  className="w-full cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>القيمة الناتجة:</span>
                  <span className="font-mono text-emerald-600 font-bold">{valueScore}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={valueScore}
                  onChange={(e) => setValueScore(Number(e.target.value))}
                  className="w-full cursor-pointer accent-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Dependencies (الاعتماديات بين المهام) */}
          {potentialDependencies.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <label className="block font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>اعتمادية المهمة (يجب إنجاز هذه المهام أولاً):</span>
              </label>
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {potentialDependencies.map((dep) => (
                  <label 
                    key={dep.id} 
                    className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={dependencies.includes(dep.id)}
                      onChange={() => handleToggleDependency(dep.id)}
                      className="w-3.5 h-3.5 text-indigo-600 rounded"
                    />
                    <span className="text-slate-800 truncate flex-1 font-medium">{dep.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      dep.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {dep.status === 'completed' ? 'مكتملة ✅' : 'قيد الانتظار'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                حالة المهمة:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 cursor-pointer"
              >
                <option value="todo">قائمة الانتظار</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="in_review">قيد المراجعة</option>
                <option value="completed">مكتملة بنجاح</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                الأولوية:
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 cursor-pointer"
              >
                <option value="urgent">عاجلة جداً</option>
                <option value="high">مرتفعة</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
            </div>
          </div>

          {/* Task Weight (Impact on progress calculation) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Scale className="w-4 h-4 text-indigo-600" />
                <span>وزن المهمة في حساب تقدم المشروع:</span>
              </div>
              <span className="font-mono font-bold text-xs text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                {weight} من 10
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Hours & Dates */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                الساعات التقديرية:
              </label>
              <input
                type="number"
                min={0}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                الساعات المنقضية:
              </label>
              <input
                type="number"
                min={0}
                value={loggedHours}
                onChange={(e) => setLoggedHours(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                تاريخ البدء:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                الموعد النهائي:
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
              />
            </div>
          </div>

          {/* Subtasks Builder */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              قائمة المهام الفرعية:
            </label>
            
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="أضف مهمة فرعية واضغط إضافة..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => handleToggleSubtask(sub.id)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded"
                      />
                      <span className={sub.completed ? 'line-through text-slate-400' : 'text-slate-800'}>
                        {sub.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(sub.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              الوسوم والكلمات الدلالية (مفصولة بفاصلة):
            </label>
            <input
              type="text"
              placeholder="مثال: Backend, Security, SRE"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-xs cursor-pointer"
            >
              {initialTask ? 'تحديث المهمة' : 'حفظ المهمة'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
