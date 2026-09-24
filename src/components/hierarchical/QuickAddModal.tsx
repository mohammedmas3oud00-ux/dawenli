import React, { useState, useEffect } from 'react';
import { CheckSquare, Folder, Target, Eye, Layers, Zap, X, Inbox } from 'lucide-react';
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
  const [pillarGroup, setPillarGroup] = useState('شخصي');
  const [pillarPriority, setPillarPriority] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
        status: 'todo',
        due_date: taskDueDate || null,
        description: '',
      });
    } else if (activeType === 'project') {
      if (!projectTitle.trim() || !projectGoalId) return;
      onAddProject({
        title: projectTitle.trim(),
        goal_id: projectGoalId,
        status: 'in_progress',
        due_date: projectDueDate || new Date().toISOString().split('T')[0],
        start_date: new Date().toISOString().split('T')[0],
        description: '',
      });
    } else if (activeType === 'goal') {
      if (!goalTitle.trim()) return;
      const targetVision = visions.find((v) => v.id === goalVisionId);
      const pillarId = targetVision?.pillar_id || goalPillarId || pillars[0]?.id;
      if (!pillarId) return;

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
        pillar_group: pillarGroup.trim() || 'شخصي',
        priority: Number(pillarPriority) || 1,
        show_on_home: true,
        status: 'active',
        description: '',
      });
    }

    handleReset();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-title"
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-[#16201b] rounded-2xl max-w-lg w-full shadow-2xl border border-[#e8e4db] dark:border-[#26372d] overflow-hidden text-xs transition-colors">
        
        {/* Header */}
        <div className="p-4 bg-white dark:bg-[#1b2620] border-b border-[#f0eee9] dark:border-[#223028] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 flex items-center justify-center" aria-hidden="true">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 id="quick-add-title" className="font-bold text-sm text-[#1a2420] dark:text-white">إضافة سريعة موحدة</h3>
              <p className="text-[11px] text-[#6d7972] dark:text-[#9bb0a3]">أضف أي عنصر في ثوانٍ مع الربط التلقائي</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-1.5 rounded-lg text-[#85918a] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white hover:bg-[#f5f4ef] dark:hover:bg-[#22332a] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Entity Type Selection Tabs */}
        <div className="flex items-center gap-1 p-2 bg-[#fbfbfa] dark:bg-[#121c17] border-b border-[#f0eee9] dark:border-[#223028] overflow-x-auto text-[11px] font-medium scrollbar-none">
          {[
            { id: 'inbox', label: 'صندوق الأفكار', icon: <Inbox className="w-3.5 h-3.5" /> },
            { id: 'task', label: 'مهمة', icon: <CheckSquare className="w-3.5 h-3.5" /> },
            { id: 'project', label: 'مشروع', icon: <Folder className="w-3.5 h-3.5" /> },
            { id: 'goal', label: 'هدف', icon: <Target className="w-3.5 h-3.5" /> },
            { id: 'vision', label: 'رؤية', icon: <Eye className="w-3.5 h-3.5" /> },
            { id: 'pillar', label: 'مجال حياة', icon: <Layers className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveType(tab.id as QuickAddType)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden ${
                activeType === tab.id
                  ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'text-[#56625b] dark:text-[#9bb0a3] hover:bg-[#f0ede6] dark:hover:bg-[#1a2620]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* INBOX CAPTURE FORM */}
          {activeType === 'inbox' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">ما الذي يدور في ذهنك الآن؟ (فكرة / تدوينة / مهمة) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فكرة لمشروع جديد، رابط مقال ملهم، ملاحظة..."
                  value={inboxTitle}
                  onChange={(e) => setInboxTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden font-semibold"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">نوع العنصر</label>
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
                  <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">رابط إن وُجد (اختياري)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={inboxUrl}
                    onChange={(e) => setInboxUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#57645d] dark:text-[#9bb0a3] mb-1">ملاحظات إضافية (اختياري)</label>
                <textarea
                  rows={2}
                  placeholder="أي تفاصيل ترغب بتذكرها لاحقاً..."
                  value={inboxContent}
                  onChange={(e) => setInboxContent(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden"
                />
              </div>
            </div>
          )}
          
          {/* TASK FORM */}
          {activeType === 'task' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">عنوان المهمة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مراجعة العرض التقديمي للعميل"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">المشروع التابع له *</label>
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
                  <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">الأولوية</label>
                  <CustomSelect
                    value={taskPriority}
                    onChange={(val) => setTaskPriority(val as any)}
                    options={[
                      { value: 'high', label: '🔴 عالية' },
                      { value: 'medium', label: '🟡 متوسطة' },
                      { value: 'low', label: '🟢 منخفضة' },
                    ]}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                    dropdownClassName="w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PROJECT FORM */}
          {activeType === 'project' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">اسم المشروع *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: إطلاق المتجر الإلكتروني، ترقية السيرفر..."
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">الهدف التابع له *</label>
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
                <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">تاريخ التسليم المستهدف</label>
                <input
                  type="date"
                  value={projectDueDate}
                  onChange={(e) => setProjectDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden font-mono"
                />
              </div>
            </div>
          )}

          {/* GOAL FORM */}
          {activeType === 'goal' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">عنوان الهدف الاستراتيجي *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: زيادة العائدات السنوية بنسبة 25%..."
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden"
                  autoFocus
                />
              </div>

              {visions.length > 0 && (
                <div>
                  <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">الرؤية التابع لها</label>
                  <CustomSelect
                    value={goalVisionId}
                    onChange={(val) => setGoalVisionId(val)}
                    options={[
                      { value: '', label: 'بدون رؤية وسيطة' },
                      ...visions.map((v) => ({ value: v.id, label: v.title })),
                    ]}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                    dropdownClassName="w-full"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">المجال الحياتي (الركيزة) *</label>
                  <CustomSelect
                    value={goalPillarId}
                    onChange={(val) => setGoalPillarId(val)}
                    options={pillars.map((p) => ({ value: p.id, label: p.title }))}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                    dropdownClassName="w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">الموعد المستهدف</label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* VISION FORM */}
          {activeType === 'vision' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">عنوان الرؤية المستقبلية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الريادة المعرفية والتمكن التقني"
                  value={visionTitle}
                  onChange={(e) => setVisionTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">المجال التابع له *</label>
                <CustomSelect
                  value={visionPillarId}
                  onChange={(val) => setVisionPillarId(val)}
                  options={pillars.map((p) => ({ value: p.id, label: p.title }))}
                  className="w-full"
                  buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                  dropdownClassName="w-full"
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">الأفق الزمني</label>
                <input
                  type="text"
                  placeholder="مثال: 3-5 سنوات"
                  value={visionTimeframe}
                  onChange={(e) => setVisionTimeframe(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#57645d] dark:text-[#9bb0a3] mb-1">بيان الرؤية</label>
                <textarea
                  rows={2}
                  placeholder="وصف الأفق المستقبلي المنشود..."
                  value={visionStatement}
                  onChange={(e) => setVisionStatement(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden"
                />
              </div>
            </div>
          )}

          {/* PILLAR FORM */}
          {activeType === 'pillar' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">اسم مجال الحياة (الركيزة) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الصحة واللياقة، التطوير المهني، الأسرة..."
                  value={pillarTitle}
                  onChange={(e) => setPillarTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">التصنيف العام</label>
                <input
                  type="text"
                  placeholder="مثال: شخصي، مهني، صحي، مالي..."
                  value={pillarGroup}
                  onChange={(e) => setPillarGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">الغاية والرسالة *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="البيان التوجيهي والمقصد الأسمى لهذا المجال..."
                  value={pillarPurpose}
                  onChange={(e) => setPillarPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-[#3d4842] dark:text-[#c4d6cb] mb-1">ترتيب الأولوية</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={pillarPriority}
                  onChange={(e) => setPillarPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#283d31] rounded-xl focus:border-[#174235] dark:focus:border-emerald-500 bg-[#faf8f5] dark:bg-[#121c17] text-[#1a2420] dark:text-white outline-hidden font-mono"
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#f0eee9] dark:border-[#223028]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#f4f2ec] dark:bg-[#203027] hover:bg-[#eae6dd] dark:hover:bg-[#283d30] text-[#4a554f] dark:text-[#c4d6cb] rounded-xl font-bold cursor-pointer transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden"
            >
              حفظ وإضافة الآن
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
