import React, { useState, useEffect } from 'react';
import { X, Scale, Users, Calendar, HelpCircle, Target, Sparkles } from 'lucide-react';
import { Project, ProjectCategory, Priority, ProjectStatus, ProgressCalculationMode, TeamMember, StrategicGoal } from '../types';
import { Avatar } from './Avatar';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Partial<Project>) => void;
  initialProject?: Project | null;
  members: TeamMember[];
  goals?: StrategicGoal[];
}

const CATEGORIES: ProjectCategory[] = [
  'تطوير البرمجيات',
  'التصميم وتجربة المستخدم',
  'التسويق الرقمي',
  'البنية التحتية والشبكات',
  'إدارة العمليات',
  'الجودة والاختبار',
  'عام',
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
  members,
  goals = [],
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goalId, setGoalId] = useState<string>('');
  const [category, setCategory] = useState<ProjectCategory>('تطوير البرمجيات');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [priority, setPriority] = useState<Priority>('medium');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [calculationMode, setCalculationMode] = useState<ProgressCalculationMode>('weighted');
  const [targetBudgetHours, setTargetBudgetHours] = useState<number>(100);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name);
      setDescription(initialProject.description);
      setGoalId(initialProject.goalId || '');
      setCategory(initialProject.category);
      setStatus(initialProject.status);
      setPriority(initialProject.priority);
      setStartDate(initialProject.startDate);
      setDueDate(initialProject.dueDate);
      setCalculationMode(initialProject.calculationMode);
      setTargetBudgetHours(initialProject.targetBudgetHours || 100);
      setSelectedMemberIds(initialProject.memberIds || []);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setName('');
      setDescription('');
      setGoalId(goals[0]?.id || '');
      setCategory('تطوير البرمجيات');
      setStatus('active');
      setPriority('medium');
      setStartDate(today);
      setDueDate(nextMonth);
      setCalculationMode('weighted');
      setTargetBudgetHours(120);
      setSelectedMemberIds(members.slice(0, 3).map((m) => m.id));
    }
  }, [initialProject, isOpen, members, goals]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      goalId: goalId || undefined,
      category,
      status,
      priority,
      startDate,
      dueDate,
      calculationMode,
      targetBudgetHours: Number(targetBudgetHours) || 0,
      memberIds: selectedMemberIds,
      color: 'indigo',
    });
    onClose();
  };

  const toggleMember = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== memberId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, memberId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-xl w-full shadow-xl border border-slate-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {initialProject ? 'تعديل بيانات المشروع' : 'إنشاء مشروع استراتيجي جديد'}
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
          
          {/* Name */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              اسم المشروع <span className="text-rose-500">*</span>:
            </label>
            <input
              type="text"
              required
              placeholder="مثال: تطوير منصة التجارة الإلكترونية"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Strategic Goal Linkage (العلاقة بالهدف الأكبر) */}
          {goals.length > 0 && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-md">
              <label className="block font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>الهدف الاستراتيجي الأكبر (Goal Linkage):</span>
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full px-3 py-2 border border-indigo-200 bg-white rounded-md text-slate-800 cursor-pointer font-medium"
              >
                <option value="">بدون ربط استراتيجي مباشر</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    🎯 {g.title} ({g.quarter})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-indigo-700 block mt-1">
                ربط المشروع بهدف استراتيجي يتيح تدفق إنجاز المهام تصاعدياً إلى الرؤية والركائز.
              </span>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              وصف المشروع والأهداف:
            </label>
            <textarea
              rows={2}
              placeholder="وصف موجز لنطاق المشروع ومخرجاته المتوقعة..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                مجال / تصنيف المشروع:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                درجة الأولوية:
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 cursor-pointer"
              >
                <option value="urgent">عاجلة جداً (Urgent)</option>
                <option value="high">مرتفعة (High)</option>
                <option value="medium">متوسطة (Medium)</option>
                <option value="low">منخفضة (Low)</option>
              </select>
            </div>
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                تاريخ البداية:
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                تاريخ التسليم المستهدف:
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                حالة المشروع:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 cursor-pointer"
              >
                <option value="active">نشط (Active)</option>
                <option value="planning">قيد التخطيط (Planning)</option>
                <option value="on_hold">معلق مؤقتاً (On Hold)</option>
                <option value="completed">مكتمل (Completed)</option>
              </select>
            </div>
          </div>

          {/* Calculation Mode */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Scale className="w-4 h-4 text-indigo-600" />
                <span>آلية احتساب نسبة التقدم والإنجاز:</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`p-2.5 rounded border cursor-pointer transition-colors ${
                  calculationMode === 'weighted'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="calcMode"
                  value="weighted"
                  checked={calculationMode === 'weighted'}
                  onChange={() => setCalculationMode('weighted')}
                  className="sr-only"
                />
                <div className="text-xs mb-0.5">حساب بالأوزان النسبية</div>
                <div className="text-[10px] text-slate-500 font-normal">
                  يعتمد على وزن كل مهمة (1-10) ليعكس الإنجاز الحقيقي.
                </div>
              </label>

              <label
                className={`p-2.5 rounded border cursor-pointer transition-colors ${
                  calculationMode === 'subtask_inclusive'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="calcMode"
                  value="subtask_inclusive"
                  checked={calculationMode === 'subtask_inclusive'}
                  onChange={() => setCalculationMode('subtask_inclusive')}
                  className="sr-only"
                />
                <div className="text-xs mb-0.5">حساب بالمهام الفرعية</div>
                <div className="text-[10px] text-slate-500 font-normal">
                  يحسب تقدم كل مهمة فرعية بدقة (60% مهام + 40% فرعية).
                </div>
              </label>

              <label
                className={`p-2.5 rounded border cursor-pointer transition-colors ${
                  calculationMode === 'standard'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="calcMode"
                  value="standard"
                  checked={calculationMode === 'standard'}
                  onChange={() => setCalculationMode('standard')}
                  className="sr-only"
                />
                <div className="text-xs mb-0.5">حساب قياسي بسيط</div>
                <div className="text-[10px] text-slate-500 font-normal">
                  قسمة عدد المهام المكتملة على الإجمالي بالتساوي.
                </div>
              </label>
            </div>
          </div>

          {/* Budget Hours & Team Members */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                ساعات العمل المستهدفة:
              </label>
              <input
                type="number"
                min={0}
                value={targetBudgetHours}
                onChange={(e) => setTargetBudgetHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-800 mb-1">
                أعضاء الفريق المعينين ({selectedMemberIds.length}):
              </label>
              <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-md bg-slate-50 max-h-24 overflow-y-auto">
                {members.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Avatar
                        name={member.name}
                        avatar={member.avatar}
                        size="xs"
                      />
                      <span>{member.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
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
              {initialProject ? 'تحديث المشروع' : 'إنشاء المشروع'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
