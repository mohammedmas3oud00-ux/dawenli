import React, { useState } from 'react';
import { CheckSquare, Folder, Target, Eye, Layers, Zap, X, Inbox, Mic, Sparkles } from 'lucide-react';
import { Pillar, Vision, ValueGoal, Project, Task, InboxItem } from '../../types/hierarchical';
import { CustomSelect } from './CustomSelect';

type QuickAddType = 'inbox' | 'task' | 'project' | 'goal' | 'vision' | 'pillar';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  pillars: Pillar[];
  visions: Vision[];
  goals: ValueGoal[];
  projects: Project[];
  onAddTask: (task: Partial<Task>) => void;
  onAddProject: (project: Partial<Project>) => void;
  onAddGoal: (goal: Partial<ValueGoal>) => void;
  onAddVision: (vision: Partial<Vision>) => void;
  onAddPillar: (pillar: Partial<Pillar>) => void;
  onAddInboxItem?: (item: Partial<InboxItem>) => void;
  onOpenVoiceAi?: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  pillars,
  visions,
  goals,
  projects,
  onAddTask,
  onAddProject,
  onAddGoal,
  onAddVision,
  onAddPillar,
  onAddInboxItem,
  onOpenVoiceAi,
}) => {
  const [activeType, setActiveType] = useState<QuickAddType>('inbox');

  // Inbox capture state
  const [inboxTitle, setInboxTitle] = useState('');
  const [inboxContent, setInboxContent] = useState('');
  const [inboxType, setInboxType] = useState<InboxItem['source_type']>('idea');
  const [inboxUrl, setInboxUrl] = useState('');

  // Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskProjectId, setTaskProjectId] = useState(projects[0]?.id || '');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Project state
  const [projectTitle, setProjectTitle] = useState('');
  const [projectGoalId, setProjectGoalId] = useState(goals[0]?.id || '');
  const [projectDueDate, setProjectDueDate] = useState('');

  // Goal state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalVisionId, setGoalVisionId] = useState(visions[0]?.id || '');
  const [goalPillarId, setGoalPillarId] = useState(pillars[0]?.id || '');
  const [goalTargetDate, setGoalTargetDate] = useState('');

  // Vision state
  const [visionTitle, setVisionTitle] = useState('');
  const [visionPillarId, setVisionPillarId] = useState(pillars[0]?.id || '');
  const [visionStatement, setVisionStatement] = useState('');
  const [visionTimeframe, setVisionTimeframe] = useState('3-5 سنوات');

  // Pillar state
  const [pillarTitle, setPillarTitle] = useState('');
  const [pillarPurpose, setPillarPurpose] = useState('');
  const [pillarGroup, setPillarGroup] = useState('Growth');
  const [pillarPriority, setPillarPriority] = useState(1);

  if (!isOpen) return null;

  const handleReset = () => {
    setInboxTitle('');
    setInboxContent('');
    setInboxUrl('');
    setTaskTitle('');
    setProjectTitle('');
    setGoalTitle('');
    setVisionTitle('');
    setVisionStatement('');
    setPillarTitle('');
    setPillarPurpose('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeType === 'inbox') {
      if (!inboxTitle.trim()) return;
      if (onAddInboxItem) {
        onAddInboxItem({
          title: inboxTitle.trim(),
          content: inboxContent.trim(),
          source_type: inboxType,
          url: inboxUrl.trim() || undefined,
          status: 'inbox',
        });
      }
    } else if (activeType === 'task') {
      if (!taskTitle.trim() || !taskProjectId) return;
      onAddTask({
        title: taskTitle.trim(),
        project_id: taskProjectId,
        priority: taskPriority,
        due_date: taskDueDate || null,
        status: 'todo',
        description: '',
        completed_at: null,
      });
    } else if (activeType === 'project') {
      if (!projectTitle.trim() || !projectGoalId) return;
      const today = new Date().toISOString().split('T')[0];
      onAddProject({
        title: projectTitle.trim(),
        goal_id: projectGoalId,
        status: 'in_progress',
        start_date: today,
        due_date: projectDueDate || today,
        description: '',
      });
    } else if (activeType === 'goal') {
      if (!goalTitle.trim()) return;
      const targetVision = visions.find((v) => v.id === goalVisionId);
      const pillarId = targetVision ? targetVision.pillar_id : (goalPillarId || pillars[0]?.id || '');
      onAddGoal({
        title: goalTitle.trim(),
        pillar_id: pillarId,
        vision_id: goalVisionId || undefined,
        status: 'not_started',
        target_date: goalTargetDate || null,
        description: '',
      });
    } else if (activeType === 'vision') {
      if (!visionTitle.trim() || !visionPillarId) return;
      onAddVision({
        title: visionTitle.trim(),
        pillar_id: visionPillarId,
        description: visionStatement.trim(),
        timeframe: visionTimeframe.trim(),
        status: 'active',
      });
    } else if (activeType === 'pillar') {
      if (!pillarTitle.trim()) return;
      onAddPillar({
        title: pillarTitle.trim(),
        purpose: pillarPurpose.trim(),
        pillar_group: pillarGroup.trim() || 'Growth',
        priority: Number(pillarPriority) || 1,
        show_on_home: true,
        status: 'active',
        description: '',
      });
    }

    handleReset();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-xl border border-[#e8e4db] dark:border-slate-800 overflow-hidden text-xs animate-in fade-in">
        
        {/* Header matching Dawenli */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-[#f0eee9] dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ebf4f0] dark:bg-emerald-950/70 text-[#174235] dark:text-emerald-300 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#1a2420] dark:text-slate-100">إضافة سريعة موحدة</h3>
              <p className="text-[11px] text-[#6d7972] dark:text-slate-400">أضف أي عنصر هرمي في ثوانٍ مع ربطه التلقائي</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenVoiceAi && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVoiceAi();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="تحدث بصوتك والتحليل والتفكيك بالذكاء الاصطناعي"
              >
                <Mic className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>مساعد صوتي AI</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#85918a] hover:text-[#1a2420] dark:hover:text-slate-100 hover:bg-[#f5f4ef] dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Entity Type Selection Tabs */}
        <div className="flex items-center gap-1 p-2 bg-[#fbfbfa] dark:bg-slate-800/80 border-b border-[#f0eee9] dark:border-slate-800 overflow-x-auto text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setActiveType('inbox')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeType === 'inbox'
                ? 'bg-[#174235] text-white shadow-2xs font-semibold'
                : 'text-[#56625b] dark:text-slate-300 hover:bg-[#f0ede6] dark:hover:bg-slate-700'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>صندوق الوارد</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('task')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeType === 'task'
                ? 'bg-[#174235] text-white shadow-2xs font-semibold'
                : 'text-[#56625b] dark:text-slate-300 hover:bg-[#f0ede6] dark:hover:bg-slate-700'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>مهمة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('project')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeType === 'project'
                ? 'bg-[#174235] text-white shadow-2xs font-semibold'
                : 'text-[#56625b] dark:text-slate-300 hover:bg-[#f0ede6] dark:hover:bg-slate-700'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>مشروع</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('goal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeType === 'goal'
                ? 'bg-[#174235] text-white shadow-2xs font-semibold'
                : 'text-[#56625b] dark:text-slate-300 hover:bg-[#f0ede6] dark:hover:bg-slate-700'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>هدف قيمة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('vision')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeType === 'vision'
                ? 'bg-[#174235] text-white shadow-2xs font-semibold'
                : 'text-[#56625b] dark:text-slate-300 hover:bg-[#f0ede6] dark:hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>رؤية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('pillar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeType === 'pillar'
                ? 'bg-[#174235] text-white shadow-2xs font-semibold'
                : 'text-[#56625b] dark:text-slate-300 hover:bg-[#f0ede6] dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ركيزة</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* INBOX CAPTURE FORM */}
          {activeType === 'inbox' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">ما الذي يدور في ذهنك الآن؟ (فكرة / مهمة / مرجع) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فكرة إضافة مؤشر إنتاجية، تجديد الاشتراك، مقال ملهم..."
                  value={inboxTitle}
                  onChange={(e) => setInboxTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden font-semibold"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">تصنيف الإيداع السريع</label>
                  <CustomSelect
                    value={inboxType}
                    onChange={(val) => setInboxType(val as any)}
                    options={[
                      { value: 'idea', label: '💡 فكرة ملهمة' },
                      { value: 'task_seed', label: '⚡ مهمة سريعة' },
                      { value: 'reference', label: '📄 مرجع / معلومة' },
                      { value: 'question', label: '❓ سؤال للبحث' },
                      { value: 'link', label: '🔗 رابط خارجي' },
                    ]}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                    dropdownClassName="w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">رابط إن وُجد (اختياري)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={inboxUrl}
                    onChange={(e) => setInboxUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#57645d] dark:text-slate-300 mb-1">سياق أو ملاحظات إضافية (اختياري)</label>
                <textarea
                  rows={2}
                  placeholder="أي تفاصيل ترغب بتذكرها لاحقاً عند فرز الصندوق..."
                  value={inboxContent}
                  onChange={(e) => setInboxContent(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden"
                />
              </div>
            </div>
          )}
          
          {/* TASK FORM */}
          {activeType === 'task' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">عنوان المهمة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: قراءة الفصل الأول من كتاب العادات الذرية"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] rounded-xl focus:border-[#174235] focus:ring-1 focus:ring-[#174235] bg-[#faf8f5] text-[#1a2420] outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">المشروع التابع له *</label>
                <CustomSelect
                  value={taskProjectId}
                  onChange={(val) => setTaskProjectId(val)}
                  options={projects.map((proj) => ({ value: proj.id, label: proj.title }))}
                  className="w-full"
                  buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                  dropdownClassName="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">الأولوية</label>
                  <CustomSelect
                    value={taskPriority}
                    onChange={(val) => setTaskPriority(val as any)}
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
                  <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PROJECT FORM */}
          {activeType === 'project' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">اسم المشروع *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: إكمال مجالس كتاب العادات الذرية"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">الهدف الاستراتيجي التابع له *</label>
                <CustomSelect
                  value={projectGoalId}
                  onChange={(val) => setProjectGoalId(val)}
                  options={goals.map((g) => ({ value: g.id, label: g.title }))}
                  className="w-full"
                  buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                  dropdownClassName="w-full"
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">تاريخ الانتهاء المتوقع</label>
                <input
                  type="date"
                  value={projectDueDate}
                  onChange={(e) => setProjectDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden font-mono"
                />
              </div>
            </div>
          )}

          {/* GOAL FORM */}
          {activeType === 'goal' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">عنوان هدف القيمة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الوصول إلى 100,000 جنيه صافي ربح شهري"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">الرؤية التابع لها</label>
                <CustomSelect
                  value={goalVisionId}
                  onChange={(val) => setGoalVisionId(val)}
                  options={[
                    { value: '', label: 'بدون رؤية وسيطة (ربط بالركيزة مباشرة)' },
                    ...visions.map((v) => ({ value: v.id, label: v.title })),
                  ]}
                  className="w-full"
                  buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                  dropdownClassName="w-full"
                />
              </div>

              {!goalVisionId && (
                <div>
                  <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">الركيزة التابع لها *</label>
                  <CustomSelect
                    value={goalPillarId}
                    onChange={(val) => setGoalPillarId(val)}
                    options={pillars.map((p) => ({ value: p.id, label: `${p.title} (${p.pillar_group})` }))}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                    dropdownClassName="w-full"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">تاريخ الاستحقاق المستهدف</label>
                <input
                  type="date"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden font-mono"
                />
              </div>
            </div>
          )}

          {/* VISION FORM */}
          {activeType === 'vision' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">عنوان الرؤية المستقبلية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: بناء استقلال مالي راسخ ومشاريع رقمية رابحة"
                  value={visionTitle}
                  onChange={(e) => setVisionTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">الركيزة التابعة لها *</label>
                <CustomSelect
                  value={visionPillarId}
                  onChange={(val) => setVisionPillarId(val)}
                  options={pillars.map((p) => ({ value: p.id, label: `${p.title} (${p.pillar_group})` }))}
                  className="w-full"
                  buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                  dropdownClassName="w-full"
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">الأفق الزمني للرؤية</label>
                <input
                  type="text"
                  value={visionTimeframe}
                  onChange={(e) => setVisionTimeframe(e.target.value)}
                  placeholder="مثال: 3-5 سنوات أو 2026-2030"
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">بيان الرؤية والأفق المنشود</label>
                <textarea
                  rows={2}
                  value={visionStatement}
                  onChange={(e) => setVisionStatement(e.target.value)}
                  placeholder="صِف الصورة التي تطمح للوصول إليها..."
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* PILLAR FORM */}
          {activeType === 'pillar' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">اسم الركيزة الأساسية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: العلاقة مع الله، بناء الذات، الصحة"
                  value={pillarTitle}
                  onChange={(e) => setPillarTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">المجموعة التصنيفية</label>
                <input
                  type="text"
                  placeholder="مثال: Growth, Vitality, Impact, Wealth"
                  value={pillarGroup}
                  onChange={(e) => setPillarGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">الغاية الكبرى *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="البيان التوجيهي والمقصد الأسمى لهذه الركيزة..."
                  value={pillarPurpose}
                  onChange={(e) => setPillarPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-slate-300 mb-1">ترتيب الأولوية</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={pillarPriority}
                  onChange={(e) => setPillarPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden font-mono"
                />
              </div>
            </div>
          )}

          {/* Form Actions matching Dawenli */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#f0eee9] dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#f4f2ec] dark:bg-slate-800 hover:bg-[#eae6dd] dark:hover:bg-slate-700 text-[#4a554f] dark:text-slate-300 rounded-xl font-bold cursor-pointer transition-colors border border-transparent dark:border-slate-700"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12352a] dark:hover:bg-emerald-800 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer"
            >
              حفظ وإضافة الآن
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
