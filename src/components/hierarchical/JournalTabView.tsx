import React, { useState, useMemo } from 'react';
import { 
  JournalEntry, 
  MoodType, 
  EnergyLevel, 
  Project 
} from '../../types/hierarchical';
import { 
  PenLine, 
  Mic, 
  Plus, 
  Search, 
  Sparkles, 
  Calendar, 
  Heart, 
  Trophy, 
  CheckSquare, 
  Tag, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Sparkle,
  BookOpen,
  Filter
} from 'lucide-react';
import { analyzeVoiceJournal } from '../../services/aiService';

interface JournalTabViewProps {
  entries: JournalEntry[];
  projects: Project[];
  onSaveEntry: (entry: Partial<JournalEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onOpenVoiceModal: () => void;
}

const MOOD_CONFIG: Record<MoodType, { label: string; icon: string; color: string; border: string; bg: string }> = {
  great: { label: 'رائع ومتحمس', icon: '🌟', color: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  good: { label: 'جيد ومنتج', icon: '😊', color: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  calm: { label: 'هادئ ومطمئن', icon: '🧘', color: 'text-teal-700 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-700', bg: 'bg-teal-50 dark:bg-teal-950/40' },
  neutral: { label: 'عادي وطبيعي', icon: '😐', color: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700', bg: 'bg-slate-50 dark:bg-slate-900/40' },
  tired: { label: 'مجهد وبحاجة لراحة', icon: '🌧️', color: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700', bg: 'bg-blue-50 dark:bg-blue-950/40' },
  stressed: { label: 'مضغوط ومشتت', icon: '⚡', color: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-700', bg: 'bg-rose-50 dark:bg-rose-950/40' },
};

const TEMPLATES = [
  {
    label: '🌅 تأملات الصباح والنية',
    content: `## نية اليوم وأولوياتي:
- أهم هدف أود إنجازه اليوم: 
- الحالة الذهنية التي أرغب في الحفاظ عليها: 
- أمر سأبتعد عنه لتفادي التشتت: `,
  },
  {
    label: '🏆 إنجازات اليوم والانتصارات',
    content: `## حصاد اليوم والانتصارات:
- أهم 3 مهام تم إنجازها بنجاح:
  1. 
  2. 
  3. 
- درس مستفاد من أحداث اليوم: `,
  },
  {
    label: '💚 الامتنان وتقدير النعم',
    content: `## 3 نعم ممتن لها اليوم:
1. 
2. 
3. 
- لحظة جميلة أسعدت قلبي اليوم: `,
  },
  {
    label: '🌙 مراجعة المساء وتفريغ الذهن',
    content: `## مراجعة ختامية لليوم:
- ما الذي سار بشكل رائع اليوم؟
- ما الذي يمكن تحسينه غداً؟
- الأولوية الأولى ليوم الغد: `,
  },
];

export const JournalTabView: React.FC<JournalTabViewProps> = ({
  entries,
  projects: _projects,
  onSaveEntry,
  onDeleteEntry,
  onOpenVoiceModal,
}) => {
  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [mood, setMood] = useState<MoodType>('good');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [gratitudeInput, setGratitudeInput] = useState<string>('');
  const [gratitudeList, setGratitudeList] = useState<string[]>([]);
  const [winsInput, setWinsInput] = useState<string>('');
  const [winsList, setWinsList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>(['يوميات']);
  const [isAiPolishing, setIsAiPolishing] = useState<boolean>(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Open editor for new entry
  const handleOpenNew = () => {
    setEditingId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setTitle('');
    setContent('');
    setMood('good');
    setEnergyLevel('medium');
    setGratitudeList([]);
    setWinsList([]);
    setTags(['يوميات']);
    setIsEditorOpen(true);
  };

  // Open editor for existing entry
  const handleEditEntry = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setDate(entry.date);
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood || 'good');
    setEnergyLevel(entry.energy_level || 'medium');
    setGratitudeList(entry.gratitude || []);
    setWinsList(entry.wins || []);
    setTags(entry.tags || ['يوميات']);
    setIsEditorOpen(true);
  };

  // Toolbar Formatting helper
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || 'نص'}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 0);
  };

  // Insert ready template
  const handleInsertTemplate = (templateContent: string) => {
    if (content.trim()) {
      setContent((prev) => prev + '\n\n' + templateContent);
    } else {
      setContent(templateContent);
    }
  };

  // Add gratitude item
  const handleAddGratitude = () => {
    if (!gratitudeInput.trim()) return;
    setGratitudeList((prev) => [...prev, gratitudeInput.trim()]);
    setGratitudeInput('');
  };

  // Add win item
  const handleAddWin = () => {
    if (!winsInput.trim()) return;
    setWinsList((prev) => [...prev, winsInput.trim()]);
    setWinsInput('');
  };

  // Add tag
  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (!clean || tags.includes(clean)) return;
    setTags((prev) => [...prev, clean]);
    setTagInput('');
  };

  // AI Polish
  const handleAiPolish = async () => {
    if (!content.trim() && !title.trim()) return;
    setIsAiPolishing(true);
    try {
      const textToAnalyze = `${title ? title + ':\n' : ''}${content}`;
      const result = await analyzeVoiceJournal(textToAnalyze, date);
      if (result.title) setTitle(result.title);
      if (result.formatted_content) setContent(result.formatted_content);
      if (result.mood) setMood(result.mood);
      if (result.energy_level) setEnergyLevel(result.energy_level);
      if (result.gratitude && result.gratitude.length > 0) {
        setGratitudeList((prev) => Array.from(new Set([...prev, ...result.gratitude])));
      }
      if (result.wins && result.wins.length > 0) {
        setWinsList((prev) => Array.from(new Set([...prev, ...result.wins])));
      }
      if (result.suggested_tags && result.suggested_tags.length > 0) {
        setTags((prev) => Array.from(new Set([...prev, ...result.suggested_tags])));
      }
    } catch (err) {
      console.warn('AI polish fallback:', err);
    } finally {
      setIsAiPolishing(false);
    }
  };

  // Save handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    onSaveEntry({
      id: editingId || undefined,
      date,
      title: title.trim() || `خاطرة ${date}`,
      content: content.trim(),
      mood,
      energy_level: energyLevel,
      gratitude: gratitudeList,
      wins: winsList,
      tags,
      created_at: new Date().toISOString(),
    });

    setIsEditorOpen(false);
    setEditingId(null);
  };

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchMood =
        selectedMoodFilter === 'all' || item.mood === selectedMoodFilter;

      return matchSearch && matchMood;
    });
  }, [entries, searchQuery, selectedMoodFilter]);

  // Quick stats
  const totalEntries = entries.length;
  const recordedCount = entries.filter((e) => e.voice_recorded).length;

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Quick Actions Bar */}
      <div className="bg-white dark:bg-[#14201a] border border-[#e8e4db] dark:border-[#24372c] rounded-2xl p-5 sm:p-6 shadow-2xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#ebf5ef] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <PenLine className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-[#1a2420] dark:text-white flex items-center gap-2">
                  <span>اليوميات والمذكرات (Daily Journal)</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-300">
                    {totalEntries} تدوينة
                  </span>
                </h1>
                <p className="text-xs text-[#6e7b74] dark:text-[#9bb0a3]">
                  سجل تأملاتك، حصاد يومك، ونقاط الامتنان بالصوت أو الكتابة مع استخلاص ذكي للمهام والدروس.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Voice Journal Trigger */}
            <button
              type="button"
              onClick={onOpenVoiceModal}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-white dark:bg-[#1a2620] hover:bg-[#ebf5ef] dark:hover:bg-[#203428] text-[#174235] dark:text-emerald-300 border border-[#cfe0d5] dark:border-[#274534] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer group"
              title="تسجيل يوميات صوتية بالذكاء الاصطناعي"
            >
              <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>تدوين صوتي بالـ AI</span>
            </button>

            {/* Write New Button */}
            <button
              type="button"
              onClick={() => {
                if (isEditorOpen) {
                  setIsEditorOpen(false);
                } else {
                  handleOpenNew();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12362b] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {isEditorOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isEditorOpen ? 'إغلاق المحرر' : 'كتابة تدوينة'}</span>
            </button>
          </div>

        </div>

        {/* Stats Strip */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[#f0ede6] dark:border-[#223028] text-xs text-[#637068] dark:text-[#9bb0a3]">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
            <span>إجمالي المذكرات:</span>
            <span className="font-bold text-[#1a2420] dark:text-white font-mono tabular-nums">{totalEntries}</span>
          </div>

          <span className="text-[#d8d4cc] dark:text-[#33463a]">·</span>

          <div className="flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>تدوينات صوتية:</span>
            <span className="font-bold text-[#1a2420] dark:text-white font-mono tabular-nums">{recordedCount}</span>
          </div>

          <span className="text-[#d8d4cc] dark:text-[#33463a]">·</span>

          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>نظام دوّنلي الهرمي:</span>
            <span className="font-semibold text-[#1a2420] dark:text-white">تأملات تغذي الركائز والرؤى</span>
          </div>
        </div>

      </div>

      {/* 2. Interactive Writing Editor (When Open) */}
      {isEditorOpen && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-[#15221b] border-2 border-[#174235]/30 dark:border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-md space-y-5 transition-all animate-in fade-in zoom-in-98 duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f0ede6] dark:border-[#24372c]">
            <div className="flex items-center gap-2">
              <span className="text-sm">✍️</span>
              <h3 className="text-sm font-black text-[#1a2420] dark:text-white">
                {editingId ? 'تعديل التدوينة' : 'كتابة تدوينة وخاطرة جديدة'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* AI Polish Button */}
              <button
                type="button"
                disabled={isAiPolishing || (!content.trim() && !title.trim())}
                onClick={handleAiPolish}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isAiPolishing || (!content.trim() && !title.trim())
                    ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-500'
                    : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                }`}
                title="إعادة الصياغة وتنسيق الأفكار واستخراج المهام تلقائياً بالذكاء الاصطناعي"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAiPolishing ? 'جاري التحسين بالـ AI...' : 'تحسين بالذكاء الاصطناعي'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded-lg text-[#78857e] hover:text-[#1a2420] dark:hover:text-white cursor-pointer"
                aria-label="إلغاء"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Date & Title Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label htmlFor="journal-date" className="block text-xs font-bold text-[#5b6861] dark:text-[#9bb0a3] mb-1">
                تاريخ التدوينة:
              </label>
              <input
                id="journal-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#faf9f6] dark:bg-[#16211a] border border-[#d6dfd9] dark:border-[#283d31] rounded-xl text-xs font-bold text-[#1a2420] dark:text-white focus:ring-2 focus:ring-[#174235]"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="journal-title" className="block text-xs font-bold text-[#5b6861] dark:text-[#9bb0a3] mb-1">
                عنوان التدوينة / الفكرة المحورية:
              </label>
              <input
                id="journal-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: يوم استثنائي للتركيز العميق وإكمال مسودة المشروع..."
                className="w-full px-3 py-2 bg-[#faf9f6] dark:bg-[#16211a] border border-[#d6dfd9] dark:border-[#283d31] rounded-xl text-xs font-bold text-[#1a2420] dark:text-white focus:ring-2 focus:ring-[#174235]"
              />
            </div>
          </div>

          {/* Mood Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#5b6861] dark:text-[#9bb0a3]">
              الحالة المزاجية والشعور السائد اليوم:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {(Object.keys(MOOD_CONFIG) as MoodType[]).map((mKey) => {
                const cfg = MOOD_CONFIG[mKey];
                const isSelected = mood === mKey;
                return (
                  <button
                    key={mKey}
                    type="button"
                    onClick={() => setMood(mKey)}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? `${cfg.bg} ${cfg.border} ${cfg.color} ring-2 ring-emerald-600/30 shadow-2xs`
                        : 'bg-[#faf9f6] dark:bg-[#16211a] border-[#e8e4db] dark:border-[#283d31] text-[#637068] dark:text-[#9bb0a3] hover:border-[#174235]/40'
                    }`}
                  >
                    <span>{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[#718278] dark:text-[#8ea095]">
              قوالب تأملات جاهزة (انقر للإضافة):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInsertTemplate(tmpl.content)}
                  className="px-2.5 py-1 bg-[#f4f2ed] dark:bg-[#192620] hover:bg-[#eae6de] dark:hover:bg-[#22332a] border border-[#dfdbd3] dark:border-[#283830] rounded-lg text-xs font-medium text-[#404d45] dark:text-[#c4d6cb] transition-colors cursor-pointer"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Easy-to-use Rich Toolbar & Textarea */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-[#f4f2ed] dark:bg-[#192620] border border-[#e0dcd4] dark:border-[#283830] rounded-xl text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className="p-1.5 hover:bg-white dark:hover:bg-[#22332a] rounded-lg text-[#525f58] dark:text-[#c4d4cb] font-bold cursor-pointer"
                  title="عريض"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*')}
                  className="p-1.5 hover:bg-white dark:hover:bg-[#22332a] rounded-lg text-[#525f58] dark:text-[#c4d4cb] cursor-pointer"
                  title="مائل"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <span className="text-[#d8d4cc] dark:text-[#33463a]">|</span>
                <button
                  type="button"
                  onClick={() => insertFormatting('- ')}
                  className="p-1.5 hover:bg-white dark:hover:bg-[#22332a] rounded-lg text-[#525f58] dark:text-[#c4d4cb] cursor-pointer"
                  title="قائمة نقطية"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('1. ')}
                  className="p-1.5 hover:bg-white dark:hover:bg-[#22332a] rounded-lg text-[#525f58] dark:text-[#c4d4cb] cursor-pointer"
                  title="قائمة رقمية"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('- [ ] ')}
                  className="p-1.5 hover:bg-white dark:hover:bg-[#22332a] rounded-lg text-[#525f58] dark:text-[#c4d4cb] cursor-pointer"
                  title="قائمة مهام"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('> ')}
                  className="p-1.5 hover:bg-white dark:hover:bg-[#22332a] rounded-lg text-[#525f58] dark:text-[#c4d4cb] cursor-pointer"
                  title="اقتباس"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-[11px] text-[#718278] dark:text-[#8ea095] font-mono pl-2">
                {content.split(/\s+/).filter(Boolean).length} كلمة
              </div>
            </div>

            <textarea
              ref={textareaRef}
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب خواطرك ومذكراتك هنا بحرية تامة... ما الذي حققته اليوم؟ ما المشاعر التي راودتك؟ ما الدروس التي استخلصتها؟"
              className="w-full p-4 bg-[#faf9f6] dark:bg-[#16211a] border border-[#d6dfd9] dark:border-[#283d31] rounded-xl text-xs sm:text-sm text-[#1a2420] dark:text-white leading-relaxed focus:ring-2 focus:ring-[#174235] focus:outline-hidden font-normal"
            />
          </div>

          {/* Gratitude & Wins Extra Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Gratitude */}
            <div className="p-3.5 bg-[#faf9f6] dark:bg-[#16211a] border border-[#e8e4db] dark:border-[#24372c] rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                <span>الامتنان وتقدير النعم:</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={gratitudeInput}
                  onChange={(e) => setGratitudeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGratitude();
                    }
                  }}
                  placeholder="أمر تشعر بالامتنان لوجوده اليوم..."
                  className="flex-1 px-2.5 py-1 bg-white dark:bg-[#121c17] border border-[#d6dfd9] dark:border-[#283d31] rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddGratitude}
                  className="px-2.5 py-1 bg-[#174235] dark:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  إضافة
                </button>
              </div>
              {gratitudeList.length > 0 && (
                <div className="space-y-1 pt-1">
                  {gratitudeList.map((g, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-white dark:bg-[#121c17] rounded-md border border-[#e8e4db] dark:border-[#203026]">
                      <span className="text-[#324037] dark:text-[#d0e0d6]">· {g}</span>
                      <button
                        type="button"
                        onClick={() => setGratitudeList((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wins */}
            <div className="p-3.5 bg-[#faf9f6] dark:bg-[#16211a] border border-[#e8e4db] dark:border-[#24372c] rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Trophy className="w-3.5 h-3.5" />
                <span>إنجازات وانتصارات اليوم:</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={winsInput}
                  onChange={(e) => setWinsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddWin();
                    }
                  }}
                  placeholder="إنجاز أو خطوة تقدم اليوم..."
                  className="flex-1 px-2.5 py-1 bg-white dark:bg-[#121c17] border border-[#d6dfd9] dark:border-[#283d31] rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddWin}
                  className="px-2.5 py-1 bg-[#174235] dark:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  إضافة
                </button>
              </div>
              {winsList.length > 0 && (
                <div className="space-y-1 pt-1">
                  {winsList.map((w, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-white dark:bg-[#121c17] rounded-md border border-[#e8e4db] dark:border-[#203026]">
                      <span className="text-[#324037] dark:text-[#d0e0d6]">🏆 {w}</span>
                      <button
                        type="button"
                        onClick={() => setWinsList((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#5b6861] dark:text-[#9bb0a3]">
              الوسوم والتصنيفات:
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-[#ebf4ef] dark:bg-[#192b22] border border-[#b4d6c2] dark:border-[#254532] text-[#174235] dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((_, i) => i !== idx))}
                    className="hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="أضف وسماً..."
                  className="px-2.5 py-1 bg-[#faf9f6] dark:bg-[#16211a] border border-[#d6dfd9] dark:border-[#283d31] rounded-lg text-xs w-28"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2 py-1 bg-[#e8e4dc] dark:bg-[#203026] text-[#404c45] dark:text-[#c4d6cb] rounded-lg text-xs font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Editor Action Buttons */}
          <div className="pt-4 border-t border-[#f0ede6] dark:border-[#24372c] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditorOpen(false)}
              className="px-4 py-2 bg-[#faf9f6] dark:bg-[#192620] hover:bg-[#edeae2] dark:hover:bg-[#22332a] text-[#55645b] dark:text-[#9bb0a3] border border-[#d8d4cc] dark:border-[#2c3d33] rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12362b] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingId ? 'تحديث التدوينة' : 'حفظ في اليوميات'}</span>
            </button>
          </div>

        </form>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-[#14201a] border border-[#e8e4db] dark:border-[#24372c] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#78857e] dark:text-[#8ea095] absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في التدوينات، الوسوم، أو الكلمات..."
              className="w-full pr-9 pl-3 py-2 bg-[#faf9f6] dark:bg-[#16211a] border border-[#d6dfd9] dark:border-[#283d31] rounded-xl text-xs text-[#1a2420] dark:text-white focus:ring-2 focus:ring-[#174235] focus:outline-hidden"
            />
          </div>

          {/* Mood Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs scrollbar-none">
            <span className="text-[#78857e] dark:text-[#8ea095] text-[11px] font-semibold shrink-0">المزاج:</span>
            <button
              type="button"
              onClick={() => setSelectedMoodFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedMoodFilter === 'all'
                  ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-2xs'
                  : 'text-[#5b6660] dark:text-[#9bb0a3] hover:bg-[#f2efe9] dark:hover:bg-[#1d2b23]'
              }`}
            >
              الكل
            </button>
            {(Object.keys(MOOD_CONFIG) as MoodType[]).map((mKey) => {
              const cfg = MOOD_CONFIG[mKey];
              return (
                <button
                  key={mKey}
                  type="button"
                  onClick={() => setSelectedMoodFilter(mKey)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    selectedMoodFilter === mKey
                      ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-2xs'
                      : 'text-[#5b6660] dark:text-[#9bb0a3] hover:bg-[#f2efe9] dark:hover:bg-[#1d2b23]'
                  }`}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* 4. Journal Entries Timeline / Cards List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white dark:bg-[#14201a] border border-[#e8e4db] dark:border-[#24372c] rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#ebf5ef] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 mx-auto flex items-center justify-center">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#1a2420] dark:text-white">
              {searchQuery ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد تدوينات بعد'}
            </h3>
            <p className="text-xs text-[#6e7b74] dark:text-[#9bb0a3] max-w-sm mx-auto">
              ابدأ الآن بتدوين أول خاطرة، أو تحدث وسيقوم الذكاء الاصطناعي بتنظيم يومياتك تلقائياً.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenVoiceModal}
              className="px-4 py-2 bg-[#ebf5ef] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 font-bold rounded-xl text-xs hover:bg-[#dfeee5] cursor-pointer flex items-center gap-1.5"
            >
              <Mic className="w-4 h-4" />
              <span>تدوين صوتي بالـ AI</span>
            </button>
            <button
              type="button"
              onClick={handleOpenNew}
              className="px-4 py-2 bg-[#174235] dark:bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-[#12362b] cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>كتابة تدوينة</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const moodCfg = entry.mood ? MOOD_CONFIG[entry.mood] : null;
            return (
              <article
                key={entry.id}
                className="bg-white dark:bg-[#14201a] border border-[#e8e4db] dark:border-[#24372c] hover:border-[#174235]/40 dark:hover:border-emerald-500/40 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-3.5 group"
              >
                {/* Entry Header: Date, Mood & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#f0ede6] dark:border-[#223028]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-[#174235] dark:text-emerald-400 bg-[#ebf5ef] dark:bg-[#192b22] px-2.5 py-0.5 rounded-md tabular-nums">
                      {entry.date}
                    </span>

                    {moodCfg && (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${moodCfg.bg} ${moodCfg.border} ${moodCfg.color}`}>
                        <span>{moodCfg.icon}</span>
                        <span>{moodCfg.label}</span>
                      </span>
                    )}

                    {entry.voice_recorded && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <Mic className="w-3 h-3" />
                        <span>تسجيل صوتي</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleEditEntry(entry)}
                      className="p-1.5 text-[#78857e] hover:text-[#174235] dark:hover:text-white hover:bg-[#f2efe9] dark:hover:bg-[#1c2a22] rounded-lg transition-colors cursor-pointer"
                      title="تعديل التدوينة"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      className="p-1.5 text-[#78857e] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      title="حذف التدوينة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Entry Title */}
                <h3 className="text-base font-black text-[#1a2420] dark:text-white">
                  {entry.title}
                </h3>

                {/* Content Body */}
                <div className="text-xs sm:text-sm text-[#38483f] dark:text-[#c6d7cd] leading-relaxed whitespace-pre-line">
                  {entry.content}
                </div>

                {/* Gratitude & Wins Strips if present */}
                {(entry.gratitude?.length || entry.wins?.length) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {entry.gratitude && entry.gratitude.length > 0 && (
                      <div className="p-2.5 bg-[#faf9f6] dark:bg-[#121c17] border border-[#e8e4db] dark:border-[#203026] rounded-xl space-y-1 text-xs">
                        <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-rose-500" />
                          <span>نعم ممتن لها:</span>
                        </div>
                        <ul className="space-y-0.5 text-[11px] text-[#4a5850] dark:text-[#b0c4b8]">
                          {entry.gratitude.map((g, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-rose-500">·</span>
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.wins && entry.wins.length > 0 && (
                      <div className="p-2.5 bg-[#faf9f6] dark:bg-[#121c17] border border-[#e8e4db] dark:border-[#203026] rounded-xl space-y-1 text-xs">
                        <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          <span>انتصارات اليوم:</span>
                        </div>
                        <ul className="space-y-0.5 text-[11px] text-[#4a5850] dark:text-[#b0c4b8]">
                          {entry.wins.map((w, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-amber-500 font-bold">🏆</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* AI Insights Quote if present */}
                {entry.ai_insights && (
                  <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-2 text-xs">
                    <Sparkle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-emerald-900 dark:text-emerald-200 italic leading-relaxed text-[11px]">
                      «{entry.ai_insights}»
                    </p>
                  </div>
                )}

                {/* Tags Footer */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {entry.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[#f4f2ed] dark:bg-[#18261e] border border-[#e0dcd4] dark:border-[#25372d] text-[#637068] dark:text-[#9bb0a3] rounded-md text-[11px] font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

              </article>
            );
          })}
        </div>
      )}

    </div>
  );
};
