import React, { useState, useEffect } from 'react';
import { Pillar, Vision, ValueGoal, Project, Task } from '../../types/hierarchical';
import { CustomSelect } from './CustomSelect';

// ---------------------------------------------------------
// 1. PILLAR MODAL
// ---------------------------------------------------------
interface PillarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pillar: Partial<Pillar>) => void;
  initialPillar?: Pillar | null;
}

export const PillarModal: React.FC<PillarModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPillar,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pillarGroup, setPillarGroup] = useState('Growth');
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState(1);
  const [showOnHome, setShowOnHome] = useState(true);
  const [status, setStatus] = useState<Pillar['status']>('active');

  useEffect(() => {
    if (initialPillar) {
      setTitle(initialPillar.title);
      setDescription(initialPillar.description);
      setPillarGroup(initialPillar.pillar_group);
      setPurpose(initialPillar.purpose);
      setPriority(initialPillar.priority);
      setShowOnHome(initialPillar.show_on_home);
      setStatus(initialPillar.status);
    } else {
      setTitle('');
      setDescription('');
      setPillarGroup('Growth');
      setPurpose('');
      setPriority(1);
      setShowOnHome(true);
      setStatus('active');
    }
  }, [initialPillar, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      pillar_group: pillarGroup.trim() || 'Growth',
      purpose: purpose.trim(),
      priority: Number(priority) || 1,
      show_on_home: showOnHome,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-[#e8e5de] overflow-hidden text-xs animate-in fade-in">
        <div className="p-4 sm:p-5 border-b border-[#f0eee9] flex items-center justify-between bg-[#fbfbfa]">
          <div>
            <h3 className="font-bold text-sm text-[#1a2420]">
              {initialPillar ? 'تعديل الركيزة' : 'إضافة ركيزة حياة جديدة'}
            </h3>
            <p className="text-[11px] text-[#6d7972]">الركيزة تمثل مجالك الحياتي الأكبر وغايتك الأساسية</p>
          </div>
          <button onClick={onClose} className="text-[#85918a] hover:text-[#1a2420] text-sm p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="font-bold text-[#3a453f] block mb-1">اسم الركيزة: *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: العلاقة مع الله، بناء الذات، الصحة والجسد..."
              className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] focus:border-[#174235] outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-[#3a453f] block mb-1">
              الغاية الكبرى للركيزة (Purpose — The Big Why): *
            </label>
            <textarea
              rows={3}
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="اكتب العبارة التوجيهية الكبرى التي تمثل بوصلتك في هذا المجال الحياتي..."
              className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] focus:border-[#174235] outline-hidden"
            />
            <span className="text-[10px] text-[#78857e]">ستظهر هذه الغاية بشكل بارز كبوصلة توجيهية كبرى</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#3a453f] block mb-1">المجموعة:</label>
              <input
                type="text"
                value={pillarGroup}
                onChange={(e) => setPillarGroup(e.target.value)}
                placeholder="Growth, Vitality, Impact, Wealth..."
                className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] focus:border-[#174235] outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-[#3a453f] block mb-1">ترتيب الأولوية:</label>
              <input
                type="number"
                min={1}
                max={20}
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
                className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] focus:border-[#174235] outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#3a453f] block mb-1">الوصف المختصر:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف إضافي لطبيعة الركيزة..."
              className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] focus:border-[#174235] outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-[#f8f7f4] rounded-xl border border-[#ece8e0]">
            <div>
              <span className="font-bold text-[#1a2420] block">عرض في الصفحة الرئيسية</span>
              <span className="text-[11px] text-[#78857e]">تثبيت الركيزة في لوحة المتابعة السريعة</span>
            </div>
            <input
              type="checkbox"
              checked={showOnHome}
              onChange={(e) => setShowOnHome(e.target.checked)}
              className="w-4 h-4 text-[#174235] rounded cursor-pointer accent-[#174235]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f0eee9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#56625b] hover:bg-[#f2efe9] rounded-xl font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#174235] hover:bg-[#12352a] text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              حفظ الركيزة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// 2. VISION MODAL
// ---------------------------------------------------------
interface VisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vision: Partial<Vision>) => void;
  initialVision?: Vision | null;
  pillarTitle?: string;
  pillars?: Pillar[];
}

export const VisionModal: React.FC<VisionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialVision,
  pillarTitle,
  pillars = [],
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState('3-5 سنوات');
  const [pillarId, setPillarId] = useState(pillars[0]?.id || '');
  const [status, setStatus] = useState<Vision['status']>('active');

  useEffect(() => {
    if (initialVision) {
      setTitle(initialVision.title);
      setDescription(initialVision.description);
      setTimeframe(initialVision.timeframe || '3-5 سنوات');
      setPillarId(initialVision.pillar_id);
      setStatus(initialVision.status);
    } else {
      setTitle('');
      setDescription('');
      setTimeframe('3-5 سنوات');
      if (pillars.length > 0) setPillarId(pillars[0].id);
      setStatus('active');
    }
  }, [initialVision, isOpen, pillars]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      timeframe: timeframe.trim(),
      pillar_id: pillarId,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-[#e8e5de] overflow-hidden text-xs animate-in fade-in">
        <div className="p-4 sm:p-5 border-b border-[#f0eee9] flex items-center justify-between bg-[#fbfbfa]">
          <div>
            <h3 className="font-bold text-sm text-[#1a2420]">
              {initialVision ? 'تعديل الرؤية' : 'صياغة رؤية مستقبلية جديدة'}
            </h3>
            {pillarTitle && (
              <p className="text-[11px] text-[#174235] font-semibold mt-0.5">
                تابع للركيزة: {pillarTitle}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-[#85918a] hover:text-[#1a2420] text-sm p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {pillars && pillars.length > 0 && !pillarTitle && (
            <div>
              <label className="font-bold text-[#3a453f] block mb-1">الركيزة التابعة لها: *</label>
              <CustomSelect
                value={pillarId}
                onChange={(val) => setPillarId(val)}
                options={pillars.map((p) => ({
                  value: p.id,
                  label: `${p.title} (${p.pillar_group})`
                }))}
                className="w-full"
                buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                dropdownClassName="w-full"
              />
            </div>
          )}

          <div>
            <label className="font-bold text-[#3a453f] block mb-1">عنوان الرؤية: *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: الرسوخ المعرفي، الاستقلال المالي..."
              className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] focus:border-[#174235] outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-[#3a453f] block mb-1">بيان الرؤية والأفق المستقبلي:</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب وصفاً مفصلاً للصورة التي تطمح إليها مستقبلاً..."
              className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] focus:border-[#174235] outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-[#3a453f] block mb-1">الأفق الزمني:</label>
            <input
              type="text"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              placeholder="مثال: 3-5 سنوات، 2026-2030، مستمر..."
              className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f0eee9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#56625b] hover:bg-[#f2efe9] rounded-xl font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#174235] hover:bg-[#12352a] text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              حفظ الرؤية
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// 3. VALUE GOAL MODAL
// ---------------------------------------------------------
interface ValueGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Partial<ValueGoal>) => void;
  initialGoal?: ValueGoal | null;
  parentTitle?: string;
  visions?: Vision[];
  pillars?: Pillar[];
}

export const ValueGoalModal: React.FC<ValueGoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGoal,
  parentTitle,
  visions = [],
  pillars = [],
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<ValueGoal['status']>('not_started');
  const [visionId, setVisionId] = useState('');

  useEffect(() => {
    if (initialGoal) {
      setTitle(initialGoal.title);
      setDescription(initialGoal.description);
      setTargetDate(initialGoal.target_date || '');
      setStatus(initialGoal.status);
      setVisionId(initialGoal.vision_id || '');
    } else {
      setTitle('');
      setDescription('');
      setTargetDate('');
      setStatus('not_started');
      setVisionId(visions[0]?.id || '');
    }
  }, [initialGoal, isOpen, visions]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      target_date: targetDate || null,
      status,
      vision_id: visionId || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-[#e8e5de] overflow-hidden text-xs animate-in fade-in">
        <div className="p-4 sm:p-5 border-b border-[#f0eee9] flex items-center justify-between bg-[#fbfbfa]">
          <div>
            <h3 className="font-bold text-sm text-[#1a2420]">
              {initialGoal ? 'تعديل هدف القيمة' : 'إضافة هدف قيمة استراتيجي'}
            </h3>
            {parentTitle && (
              <p className="text-[11px] text-[#174235] font-semibold mt-0.5">
                الأب الحالي: {parentTitle}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-[#85918a] hover:text-[#1a2420] text-sm p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="font-bold text-[#3a453f] block mb-1">عنوان الهدف: *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: الوصول إلى 100,000 جنيه صافي ربح شهري..."
              className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] focus:border-[#174235] outline-hidden"
            />
          </div>

          {visions.length > 0 && (
            <div>
              <label className="font-bold text-[#3a453f] block mb-1">الرؤية التابع لها:</label>
              <CustomSelect
                value={visionId}
                onChange={(val) => setVisionId(val)}
                options={[
                  { value: '', label: 'بدون رؤية وسيطة (ربط بالركيزة مباشرة)' },
                  ...visions.map((v) => ({ value: v.id, label: v.title }))
                ]}
                className="w-full"
                buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                dropdownClassName="w-full"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#3a453f] block mb-1">الحالة:</label>
              <CustomSelect
                value={status}
                onChange={(val) => setStatus(val as any)}
                options={[
                  { value: 'not_started', label: 'لم يبدأ', icon: '⚪' },
                  { value: 'in_progress', label: 'قيد العمل', icon: '🟡' },
                  { value: 'completed', label: 'مكتمل', icon: '🟢' },
                ]}
                className="w-full"
                buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                dropdownClassName="w-full"
              />
            </div>

            <div>
              <label className="font-bold text-[#3a453f] block mb-1">تاريخ الاستحقاق المستهدف:</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#3a453f] block mb-1">تفاصيل إضافية / معايير النجاح:</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب معايير إنجاز هذا الهدف ومؤشرات تحقيقه..."
              className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] focus:border-[#174235] outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f0eee9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#56625b] hover:bg-[#f2efe9] rounded-xl font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#174235] hover:bg-[#12352a] text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              حفظ الهدف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// 4. PROJECT MODAL
// ---------------------------------------------------------
interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<Project>) => void;
  initialProject?: Project | null;
  goalTitle?: string;
  goals?: ValueGoal[];
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
  goalTitle,
  goals = [],
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Project['status']>('in_progress');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [goalId, setGoalId] = useState(goals[0]?.id || '');

  useEffect(() => {
    if (initialProject) {
      setTitle(initialProject.title);
      setDescription(initialProject.description);
      setStatus(initialProject.status);
      setStartDate(initialProject.start_date || '');
      setDueDate(initialProject.due_date || '');
      setGoalId(initialProject.goal_id);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setStatus('in_progress');
      setStartDate(today);
      setDueDate(today);
      if (goals.length > 0) setGoalId(goals[0].id);
    }
  }, [initialProject, isOpen, goals]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      start_date: startDate,
      due_date: dueDate,
      goal_id: goalId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-[#e8e5de] overflow-hidden text-xs animate-in fade-in">
        <div className="p-4 sm:p-5 border-b border-[#f0eee9] flex items-center justify-between bg-[#fbfbfa]">
          <div>
            <h3 className="font-bold text-sm text-[#1a2420]">
              {initialProject ? 'تعديل المشروع' : 'إضافة مشروع تنفيذي جديد'}
            </h3>
            {goalTitle && (
              <p className="text-[11px] text-[#174235] font-semibold mt-0.5">
                تابع للهدف: {goalTitle}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-[#85918a] hover:text-[#1a2420] text-sm p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="font-bold text-[#3a453f] block mb-1">عنوان المشروع: *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: إكمال التدريب العملي الممّول..."
              className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] focus:border-[#174235] outline-hidden"
            />
          </div>

          {goals.length > 0 && !goalTitle && (
            <div>
              <label className="font-bold text-[#3a453f] block mb-1">الهدف التابع له: *</label>
              <CustomSelect
                value={goalId}
                onChange={(val) => setGoalId(val)}
                options={goals.map((g) => ({ value: g.id, label: g.title }))}
                className="w-full"
                buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                dropdownClassName="w-full"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-[#3a453f] block mb-1">حالة المشروع:</label>
              <CustomSelect
                value={status}
                onChange={(val) => setStatus(val as any)}
                options={[
                  { value: 'in_progress', label: 'قيد التنفيذ', icon: '🟡' },
                  { value: 'planned', label: 'مخطط', icon: '⚪' },
                  { value: 'completed', label: 'مكتمل', icon: '🟢' },
                  { value: 'on_hold', label: 'معلق', icon: '⏸️' },
                ]}
                className="w-full"
                buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                dropdownClassName="w-full"
              />
            </div>

            <div>
              <label className="font-bold text-[#3a453f] block mb-1">تاريخ البدء:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-[#3a453f] block mb-1">تاريخ التسليم:</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#3a453f] block mb-1">وصف المشروع:</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف تفصيلي لأهداف المشروع ومخرجاته..."
              className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] focus:border-[#174235] outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f0eee9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#56625b] hover:bg-[#f2efe9] rounded-xl font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#174235] hover:bg-[#12352a] text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              حفظ المشروع
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// 5. TASK MODAL
// ---------------------------------------------------------
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  initialTask?: Task | null;
  projectTitle?: string;
  projects?: Project[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  projectTitle,
  projects = [],
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description);
      setStatus(initialTask.status);
      setPriority(initialTask.priority);
      setDueDate(initialTask.due_date || '');
      setProjectId(initialTask.project_id);
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setDueDate('');
      if (projects.length > 0) setProjectId(projects[0].id);
    }
  }, [initialTask, isOpen, projects]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      due_date: dueDate || null,
      project_id: projectId,
      completed_at: status === 'done' ? new Date().toISOString() : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-[#e8e5de] overflow-hidden text-xs animate-in fade-in">
        <div className="p-4 sm:p-5 border-b border-[#f0eee9] flex items-center justify-between bg-[#fbfbfa]">
          <div>
            <h3 className="font-bold text-sm text-[#1a2420]">
              {initialTask ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
            </h3>
            {projectTitle && (
              <p className="text-[11px] text-[#174235] font-semibold mt-0.5">
                المشروع التابع له: {projectTitle}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-[#85918a] hover:text-[#1a2420] text-sm p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="font-bold text-[#3a453f] block mb-1">عنوان المهمة: *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="اكتب اسم المهمة الواضحة والتنفيذية..."
              className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] focus:border-[#174235] outline-hidden"
              autoFocus
            />
          </div>

          {projects.length > 0 && !projectTitle && (
            <div>
              <label className="font-bold text-[#3a453f] block mb-1">المشروع التابع له: *</label>
              <CustomSelect
                value={projectId}
                onChange={(val) => setProjectId(val)}
                options={projects.map((p) => ({ value: p.id, label: p.title }))}
                className="w-full"
                buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                dropdownClassName="w-full"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-[#3a453f] block mb-1">الحالة:</label>
              <CustomSelect
                value={status}
                onChange={(val) => setStatus(val as any)}
                options={[
                  { value: 'todo', label: 'قيد الانتظار', icon: '⚪' },
                  { value: 'in_progress', label: 'قيد العمل', icon: '🟡' },
                  { value: 'done', label: 'منجزة', icon: '🟢' },
                ]}
                className="w-full"
                buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                dropdownClassName="w-full"
              />
            </div>

            <div>
              <label className="font-bold text-[#3a453f] block mb-1">الأولوية:</label>
              <CustomSelect
                value={priority}
                onChange={(val) => setPriority(val as any)}
                options={[
                  { value: 'high', label: 'عالية', icon: '🔴' },
                  { value: 'medium', label: 'متوسطة', icon: '🟡' },
                  { value: 'low', label: 'منخفضة', icon: '🟢' },
                ]}
                className="w-full"
                buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                dropdownClassName="w-full"
              />
            </div>

            <div>
              <label className="font-bold text-[#3a453f] block mb-1">تاريخ الاستحقاق:</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#3a453f] block mb-1">ملاحظات المهمة:</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أي تفاصيل أو روابط لازمة لإنجاز المهمة..."
              className="w-full p-2.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] focus:border-[#174235] outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f0eee9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#56625b] hover:bg-[#f2efe9] rounded-xl font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#174235] hover:bg-[#12352a] text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              حفظ المهمة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
