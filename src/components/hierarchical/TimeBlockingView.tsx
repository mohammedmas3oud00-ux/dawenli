import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  LayoutTemplate,
  Calendar as CalendarIcon,
  Sparkles,
  ExternalLink,
  RefreshCw,
  LogOut,
  AlertCircle,
  CalendarCheck2
} from 'lucide-react';
import { TimeBlock, TimeBlockCategory, Task, Project, Pillar } from '../../types/hierarchical';
import { CustomSelect } from './CustomSelect';
import { ConfirmModal } from '../ConfirmModal';
import { 
  initCalendarAuth, 
  signInWithGoogleCalendar, 
  logoutGoogleCalendar, 
  getCalendarAccessToken,
  CALENDAR_SCOPES 
} from '../../services/calendarAuth';
import { 
  fetchCalendarEventsForDay, 
  createGoogleCalendarEvent, 
  deleteGoogleCalendarEvent, 
  GoogleCalendarEvent 
} from '../../services/googleCalendarService';
import { 
  generateAiSmartSchedule, 
  AiScheduleBlockSuggestion 
} from '../../services/aiService';
import { User } from 'firebase/auth';

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

  // Google Calendar Integration States
  const [calendarUser, setCalendarUser] = useState<User | null>(null);
  const [calendarToken, setCalendarToken] = useState<string | null>(null);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState<boolean>(false);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isFetchingCalendar, setIsFetchingCalendar] = useState<boolean>(false);
  const [syncingBlockId, setSyncingBlockId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [calendarStatusMsg, setCalendarStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Mandatory Confirm Modal for Destructive Calendar Actions
  const [confirmCalendarDelete, setConfirmCalendarDelete] = useState<{
    isOpen: boolean;
    blockId: string;
    eventId: string;
    eventTitle: string;
  } | null>(null);

  // AI Smart Schedule States
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isGeneratingAiSchedule, setIsGeneratingAiSchedule] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiScheduleBlockSuggestion[]>([]);
  const [aiErrorMsg, setAiErrorMsg] = useState<string | null>(null);

  // Update live current time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen to Firebase Auth state for Google Calendar
  useEffect(() => {
    const unsubscribe = initCalendarAuth(
      (user, token) => {
        setCalendarUser(user);
        setCalendarToken(token);
      },
      () => {
        setCalendarUser(null);
        setCalendarToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch calendar events when date changes or token becomes available
  const loadCalendarEvents = useCallback(async (token: string, dateStr: string) => {
    setIsFetchingCalendar(true);
    try {
      const events = await fetchCalendarEventsForDay(token, dateStr);
      setCalendarEvents(events);
    } catch (err: any) {
      console.warn('Failed to load Google Calendar events:', err);
    } finally {
      setIsFetchingCalendar(false);
    }
  }, []);

  useEffect(() => {
    const token = calendarToken || getCalendarAccessToken();
    if (token) {
      loadCalendarEvents(token, selectedDate);
    } else {
      setCalendarEvents([]);
    }
  }, [calendarToken, selectedDate, loadCalendarEvents]);

  // Handle Google Calendar Sign-in
  const handleConnectGoogleCalendar = async () => {
    setIsConnectingCalendar(true);
    setCalendarStatusMsg(null);
    try {
      const res = await signInWithGoogleCalendar();
      setCalendarUser(res.user);
      setCalendarToken(res.accessToken);
      setCalendarStatusMsg({
        type: 'success',
        text: `تم ربط تقويم Google بنجاح بالحساب (${res.user.email})`,
      });
      loadCalendarEvents(res.accessToken, selectedDate);
    } catch (error: any) {
      setCalendarStatusMsg({
        type: 'error',
        text: error.message || 'فشل الاتصال بتقويم Google. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsConnectingCalendar(false);
    }
  };

  // Handle Google Calendar Sign-out
  const handleDisconnectGoogleCalendar = async () => {
    await logoutGoogleCalendar();
    setCalendarUser(null);
    setCalendarToken(null);
    setCalendarEvents([]);
    setCalendarStatusMsg({
      type: 'success',
      text: 'تم فصل الربط مع تقويم Google',
    });
  };

  // Sync a single block to Google Calendar
  const handleSyncBlockToGoogle = async (block: TimeBlock) => {
    const token = calendarToken || getCalendarAccessToken();
    if (!token) {
      handleConnectGoogleCalendar();
      return;
    }

    setSyncingBlockId(block.id);
    setCalendarStatusMsg(null);
    try {
      const linkedTask = block.task_id ? tasks.find((t) => t.id === block.task_id) : undefined;
      const linkedProject = block.project_id ? projects.find((p) => p.id === block.project_id) : undefined;

      const createdEvent = await createGoogleCalendarEvent(
        token,
        block,
        linkedTask?.title,
        linkedProject?.title
      );

      // Update block with Google Calendar reference
      onSaveTimeBlock({
        ...block,
        calendar_event_id: createdEvent.id,
        calendar_html_link: createdEvent.htmlLink || null,
        calendar_synced_at: new Date().toISOString(),
      });

      setCalendarStatusMsg({
        type: 'success',
        text: `تمت إضافة "${block.title}" إلى تقويم Google بنجاح!`,
      });

      // Refresh calendar events
      loadCalendarEvents(token, selectedDate);
    } catch (err: any) {
      setCalendarStatusMsg({
        type: 'error',
        text: err.message || 'فشلت المزامنة مع تقويم Google',
      });
    } finally {
      setSyncingBlockId(null);
    }
  };

  // Request to delete / unsync from Google Calendar (Triggers MANDATORY confirmation modal)
  const handleRequestRemoveFromGoogle = (block: TimeBlock) => {
    if (!block.calendar_event_id) return;
    setConfirmCalendarDelete({
      isOpen: true,
      blockId: block.id,
      eventId: block.calendar_event_id,
      eventTitle: block.title,
    });
  };

  // Confirm delete from Google Calendar
  const handleExecuteCalendarDelete = async () => {
    if (!confirmCalendarDelete) return;
    const token = calendarToken || getCalendarAccessToken();
    const { blockId, eventId, eventTitle } = confirmCalendarDelete;
    setConfirmCalendarDelete(null);

    if (!token) return;

    setSyncingBlockId(blockId);
    try {
      await deleteGoogleCalendarEvent(token, eventId);
      const targetBlock = timeBlocks.find((b) => b.id === blockId);
      if (targetBlock) {
        onSaveTimeBlock({
          ...targetBlock,
          calendar_event_id: null,
          calendar_html_link: null,
          calendar_synced_at: null,
        });
      }
      setCalendarStatusMsg({
        type: 'success',
        text: `تم حذف الموعد "${eventTitle}" من تقويم Google بنجاح`,
      });
      loadCalendarEvents(token, selectedDate);
    } catch (err: any) {
      setCalendarStatusMsg({
        type: 'error',
        text: err.message || 'فشل حذف الموعد من تقويم Google',
      });
    } finally {
      setSyncingBlockId(null);
    }
  };

  // Sync all unsynced blocks of today to Google Calendar
  const handleSyncAllToGoogle = async () => {
    const token = calendarToken || getCalendarAccessToken();
    if (!token) {
      handleConnectGoogleCalendar();
      return;
    }

    const unsynced = dayBlocks.filter((b) => !b.calendar_event_id);
    if (unsynced.length === 0) {
      setCalendarStatusMsg({
        type: 'success',
        text: 'جميع كتل اليوم متزامنة بالفعل مع تقويم Google!',
      });
      return;
    }

    setIsSyncingAll(true);
    setCalendarStatusMsg(null);
    let syncedCount = 0;

    try {
      for (const block of unsynced) {
        const linkedTask = block.task_id ? tasks.find((t) => t.id === block.task_id) : undefined;
        const linkedProject = block.project_id ? projects.find((p) => p.id === block.project_id) : undefined;

        const createdEvent = await createGoogleCalendarEvent(
          token,
          block,
          linkedTask?.title,
          linkedProject?.title
        );

        onSaveTimeBlock({
          ...block,
          calendar_event_id: createdEvent.id,
          calendar_html_link: createdEvent.htmlLink || null,
          calendar_synced_at: new Date().toISOString(),
        });
        syncedCount++;
      }

      setCalendarStatusMsg({
        type: 'success',
        text: `تمت مزامنة ${syncedCount} كتلة زمنية مع تقويم Google بنجاح!`,
      });
      loadCalendarEvents(token, selectedDate);
    } catch (err: any) {
      setCalendarStatusMsg({
        type: 'error',
        text: err.message || 'حدث خطأ أثناء مزامنة بعض الكتل',
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Import a Google Calendar event into دوّنلي as a TimeBlock
  const handleImportCalendarEvent = (event: GoogleCalendarEvent) => {
    let startTime = '09:00';
    let endTime = '10:00';

    if (event.start?.dateTime && event.end?.dateTime) {
      const s = new Date(event.start.dateTime);
      const e = new Date(event.end.dateTime);
      startTime = `${s.getHours().toString().padStart(2, '0')}:${s.getMinutes().toString().padStart(2, '0')}`;
      endTime = `${e.getHours().toString().padStart(2, '0')}:${e.getMinutes().toString().padStart(2, '0')}`;
    }

    const newBlock: TimeBlock = {
      id: `tb-gcal-${Date.now()}`,
      date: selectedDate,
      start_time: startTime,
      end_time: endTime,
      title: event.summary || 'موعد من تقويم Google',
      category: 'meeting',
      is_completed: false,
      notes: event.description || 'مستورد من تقويم Google',
      calendar_event_id: event.id,
      calendar_html_link: event.htmlLink || null,
      calendar_synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    onSaveTimeBlock(newBlock);
    setCalendarStatusMsg({
      type: 'success',
      text: `تم استيراد "${event.summary}" ككتلة زمنية في جدول اليوم!`,
    });
  };

  // AI Smart Schedule Generator
  const handleTriggerAiSchedule = async () => {
    setIsAiModalOpen(true);
    setIsGeneratingAiSchedule(true);
    setAiErrorMsg(null);
    try {
      const suggestions = await generateAiSmartSchedule(unscheduledTasks, selectedDate);
      if (suggestions && suggestions.length > 0) {
        setAiSuggestions(suggestions);
      } else {
        setAiErrorMsg('لم يتم استخراج كتل مقترحة، يرجى النقر على زر إعادة المحاولة.');
      }
    } catch (err: any) {
      console.warn('AI smart schedule error:', err);
      setAiErrorMsg('تعذر التخطيط الذكي حالياً، يرجى النقر على إعادة المحاولة بعد لحظات.');
    } finally {
      setIsGeneratingAiSchedule(false);
    }
  };

  // Apply AI Schedule suggestions
  const handleApplyAiSchedule = () => {
    aiSuggestions.forEach((sug, i) => {
      const block: TimeBlock = {
        id: `tb-ai-${Date.now()}-${i}`,
        date: selectedDate,
        start_time: sug.start_time,
        end_time: sug.end_time,
        title: sug.title,
        category: sug.category,
        notes: sug.notes,
        is_completed: false,
        created_at: new Date().toISOString(),
      };
      onSaveTimeBlock(block);
    });

    setIsAiModalOpen(false);
    setCalendarStatusMsg({
      type: 'success',
      text: `تم تطبيق ${aiSuggestions.length} كتل مقترحة بالذكاء الاصطناعي على جدول اليوم!`,
    });
  };

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
      calendar_event_id: editingBlock?.calendar_event_id,
      calendar_html_link: editingBlock?.calendar_html_link,
      calendar_synced_at: editingBlock?.calendar_synced_at,
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
      
      {/* 1. Header with Date Navigator, Google Calendar integration & AI */}
      <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-5 sm:p-6 shadow-2xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title and Intro */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl">📅</span>
              <h1 className="text-lg sm:text-xl font-bold text-[#1a2420] dark:text-white">
                حجب الوقت والتقويم (Time Blocking & Calendar)
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#2d4034] font-mono tabular-nums">
                {dayBlocks.length} كتل مجدولة
              </span>
              {calendarUser && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  <CalendarCheck2 className="w-3 h-3 text-sky-600" />
                  <span>متصل بتقويم Google</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#636e67] dark:text-[#9bb0a3]">
              خصص لكل ساعة من يومك نية واضحة مسبقة لحماية تركيزك العميق مع مزامنة كاملة لتقويم Google.
            </p>
          </div>

          {/* Action Bar (Google Calendar, AI, Template, Add Block) */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Google Calendar Connect / Sync Button */}
            {!calendarUser ? (
              <button
                type="button"
                onClick={handleConnectGoogleCalendar}
                disabled={isConnectingCalendar}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#192620] hover:bg-[#faf8f5] dark:hover:bg-[#203026] text-[#2d3a32] dark:text-[#d4e2d8] border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                title="ربط ومزامنة جدولك مع Google Calendar"
              >
                {isConnectingCalendar ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#174235] dark:text-emerald-400" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>ربط تقويم Google</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-[#f5f9f7] dark:bg-[#162720] border border-[#cfe3d8] dark:border-[#253e31] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={handleSyncAllToGoogle}
                  disabled={isSyncingAll}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12362b] dark:hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
                  title="مزامنة كافة كتل اليوم مع تقويم Google"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>مزامنة الكتل للتقويم</span>
                </button>

                <button
                  type="button"
                  onClick={() => calendarToken && loadCalendarEvents(calendarToken, selectedDate)}
                  disabled={isFetchingCalendar}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-[#55645b] dark:text-[#8ea095] transition-colors cursor-pointer"
                  title="تحديث أحداث التقويم"
                  aria-label="تحديث أحداث التقويم"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleDisconnectGoogleCalendar}
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                  title="تسجيل الخروج وفصل التقويم"
                  aria-label="تسجيل الخروج من التقويم"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* AI Smart Planner Button */}
            <button
              type="button"
              onClick={handleTriggerAiSchedule}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
              title="توليد جدول ذكي بالذكاء الاصطناعي بناءً على مهامك"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>جدول ذكي (AI)</span>
            </button>

            {/* Date Navigator */}
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12362b] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>كتلة جديدة</span>
            </button>

            {/* Preset Template button */}
            <button
              type="button"
              onClick={handleApplyTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f2ed] dark:bg-[#192620] hover:bg-[#eae6dd] dark:hover:bg-[#203026] text-[#4d5c52] dark:text-[#b4c7bd] border border-[#dcd7cc] dark:border-[#2d4034] rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="تطبيق قالب يوم قياسي جاهز"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
              <span className="hidden sm:inline">قالب قياسي</span>
            </button>

          </div>

        </div>

        {/* Calendar Notification / Status Banner */}
        {calendarStatusMsg && (
          <div className={`mt-3 p-3 rounded-xl text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            calendarStatusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              {calendarStatusMsg.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{calendarStatusMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setCalendarStatusMsg(null)}
              className="p-1 hover:bg-black/5 rounded-lg cursor-pointer"
              aria-label="إغلاق التنبيه"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
            <span className="text-[#7d8b82] dark:text-[#8ea095] text-[11px] block">حالة مزامنة التقويم:</span>
            <span className="font-bold text-sky-700 dark:text-sky-400 text-sm font-mono tabular-nums">
              {dayBlocks.filter((b) => b.calendar_event_id).length} متزامنة مع Google
            </span>
          </div>
        </div>

      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Timeline Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-5 shadow-2xs transition-colors">
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#1a2420] dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
                <span>الجدول الزمني ليوم {new Date(selectedDate).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </h2>

              {calendarUser && dayBlocks.length > 0 && (
                <button
                  type="button"
                  onClick={handleSyncAllToGoogle}
                  disabled={isSyncingAll}
                  className="text-xs text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>مزامنة كتل اليوم لتقويم Google</span>
                </button>
              )}
            </div>

            {dayBlocks.length > 0 ? (
              <div className="space-y-3 relative">
                {dayBlocks.map((block) => {
                  const cfg = CATEGORY_CONFIG[block.category] || CATEGORY_CONFIG.deep_work;
                  const isCurrent = isToday && block.start_time <= currentTimeStr && block.end_time > currentTimeStr;
                  const linkedTask = block.task_id ? tasks.find((t) => t.id === block.task_id) : undefined;
                  const linkedProject = block.project_id ? projects.find((p) => p.id === block.project_id) : undefined;
                  const isSyncingThis = syncingBlockId === block.id;

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

                              {/* Google Calendar Sync Tag */}
                              {block.calendar_event_id && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                  <span>📅 متزامن مع تقويم Google</span>
                                  {block.calendar_html_link && (
                                    <a
                                      href={block.calendar_html_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-sky-600 dark:hover:text-sky-200 ml-0.5"
                                      title="فتح الموعد في Google Calendar"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </span>
                              )}

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
                          
                          {/* Google Calendar Sync / Desync Action */}
                          {calendarUser && (
                            <>
                              {!block.calendar_event_id ? (
                                <button
                                  type="button"
                                  onClick={() => handleSyncBlockToGoogle(block)}
                                  disabled={isSyncingThis}
                                  className="p-1.5 bg-white dark:bg-[#18261e] hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-700 dark:text-sky-300 rounded-lg border border-black/10 dark:border-white/10 transition-colors cursor-pointer"
                                  title="مزامنة هذه الكتلة إلى Google Calendar"
                                  aria-label="مزامنة مع Google Calendar"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin' : ''}`} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRequestRemoveFromGoogle(block)}
                                  disabled={isSyncingThis}
                                  className="p-1.5 bg-white dark:bg-[#18261e] hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg border border-black/10 dark:border-white/10 transition-colors cursor-pointer"
                                  title="إلغاء المزامنة وحذف الموعد من Google Calendar"
                                  aria-label="إلغاء المزامنة من Google Calendar"
                                >
                                  <CalendarIcon className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}

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
                  ابدأ بجدولة أول ساعة من يومك، أو استخدم الجدولة الذكية بالذكاء الاصطناعي لتخطيط يومك تلقائياً.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleTriggerAiSchedule}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>جدول ذكي بالذكاء الاصطناعي (AI)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal('09:00')}
                    className="px-4 py-2 bg-[#174235] dark:bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-[#12362b] dark:hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    إضافة كتلة يدوية
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyTemplate}
                    className="px-4 py-2 bg-[#f4f2ed] dark:bg-[#192620] text-[#4d5c52] dark:text-[#b4c7bd] border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs font-bold hover:bg-[#eae6dd] dark:hover:bg-[#203026] transition-colors cursor-pointer"
                  >
                    تطبيق قالب قياسي
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Google Calendar Day Events (External Events) */}
          {calendarUser && (
            <div className="bg-white dark:bg-[#131d18] border border-sky-200 dark:border-sky-900/40 rounded-2xl p-5 shadow-2xs space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-sky-950 dark:text-sky-300 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-sky-600" />
                  <span>مواعيد وأحداث تقويم Google ليوم {selectedDate}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 font-mono font-bold">
                    {calendarEvents.length}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => calendarToken && loadCalendarEvents(calendarToken, selectedDate)}
                  disabled={isFetchingCalendar}
                  className="text-xs text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetchingCalendar ? 'animate-spin' : ''}`} />
                  <span>تحديث الأحداث</span>
                </button>
              </div>

              {calendarEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {calendarEvents.map((evt) => {
                    const isAlreadyImported = dayBlocks.some((b) => b.calendar_event_id === evt.id);
                    let timeLabel = 'طوال اليوم';
                    if (evt.start?.dateTime && evt.end?.dateTime) {
                      const s = new Date(evt.start.dateTime);
                      const e = new Date(evt.end.dateTime);
                      timeLabel = `${s.getHours().toString().padStart(2, '0')}:${s.getMinutes().toString().padStart(2, '0')} - ${e.getHours().toString().padStart(2, '0')}:${e.getMinutes().toString().padStart(2, '0')}`;
                    }

                    return (
                      <div
                        key={evt.id}
                        className="p-3 bg-sky-50/60 dark:bg-[#162520] border border-sky-100 dark:border-sky-900/30 rounded-xl flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <span className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400 block tabular-nums">
                            {timeLabel}
                          </span>
                          <h4 className="text-xs font-bold text-[#1a2420] dark:text-white truncate">
                            {evt.summary || 'بدون عنوان'}
                          </h4>
                          {evt.description && (
                            <p className="text-[11px] text-[#617167] dark:text-[#9bb0a3] line-clamp-1">
                              {evt.description}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center gap-1">
                          {isAlreadyImported ? (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                              مضاف بالجدول
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleImportCalendarEvent(evt)}
                              className="px-2 py-1 bg-white dark:bg-[#192620] hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              title="إدراج هذا الموعد ككتلة في دوّنلي"
                            >
                              + إدراج ككتلة
                            </button>
                          )}
                          {evt.htmlLink && (
                            <a
                              href={evt.htmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-400 hover:text-sky-600 rounded"
                              title="فتح في Google Calendar"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-[#718278] dark:text-[#8ea095]">
                  {isFetchingCalendar
                    ? 'جاري فحص وجلب مواعيد Google Calendar لهذا اليوم...'
                    : 'لا توجد مواعيد مسجلة في تقويم Google لهذا اليوم'}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Col: Unscheduled Tasks Drawer & AI Suggestion */}
        <div className="space-y-4">
          
          {/* Unscheduled Tasks */}
          <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-5 shadow-2xs space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#1a2420] dark:text-white flex items-center gap-1.5">
                <span>مهام غير مجدولة (Backlog)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ebf4ef] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 font-mono tabular-nums font-bold">
                  {unscheduledTasks.length}
                </span>
              </h3>

              <button
                type="button"
                onClick={handleTriggerAiSchedule}
                className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>تخطيط ذكي (AI)</span>
              </button>
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

          {/* AI Features Guide Card */}
          <div className="bg-gradient-to-br from-[#174235]/5 to-emerald-500/10 dark:from-emerald-950/20 dark:to-teal-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#174235] dark:text-emerald-400">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>ذكاء دوّنلي الاصطناعي (AI)</span>
            </div>
            <p className="text-[11px] text-[#55645b] dark:text-[#9bb0a3] leading-relaxed">
              يدعم نظام دوّنلي نموذج <strong>Gemini 3.8 Flash</strong> لتحليل أهدافك، تفكيك المشاريع لمهام تنفيذية، وصياغة جداول كتل الوقت اليومية المتوازنة بذكاء.
            </p>
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

      {/* 4. AI Schedule Generator Modal */}
      {isAiModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-[#131d18] border border-[#d8d4cc] dark:border-[#26372d] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 transition-colors">
            
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-bold">
                  المخطط الزمني الذكي (Gemini AI Daily Planner)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {!isGeneratingAiSchedule && (
                  <button
                    type="button"
                    onClick={handleTriggerAiSchedule}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="إعادة التخطيط بالذكاء الاصطناعي"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>إعادة التخطيط</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {isGeneratingAiSchedule ? (
                <div className="py-12 text-center space-y-3">
                  <div className="inline-flex p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 animate-bounce">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#1a2420] dark:text-white">
                    جاري التخطيط الذكي ليومك...
                  </h4>
                  <p className="text-xs text-[#617167] dark:text-[#9bb0a3] max-w-sm mx-auto">
                    يقوم نموذج Gemini بتحليل مهامك ذات الأولوية وتوزيعها على فترات التركيز العميق والاستراحات بما يحقق أعلى إنتاجية.
                  </p>
                </div>
              ) : (
                <>
                  {aiErrorMsg && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{aiErrorMsg}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleTriggerAiSchedule}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                      >
                        إعادة المحاولة
                      </button>
                    </div>
                  )}

                  {aiSuggestions.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between text-xs text-[#55645b] dark:text-[#9bb0a3] pb-1 border-b border-[#f0eee9] dark:border-[#223028]">
                        <span>الكتل الزمنية المقترحة ({aiSuggestions.length}):</span>
                        <span>التاريخ: {selectedDate}</span>
                      </div>

                      <div className="space-y-2.5">
                        {aiSuggestions.map((sug, idx) => {
                          const cfg = CATEGORY_CONFIG[sug.category] || CATEGORY_CONFIG.deep_work;
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border ${cfg.bg} ${cfg.border} space-y-1`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold bg-white/80 dark:bg-black/30 px-2 py-0.5 rounded text-[#1a2420] dark:text-white tabular-nums">
                                  {sug.start_time} - {sug.end_time}
                                </span>
                                <span className={`text-[11px] font-bold ${cfg.text}`}>
                                  {cfg.icon} {cfg.label}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-[#1a2420] dark:text-white">
                                {sug.title}
                              </h4>
                              {sug.notes && (
                                <p className="text-[11px] text-[#617167] dark:text-[#9bb0a3] italic">
                                  {sug.notes}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-3 border-t border-[#f0eee9] dark:border-[#223028] flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAiModalOpen(false)}
                          className="px-4 py-2 bg-[#f4f2ed] dark:bg-[#192620] hover:bg-[#eae6dd] dark:hover:bg-[#203026] text-[#55645b] dark:text-[#8ea095] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyAiSchedule}
                          className="px-5 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12362b] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تطبيق الجدول بالكامل في دوّنلي</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center space-y-3">
                      <p className="text-xs text-[#617167] dark:text-[#9bb0a3]">
                        لا توجد كتل مقترحة في الوقت الحالي.
                      </p>
                      <button
                        type="button"
                        onClick={handleTriggerAiSchedule}
                        className="px-4 py-2 bg-[#174235] dark:bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-[#12362b] cursor-pointer"
                      >
                        إعادة التوليد الآن
                      </button>
                    </div>
                  )}
                </>
              )}

            </div>

          </div>
        </div>
      )}

      {/* 5. MANDATORY Confirmation Modal for Google Calendar Deletion */}
      {confirmCalendarDelete && (
        <ConfirmModal
          isOpen={confirmCalendarDelete.isOpen}
          title="تأكيد حذف الموعد من تقويم Google"
          message={`هل أنت متأكد من حذف الموعد "${confirmCalendarDelete.eventTitle}" نهائياً من حساب Google Calendar الخاص بك؟ لا يمكن التراجع عن هذه الخطوة في التقويم.`}
          confirmText="نعم، احذف الموعد من التقويم"
          cancelText="إلغاء"
          variant="danger"
          onConfirm={handleExecuteCalendarDelete}
          onCancel={() => setConfirmCalendarDelete(null)}
        />
      )}

    </div>
  );
};
