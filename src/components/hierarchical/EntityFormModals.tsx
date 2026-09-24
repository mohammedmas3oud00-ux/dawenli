import React, { useState, useEffect } from 'react';
import { Pillar, Vision, ValueGoal, Project, Task } from '../../types/hierarchical';
import { CustomSelect } from './CustomSelect';
import { Sparkles, Loader2, CheckSquare } from 'lucide-react';
import { generateAiTaskBreakdown, AiTaskSuggestion } from '../../services/aiService';

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
  const [pillarGroup, setPillarGroup] = useState('شخصي');
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
      setPillarGroup('شخصي');
      setPurpose('');
      setPriority(1);
      setShowOnHome(true);
      setStatus('active');
    }
  }, [initialPillar, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      pillar_group: pillarGroup.trim() || 'شخصي',
      purpose: purpose.trim(),
      priority: Number(priority) || 1,
      show_on_home: showOnHome,
      status,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pillar-modal-title"
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-[#16201b] rounded-2xl max-w-lg w-full shadow-2xl border border-[#e8e5de] dark:border-[#26372d] overflow-hidden text-xs transition-colors">
        <div className="p-4 sm:p-5 border-b border-[#f0eee9] dark:border-[#223028] flex items-center justify-between bg-[#fbfbfa] dark:bg-[#1b2620]">
          <div>
            <h3 id="pillar-modal-title" className="font-bold text-sm text-[#1a2420] dark:text-white">
              {initialPillar ? 'تعديل مجال الحياة (الركيزة)' : 'إضافة مجال حياة جديد'}
            </h3>
            <p className="text-[11px] text-[#6d7972] dark:text-[#9bb0a3]">يمثل مجالك الحياتي الأكبر وبوصلتك الأساسية</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="text-[#85918a] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white text-sm p-1.5 rounded-lg hover:bg-[#f2efe8] dark:hover:bg-[#22332a] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">اسم المجال أو الركيزة: *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: الصحة واللياقة، التطوير المهني، الأسرة..."
              className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden"
              autoFocus
            />
          </div>

          <div>
            <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">
              الغاية والرسالة (The Big Why): *
            </label>
            <textarea
              rows={3}
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="اكتب العبارة التوجيهية الكبرى التي تمثل بوصلتك في هذا المجال الحياتي..."
              className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">التصنيف العام:</label>
              <input
                type="text"
                value={pillarGroup}
                onChange={(e) => setPillarGroup(e.target.value)}
                placeholder="تطوير، صحة، أعمال، روحانيات..."
                className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">ترتيب الأولوية:</label>
              <input
                type="number"
                min={1}
                max={20}
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
                className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">الوصف المختصر:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف توضيحي لطبيعة هذا المجال..."
              className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-[#f8f7f4] dark:bg-[#192620] rounded-xl border border-[#ece8e0] dark:border-[#24372d]">
            <div>
              <span className="font-bold text-[#1a2420] dark:text-white block">عرض في الصفحة الرئيسية</span>
              <span className="text-[11px] text-[#78857e] dark:text-[#9bb0a3]">تثبيت هذا المجال في لوحة المتابعة السريعة</span>
            </div>
            <input
              type="checkbox"
              checked={showOnHome}
              onChange={(e) => setShowOnHome(e.target.checked)}
              className="w-4 h-4 text-[#174235] dark:text-emerald-500 rounded cursor-pointer accent-[#174235] dark:accent-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f0eee9] dark:border-[#223028]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#56625b] dark:text-[#a2b3aa] hover:bg-[#f2efe9] dark:hover:bg-[#203027] rounded-xl font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden"
            >
              حفظ المجال
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vision-modal-title"
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-[#16201b] rounded-2xl max-w-lg w-full shadow-2xl border border-[#e8e5de] dark:border-[#26372d] overflow-hidden text-xs transition-colors">
        <div className="p-4 sm:p-5 border-b border-[#f0eee9] dark:border-[#223028] flex items-center justify-between bg-[#fbfbfa] dark:bg-[#1b2620]">
          <div>
            <h3 id="vision-modal-title" className="font-bold text-sm text-[#1a2420] dark:text-white">
              {initialVision ? 'تعديل الرؤية المستقبلية' : 'صياغة رؤية مستقبلية جديدة'}
            </h3>
            {pillarTitle && (
              <p className="text-[11px] text-[#174235] dark:text-emerald-400 font-semibold mt-0.5">
                المجال التابع له: {pillarTitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="text-[#85918a] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white text-sm p-1.5 rounded-lg hover:bg-[#f2efe8] dark:hover:bg-[#22332a] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {pillars && pillars.length > 0 && !pillarTitle && (
            <div>
              <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">المجال التابع له: *</label>
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
            <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">عنوان الرؤية: *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: التمكن المهني والريادة، الاستقلال المالي..."
              className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden"
              autoFocus
            />
          </div>

          <div>
            <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">بيان الرؤية والأفق المنشود:</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب وصفاً للصورة التي تطمح لتحقيقها مستقبلاً..."
              className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">الأفق الزمني (Timeframe):</label>
            <input
              type="text"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              placeholder="مثال: 3-5 سنوات، 2026-2030..."
              className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f0eee9] dark:border-[#223028]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#56625b] dark:text-[#a2b3aa] hover:bg-[#f2efe9] dark:hover:bg-[#203027] rounded-xl font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden"
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-[#16201b] rounded-2xl max-w-lg w-full shadow-2xl border border-[#e8e5de] dark:border-[#26372d] overflow-hidden text-xs transition-colors">
        <div className="p-4 sm:p-5 border-b border-[#f0eee9] dark:border-[#223028] flex items-center justify-between bg-[#fbfbfa] dark:bg-[#1b2620]">
          <div>
            <h3 id="goal-modal-title" className="font-bold text-sm text-[#1a2420] dark:text-white">
              {initialGoal ? 'تعديل الهدف الاستراتيجي' : 'إضافة هدف قيمة استراتيجي'}
            </h3>
            {parentTitle && (
              <p className="text-[11px] text-[#174235] dark:text-emerald-400 font-semibold mt-0.5">
                المرجع الحالي: {parentTitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="text-[#85918a] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white text-sm p-1.5 rounded-lg hover:bg-[#f2efe8] dark:hover:bg-[#22332a] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">عنوان الهدف: *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: إطلاق النسخة الأولى من المنتج التجاري..."
              className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden"
              autoFocus
            />
          </div>

          {visions.length > 0 && (
            <div>
              <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">الرؤية التابع لها:</label>
              <CustomSelect
                value={visionId}
                onChange={(val) => setVisionId(val)}
                options={[
                  { value: '', label: 'بدون رؤية وسيطة (ربط بالمجال مباشرة)' },
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
              <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">الحالة:</label>
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
              <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">تاريخ الاستحقاق المستهدف:</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">تفاصيل ومؤشرات النجاح:</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="معايير إنجاز هذا الهدف ومؤشرات تحقيقه..."
              className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f0eee9] dark:border-[#223028]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#56625b] dark:text-[#a2b3aa] hover:bg-[#f2efe9] dark:hover:bg-[#203027] rounded-xl font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden"
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
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<AiTaskSuggestion[]>([]);
  const [selectedTaskIndices, setSelectedTaskIndices] = useState<number[]>([]);

  useEffect(() => {
    if (initialProject) {
      setTitle(initialProject.title);
      setDescription(initialProject.description);
      setStatus(initialProject.status);
      setStartDate(initialProject.start_date || '');
      setDueDate(initialProject.due_date || '');
      setGoalId(initialProject.goal_id);
      setSuggestedTasks([]);
      setSelectedTaskIndices([]);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setStatus('in_progress');
      setStartDate(today);
      setDueDate(today);
      setSuggestedTasks([]);
      setSelectedTaskIndices([]);
      if (goals.length > 0) setGoalId(goals[0].id);
    }
  }, [initialProject, isOpen, goals]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAiBreakdown = async () => {
    if (!title.trim()) return;
    setIsBreakingDown(true);
    try {
      const tasks = await generateAiTaskBreakdown(title.trim(), description.trim());
      setSuggestedTasks(tasks);
      setSelectedTaskIndices(tasks.map((_, i) => i));
    } catch (err) {
      console.warn('AI breakdown failed in modal:', err);
    } finally {
      setIsBreakingDown(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const chosenTasks = selectedTaskIndices.map((i) => suggestedTasks[i]);

    (onSave as any)({
      title: title.trim(),
      description: description.trim(),
      status,
      start_date: startDate,
      due_date: dueDate,
      goal_id: goalId,
      generatedTasks: chosenTasks,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-[#16201b] rounded-2xl max-w-lg w-full shadow-2xl border border-[#e8e5de] dark:border-[#26372d] overflow-hidden text-xs transition-colors">
        <div className="p-4 sm:p-5 border-b border-[#f0eee9] dark:border-[#223028] flex items-center justify-between bg-[#fbfbfa] dark:bg-[#1b2620]">
          <div>
            <h3 id="project-modal-title" className="font-bold text-sm text-[#1a2420] dark:text-white">
              {initialProject ? 'تعديل المشروع' : 'إضافة مشروع تنفيذي جديد'}
            </h3>
            {goalTitle && (
              <p className="text-[11px] text-[#174235] dark:text-emerald-400 font-semibold mt-0.5">
                الهدف التابع له: {goalTitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="text-[#85918a] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white text-sm p-1.5 rounded-lg hover:bg-[#f2efe8] dark:hover:bg-[#22332a] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">عنوان المشروع: *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تطوير الهوية البصرية، إعداد الميزانية..."
              className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden"
              autoFocus
            />
          </div>

          {goals.length > 0 && !goalTitle && (
            <div>
              <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">الهدف التابع له: *</label>
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
              <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">حالة المشروع:</label>
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
              <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">تاريخ البدء:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">تاريخ الاستحقاق:</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">وصف المشروع:</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف تفصيلي لمخرجات المشروع..."
              className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden"
            />
          </div>

          {/* AI Task Breakdown Section */}
          <div className="bg-[#f5f9f6] dark:bg-[#15231b] border border-[#cfe0d5] dark:border-[#243a2c] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#174235] dark:text-emerald-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>تفكيك المشروع لمهام ذكية (AI Task Breakdown)</span>
              </div>
              <button
                type="button"
                disabled={isBreakingDown || !title.trim()}
                onClick={handleAiBreakdown}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isBreakingDown || !title.trim()
                    ? 'opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-500'
                    : 'bg-[#174235] dark:bg-emerald-600 hover:bg-[#12362b] text-white shadow-2xs'
                }`}
              >
                {isBreakingDown ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>جاري التفكيك...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>تفكيك ذكي بالـ AI</span>
                  </>
                )}
              </button>
            </div>

            {suggestedTasks.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] text-[#55695e] dark:text-[#9bb0a3]">
                  حدد المهام المقترحة لإنشائها تلقائياً داخل هذا المشروع:
                </p>
                {suggestedTasks.map((st, idx) => {
                  const isChecked = selectedTaskIndices.includes(idx);
                  return (
                    <label
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-white dark:bg-[#18271f] border-[#b0d4bf] dark:border-[#284f37]'
                          : 'bg-white/60 dark:bg-[#121c17] border-transparent opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedTaskIndices((prev) =>
                              prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                            );
                          }}
                          className="w-3.5 h-3.5 text-[#174235] rounded accent-[#174235]"
                        />
                        <span className="font-semibold text-[#1a2420] dark:text-white">
                          {st.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#718278] dark:text-[#9bb0a3]">
                        <span>{st.estimated_hours || 1} س</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          {st.priority || 'متوسط'}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f0eee9] dark:border-[#223028]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#56625b] dark:text-[#a2b3aa] hover:bg-[#f2efe9] dark:hover:bg-[#203027] rounded-xl font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden"
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-[#16201b] rounded-2xl max-w-lg w-full shadow-2xl border border-[#e8e5de] dark:border-[#26372d] overflow-hidden text-xs transition-colors">
        <div className="p-4 sm:p-5 border-b border-[#f0eee9] dark:border-[#223028] flex items-center justify-between bg-[#fbfbfa] dark:bg-[#1b2620]">
          <div>
            <h3 id="task-modal-title" className="font-bold text-sm text-[#1a2420] dark:text-white">
              {initialTask ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
            </h3>
            {projectTitle && (
              <p className="text-[11px] text-[#174235] dark:text-emerald-400 font-semibold mt-0.5">
                المشروع التابع له: {projectTitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="text-[#85918a] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white text-sm p-1.5 rounded-lg hover:bg-[#f2efe8] dark:hover:bg-[#22332a] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">عنوان المهمة: *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="اكتب اسم المهمة الواضحة والتنفيذية..."
              className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden"
              autoFocus
            />
          </div>

          {projects.length > 0 && !projectTitle && (
            <div>
              <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">المشروع التابع له: *</label>
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
              <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">الحالة:</label>
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
              <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">الأولوية:</label>
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
              <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">تاريخ الاستحقاق:</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#3a453f] dark:text-[#c4d6cb] block mb-1">ملاحظات المهمة:</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أي تفاصيل أو خطوات لازمة للإنجاز..."
              className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 focus-visible:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f0eee9] dark:border-[#223028]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#56625b] dark:text-[#a2b3aa] hover:bg-[#f2efe9] dark:hover:bg-[#203027] rounded-xl font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden"
            >
              حفظ المهمة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
