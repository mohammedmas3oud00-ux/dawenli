import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Plus, 
  Play, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Folder, 
  X, 
  Edit3,
  Check,
  LayoutTemplate
} from 'lucide-react';
import { TimeBlock, TimeBlockCategory, Task, Project, Pillar } from '../../types/hierarchical';
import { CustomSelect } from './CustomSelect';

interface TimeBlockingViewProps {
  tasks: Task[];
  projects: Project[];
  pillars: Pillar[];
  timeBlocks: TimeBlock[];
  onSaveTimeBlock: (block: TimeBlock) => void;
  onDeleteTimeBlock: (blockId: string) => void;
  onToggleTimeBlockStatus: (blockId: string) => void;
  onStartFocusOnTask?: (task: Task) => void;
}

const CATEGORY_CONFIG: Record<TimeBlockCategory, { label: string; bg: string; border: string; text: string; icon: string }> = {
  deep_work: {
    label: 'تركيز عميق (Deep Work)',
    bg: 'bg-[#174235]/10 dark:bg-emerald-950/20',
    border: 'border-[#174235]/30 dark:border-emerald-800/40',
    text: 'text-[#174235] dark:text-emerald-400',
    icon: '🧠',
  },
  shallow_work: {
    label: 'عمل إجرائي ومتابعات',
    bg: 'bg-sky-50 dark:bg-sky-950/20',
    border: 'border-sky-200 dark:border-sky-800/40',
    text: 'text-sky-800 dark:text-sky-400',
    icon: '⚡',
  },
  meeting: {
    label: 'اجتماع أو تواصل',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-200 dark:border-purple-800/40',
    text: 'text-purple-800 dark:text-purple-400',
    icon: '🤝',
  },
  health_habit: {
    label: 'صحة وعادات ورياضة',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800/40',
    text: 'text-emerald-800 dark:text-emerald-400',
    icon: '🏃',
  },
  learning: {
    label: 'قراءة وتعلم وخزائن',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800/40',
    text: 'text-amber-800 dark:text-amber-400',
    icon: '📚',
  },
  rest: {
    label: 'استراحة وتجديد طاقة',
    bg: 'bg-stone-100 dark:bg-stone-900/40',
    border: 'border-stone-200 dark:border-stone-800/40',
    text: 'text-stone-700 dark:text-stone-300',
    icon: '☕',
  },
  personal: {
    label: 'شأن شخصي وعائلي',
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    border: 'border-rose-200 dark:border-rose-800/40',
    text: 'text-rose-800 dark:text-rose-400',
    icon: '🏡',
  },
};

export const TimeBlockingView: React.FC<TimeBlockingViewProps> = ({
  tasks,
  projects,
  timeBlocks,
  onSaveTimeBlock,
  onDeleteTimeBlock,
  onToggleTimeBlockStatus,
  onStartFocusOnTask,
}) => {
  // Selected Date state (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  // Live Current Time (HH:MM)
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);

  // Form fields
  const [formStartTime, setFormStartTime] = useState<string>('09:00');
  const [formEndTime, setFormEndTime] = useState<string>('10:00');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<TimeBlockCategory>('deep_work');
  const [formTaskId, setFormTaskId] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Unscheduled tasks filter
  const [taskSearch, setTaskSearch] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Update live current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter blocks for selected date & sort chronologically
  const dayBlocks = useMemo(() => {
    return timeBlocks
      .filter((b) => b.date === selectedDate)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [timeBlocks, selectedDate]);

  // Active blocks right now
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const activeBlockNow = isToday
    ? dayBlocks.find((b) => b.start_time <= currentTimeStr && b.end_time > currentTimeStr)
    : null;

  // Unscheduled active tasks for the sidebar drawer
  const scheduledTaskIds = new Set(timeBlocks.map((b) => b.task_id).filter(Boolean));
  const unscheduledTasks = tasks
    .filter((t) => t.status !== 'done')
    .filter((t) => !scheduledTaskIds.has(t.id))
    .filter((t) => !taskSearch || t.title.toLowerCase().includes(taskSearch.toLowerCase()));

  // Open modal for new block
  const handleOpenAddModal = (initialStart = '09:00', task?: Task) => {
    setEditingBlock(null);
    setFormStartTime(initialStart);
    const [h, m] = initialStart.split(':').map(Number);
    const endH = (h + 1).toString().padStart(2, '0');
    setFormEndTime(`${endH}:${m.toString().padStart(2, '0')}`);
    setFormTitle(task ? task.title : '');
    setFormTaskId(task ? task.id : '');
    setFormCategory(task?.priority === 'high' ? 'deep_work' : 'shallow_work');
    setFormNotes(task?.description || '');
    setIsModalOpen(true);
  };

  // Open modal for editing existing block
  const handleOpenEditModal = (block: TimeBlock) => {
    setEditingBlock(block);
    setFormStartTime(block.start_time);
    setFormEndTime(block.end_time);
    setFormTitle(block.title);
    setFormCategory(block.category);
    setFormTaskId(block.task_id || '');
    setFormNotes(block.notes || '');
    setIsModalOpen(true);
  };

  // Save form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const matchedTask = tasks.find((t) => t.id === formTaskId);
    const matchedProject = matchedTask ? projects.find((p) => p.id === matchedTask.project_id) : undefined;

    const blockToSave: TimeBlock = {
      id: editingBlock ? editingBlock.id : `tb-${Date.now()}`,
      date: selectedDate,
      start_time: formStartTime,
      end_time: formEndTime,
      title: formTitle.trim(),
      category: formCategory,
      task_id: formTaskId || null,
      project_id: matchedProject ? matchedProject.id : null,
      pillar_id: matchedProject ? (matchedProject as any).pillar_id : null,
      is_completed: editingBlock ? editingBlock.is_completed : false,
      notes: formNotes.trim() || undefined,
      created_at: editingBlock ? editingBlock.created_at : new Date().toISOString(),
    };

    onSaveTimeBlock(blockToSave);
    setIsModalOpen(false);
  };

  // Date navigation helpers
  const changeDateBy = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Calculate day total metrics
  const totalScheduledMinutes = dayBlocks.reduce((acc, b) => {
    const [sh, sm] = b.start_time.split(':').map(Number);
    const [eh, em] = b.end_time.split(':').map(Number);
    return acc + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  }, 0);
  const totalScheduledHours = (totalScheduledMinutes / 60).toFixed(1);

  const deepWorkMinutes = dayBlocks
    .filter((b) => b.category === 'deep_work')
    .reduce((acc, b) => {
      const [sh, sm] = b.start_time.split(':').map(Number);
      const [eh, em] = b.end_time.split(':').map(Number);
      return acc + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
    }, 0);
  const deepWorkHours = (deepWorkMinutes / 60).toFixed(1);

  // Apply quick productive day template
  const handleApplyTemplate = () => {
    const templateBlocks: Omit<TimeBlock, 'id' | 'created_at'>[] = [
      {
        date: selectedDate,
        start_time: '08:30',
        end_time: '10:30',
        title: 'جلسة تركيز عميق 1: العمل على المخرج الاستراتيجي',
        category: 'deep_work',
        is_completed: false,
      },
      {
        date: selectedDate,
        start_time: '10:45',
        end_time: '11:45',
        title: 'معالجة صندوق الوارد، التنسيقات والمهام الإجرائية',
        category: 'shallow_work',
        is_completed: false,
      },
      {
        date: selectedDate,
        start_time: '12:00',
        end_time: '13:30',
        title: 'جلسة تركيز عميق 2: التنفيذ والإنتاج الفعلي',
        category: 'deep_work',
        is_completed: false,
      },
      {
        date: selectedDate,
        start_time: '14:00',
        end_time: '14:45',
        title: 'استراحة وتجديد نشاط',
        category: 'rest',
        is_completed: false,
      },
      {
        date: selectedDate,
        start_time: '15:00',
        end_time: '16:00',
        title: 'قراءة في خزائن المعرفة والتوثيق',
        category: 'learning',
        is_completed: false,
      },
    ];

    templateBlocks.forEach((tb, i) => {
      onSaveTimeBlock({
        ...tb,
        id: `tb-tpl-${Date.now()}-${i}`,
        created_at: new Date().toISOString(),
      });
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header with Date Navigator & Stats */}
      <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-5 sm:p-6 shadow-2xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <h1 className="text-lg sm:text-xl font-bold text-[#1a2420] dark:text-white">
                حجب الوقت اليومي (Time Blocking)
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#2d4034] font-mono tabular-nums">
                {dayBlocks.length} كتل مجدولة
              </span>
            </div>
            <p className="text-xs text-[#636e67] dark:text-[#9bb0a3]">
              خصص لكل ساعة من يومك نية واضحة ومسبقة لحماية تركيزك العميق ومنع التسويف.
            </p>
          </div>

          {/* Date Selector and Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            <div className="flex items-center bg-[#faf8f4] dark:bg-[#192620] border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => changeDateBy(-1)}
                className="p-1.5 hover:bg-[#ede9df] dark:hover:bg-[#203026] rounded-lg text-[#55645b] dark:text-[#8ea095] transition-colors cursor-pointer"
                title="اليوم السابق"
                aria-label="اليوم السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isToday
                    ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-2xs'
                    : 'text-[#55645b] dark:text-[#8ea095] hover:bg-[#ede9df] dark:hover:bg-[#203026]'
                }`}
              >
                اليوم
              </button>

              <button
                type="button"
                onClick={() => changeDateBy(1)}
                className="p-1.5 hover:bg-[#ede9df] dark:hover:bg-[#203026] rounded-lg text-[#55645b] dark:text-[#8ea095] transition-colors cursor-pointer"
                title="اليوم التالي"
                aria-label="اليوم التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Date Input */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-[#faf8f4] dark:bg-[#192620] border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs font-bold text-[#1a2420] dark:text-white outline-hidden cursor-pointer"
            />

            {/* Add Block Button */}
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12362b] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>كتلة زمنية جديدة</span>
            </button>

            {/* Preset Template button */}
            <button
              type="button"
              onClick={handleApplyTemplate}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#f4f2ed] dark:bg-[#192620] hover:bg-[#eae6dd] dark:hover:bg-[#203026] text-[#4d5c52] dark:text-[#b4c7bd] border border-[#dcd7cc] dark:border-[#2d4034] rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="تطبيق قالب يوم قياسي جاهز"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
              <span className="hidden sm:inline">قالب يوم قياسي</span>
            </button>

          </div>

        </div>

        {/* Live Active Block Banner if running right now */}
        {activeBlockNow && (
          <div className="mt-4 p-3.5 bg-[#174235] dark:bg-emerald-900 text-white rounded-xl shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
              </span>
              <div>
                <span className="text-[10px] text-emerald-200 font-bold block">
                  الكتلة الزمنية الحالية النشطة الآن ({activeBlockNow.start_time} - {activeBlockNow.end_time})
                </span>
                <span className="text-sm font-bold">{activeBlockNow.title}</span>
              </div>
            </div>

            {activeBlockNow.task_id && onStartFocusOnTask && (
              <button
                type="button"
                onClick={() => {
                  const task = tasks.find((t) => t.id === activeBlockNow.task_id);
                  if (task) onStartFocusOnTask(task);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#174235] hover:bg-emerald-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-[#174235]" />
                <span>بدء مؤقت التركيز (Focus)</span>
              </button>
            )}
          </div>
        )}

        {/* Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#f0eee9] dark:border-[#223028] text-xs">
          <div>
            <span className="text-[#7d8b82] dark:text-[#8ea095] text-[11px] block">إجمالي الساعات المجدولة:</span>
            <span className="font-bold text-[#1a2420] dark:text-white text-sm font-mono tabular-nums">{totalScheduledHours} ساعة</span>
          </div>
          <div>
            <span className="text-[#7d8b82] dark:text-[#8ea095] text-[11px] block">ساعات التركيز العميق:</span>
            <span className="font-bold text-[#174235] dark:text-emerald-400 text-sm font-mono tabular-nums">{deepWorkHours} ساعة</span>
          </div>
          <div>
            <span className="text-[#7d8b82] dark:text-[#8ea095] text-[11px] block">الكتل المنجزة:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm font-mono tabular-nums">
              {dayBlocks.filter((b) => b.is_completed).length} من {dayBlocks.length}
            </span>
          </div>
          <div>
            <span className="text-[#7d8b82] dark:text-[#8ea095] text-[11px] block">نسبة الالتزام بالجدول:</span>
            <span className="font-bold text-[#1a2420] dark:text-white text-sm font-mono tabular-nums">
              {dayBlocks.length > 0 ? Math.round((dayBlocks.filter((b) => b.is_completed).length / dayBlocks.length) * 100) : 0}%
            </span>
          </div>
        </div>

      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Timeline Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-5 shadow-2xs transition-colors">
            <h2 className="text-sm font-bold text-[#1a2420] dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
              <span>الجدول الزمني ليوم {new Date(selectedDate).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </h2>

            {dayBlocks.length > 0 ? (
              <div className="space-y-3 relative">
                {dayBlocks.map((block) => {
                  const cfg = CATEGORY_CONFIG[block.category] || CATEGORY_CONFIG.deep_work;
                  const isCurrent = isToday && block.start_time <= currentTimeStr && block.end_time > currentTimeStr;
                  const linkedTask = block.task_id ? tasks.find((t) => t.id === block.task_id) : undefined;
                  const linkedProject = block.project_id ? projects.find((p) => p.id === block.project_id) : undefined;

                  return (
                    <div
                      key={block.id}
                      className={`relative border rounded-2xl p-4 transition-all ${cfg.bg} ${cfg.border} ${
                        isCurrent ? 'ring-2 ring-[#174235] dark:ring-emerald-500 shadow-md' : 'shadow-2xs'
                      } ${block.is_completed ? 'opacity-65' : 'opacity-100'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        
                        {/* Time & Title */}
                        <div className="flex items-start gap-3 min-w-0">
                          
                          {/* Complete Checkbox */}
                          <button
                            type="button"
                            onClick={() => onToggleTimeBlockStatus(block.id)}
                            className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                              block.is_completed
                                ? 'bg-[#174235] dark:bg-emerald-600 border-[#174235] dark:border-emerald-600 text-white'
                                : 'bg-white dark:bg-[#121c17] border-[#d8d4cc] dark:border-[#2d4034] hover:border-[#174235]'
                            }`}
                            title={block.is_completed ? 'تعليم كغير منجز' : 'تعليم كمنجز'}
                            aria-label={block.is_completed ? 'تعليم كغير منجز' : 'تعليم كمنجز'}
                          >
                            {block.is_completed && <Check className="w-3.5 h-3.5" />}
                          </button>

                          <div className="space-y-1 min-w-0">
                            
                            {/* Time badge & Category */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#1a2420] dark:text-white bg-white/80 dark:bg-black/30 px-2 py-0.5 rounded-md border border-black/5 dark:border-white/10 tabular-nums">
                                {block.start_time} - {block.end_time}
                              </span>

                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/60 dark:bg-black/20 ${cfg.text}`}>
                                <span>{cfg.icon}</span> {cfg.label}
                              </span>

                              {isCurrent && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#174235] dark:bg-emerald-600 text-white">
                                  جارية الآن
                                </span>
                              )}
                            </div>

                            {/* Block Title */}
                            <h3 className={`text-sm font-bold text-[#1a2420] dark:text-white ${block.is_completed ? 'line-through text-[#6e7d73] dark:text-[#8ea095]' : ''}`}>
                              {block.title}
                            </h3>

                            {/* Linked Task & Project */}
                            {(linkedTask || linkedProject) && (
                              <div className="flex items-center gap-2 text-xs text-[#5c6d62] dark:text-[#9bb0a3] pt-0.5">
                                {linkedProject && (
                                  <span className="inline-flex items-center gap-1">
                                    <Folder className="w-3 h-3 text-[#174235] dark:text-emerald-400" />
                                    <span>{linkedProject.title}</span>
                                  </span>
                                )}
                                {linkedTask && (
                                  <span className="text-[11px] bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded text-[#2d3a33] dark:text-[#d3e2d8]">
                                    المهمة: {linkedTask.title}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Notes */}
                            {block.notes && (
                              <p className="text-xs text-[#637269] dark:text-[#9bb0a3] mt-1 italic">
                                {block.notes}
                              </p>
                            )}

                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {linkedTask && onStartFocusOnTask && (
                            <button
                              type="button"
                              onClick={() => onStartFocusOnTask(linkedTask)}
                              className="p-1.5 bg-white dark:bg-[#18261e] hover:bg-emerald-50 dark:hover:bg-[#1f3327] text-[#174235] dark:text-emerald-400 rounded-lg border border-black/10 dark:border-white/10 transition-colors cursor-pointer"
                              title="بدء جلسة تركيز على هذه المهمة"
                              aria-label="بدء جلسة تركيز"
                            >
                              <Play className="w-3.5 h-3.5 fill-[#174235] dark:fill-emerald-400" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(block)}
                            className="p-1.5 bg-white dark:bg-[#18261e] hover:bg-[#f2efe9] dark:hover:bg-[#203026] text-[#55645b] dark:text-[#8ea095] rounded-lg border border-black/10 dark:border-white/10 transition-colors cursor-pointer"
                            title="تعديل الكتلة"
                            aria-label="تعديل الكتلة"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteTimeBlock(block.id)}
                            className="p-1.5 bg-white dark:bg-[#18261e] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg border border-black/10 dark:border-white/10 transition-colors cursor-pointer"
                            title="حذف الكتلة"
                            aria-label="حذف الكتلة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#f4f2ed] dark:bg-[#192620] text-[#718278] dark:text-[#8ea095] mx-auto flex items-center justify-center text-xl">
                  ⌛
                </div>
                <h3 className="text-sm font-bold text-[#1a2420] dark:text-white">
                  لا توجد كتل زمنية مجدولة لهذا اليوم حتى الآن
                </h3>
                <p className="text-xs text-[#637269] dark:text-[#9bb0a3] max-w-sm mx-auto">
                  ابدأ بجدولة أول ساعة من يومك، أو اسحب المهام غير المجدولة من القائمة الجانبية.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal('09:00')}
                    className="px-4 py-2 bg-[#174235] dark:bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-[#12362b] dark:hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    إضافة كتلة زمنية
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyTemplate}
                    className="px-4 py-2 bg-[#f4f2ed] dark:bg-[#192620] text-[#4d5c52] dark:text-[#b4c7bd] border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs font-bold hover:bg-[#eae6dd] dark:hover:bg-[#203026] transition-colors cursor-pointer"
                  >
                    تطبيق قالب يوم قياسي
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Unscheduled Tasks Drawer */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-5 shadow-2xs space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#1a2420] dark:text-white flex items-center gap-1.5">
                <span>مهام غير مجدولة (Backlog)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ebf4ef] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 font-mono tabular-nums font-bold">
                  {unscheduledTasks.length}
                </span>
              </h3>
            </div>

            <p className="text-[11px] text-[#637269] dark:text-[#9bb0a3]">
              اختر أي مهمة لإدراجها مباشرة في كتل اليوم:
            </p>

            {/* Search filter */}
            <input
              type="text"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              placeholder="ابحث في المهام المتاحة..."
              className="w-full px-3 py-1.5 border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs bg-[#faf8f5] dark:bg-[#18261e] text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500"
            />

            {/* Tasks List */}
            <div className="space-y-2 max-h-96 overflow-y-auto pt-1">
              {unscheduledTasks.map((task) => {
                const project = projects.find((p) => p.id === task.project_id);

                return (
                  <div
                    key={task.id}
                    className="p-3 bg-[#faf8f5] dark:bg-[#18261e] hover:bg-[#f4f1ea] dark:hover:bg-[#1e2f25] border border-[#e8e4db] dark:border-[#26372d] rounded-xl transition-all space-y-1 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-[#1a2420] dark:text-white line-clamp-2">
                        {task.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal('10:00', task)}
                        className="px-2 py-1 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12362b] dark:hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                        title="جدولة هذه المهمة في كتل اليوم"
                      >
                        + جدولة
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#718278] dark:text-[#8ea095]">
                      {project && (
                        <span className="truncate max-w-[140px]">
                          📁 {project.title}
                        </span>
                      )}
                      <span className={`font-bold ${
                        task.priority === 'high' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {task.priority === 'high' ? 'عالية' : 'متوسطة'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {unscheduledTasks.length === 0 && (
                <div className="text-center py-6 text-xs text-[#718278] dark:text-[#8ea095]">
                  {taskSearch ? 'لا توجد نتائج مطابقة للبحث' : 'تمت جدولة كافة المهام!'}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* 3. Add/Edit Time Block Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="time-block-modal-title"
        >
          <div className="bg-white dark:bg-[#131d18] border border-[#d8d4cc] dark:border-[#26372d] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 transition-colors">
            
            <div className="px-6 py-4 bg-[#faf8f5] dark:bg-[#16211a] border-b border-[#e8e4db] dark:border-[#26372d] flex items-center justify-between">
              <h3 id="time-block-modal-title" className="text-sm font-bold text-[#1a2420] dark:text-white">
                {editingBlock ? 'تعديل الكتلة الزمنية' : 'إضافة كتلة زمنية جديدة'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#718278] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white hover:bg-[#ede9df] dark:hover:bg-[#203026] cursor-pointer"
                aria-label="إغلاق النافذة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-[#35433b] dark:text-[#c4d6cb] mb-1">
                  عنوان الكتلة الزمنية: *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثلاً: جلسة تركيز عميق على كود الواجهة..."
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs bg-[#faf8f5] dark:bg-[#18261e] text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500"
                  required
                />
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#35433b] dark:text-[#c4d6cb] mb-1">
                    وقت البدء: *
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs bg-[#faf8f5] dark:bg-[#18261e] text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#35433b] dark:text-[#c4d6cb] mb-1">
                    وقت الانتهاء: *
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs bg-[#faf8f5] dark:bg-[#18261e] text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-[#35433b] dark:text-[#c4d6cb] mb-1">
                  تصنيف النشاط:
                </label>
                <CustomSelect
                  value={formCategory}
                  onChange={(val) => setFormCategory(val as TimeBlockCategory)}
                  options={[
                    { value: 'deep_work', label: '🧠 تركيز عميق (Deep Work)' },
                    { value: 'shallow_work', label: '⚡ عمل إجرائي ومتابعات' },
                    { value: 'meeting', label: '🤝 اجتماع أو تواصل' },
                    { value: 'health_habit', label: '🏃 صحة وعادات ورياضة' },
                    { value: 'learning', label: '📚 قراءة وتعلم وخزائن' },
                    { value: 'rest', label: '☕ استراحة وتجديد طاقة' },
                    { value: 'personal', label: '🏡 شأن شخصي وعائلي' },
                  ]}
                  className="w-full"
                  buttonClassName="w-full py-2 px-3 text-xs rounded-xl bg-white dark:bg-[#18261e] border-[#d8d4cc] dark:border-[#2d4034]"
                  dropdownClassName="w-full"
                />
              </div>

              {/* Link to Task */}
              <div>
                <label className="block text-xs font-bold text-[#35433b] dark:text-[#c4d6cb] mb-1">
                  ربط بمهمة محددة (اختياري):
                </label>
                <CustomSelect
                  value={formTaskId}
                  onChange={(val) => {
                    setFormTaskId(val);
                    const t = tasks.find((item) => item.id === val);
                    if (t && !formTitle) setFormTitle(t.title);
                  }}
                  options={[
                    { value: '', label: 'بدون ربط بمهمة' },
                    ...tasks
                      .filter((t) => t.status !== 'done')
                      .map((t) => ({ value: t.id, label: t.title })),
                  ]}
                  className="w-full"
                  buttonClassName="w-full py-2 px-3 text-xs rounded-xl bg-white dark:bg-[#18261e] border-[#d8d4cc] dark:border-[#2d4034]"
                  dropdownClassName="w-full max-h-48"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[#35433b] dark:text-[#c4d6cb] mb-1">
                  ملاحظات أو مخرجات مستهدفة:
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="أي تفاصيل أو نية ذهنية لهذه الكتلة..."
                  className="w-full px-3 py-2 border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs bg-[#faf8f5] dark:bg-[#18261e] text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#f4f2ed] dark:bg-[#192620] hover:bg-[#eae6dd] dark:hover:bg-[#203026] text-[#55645b] dark:text-[#8ea095] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12362b] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {editingBlock ? 'حفظ التعديلات' : 'إضافة الكتلة'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
