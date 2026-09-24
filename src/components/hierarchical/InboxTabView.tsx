import React, { useState, useRef, useEffect } from 'react';
import { 
  InboxItem, 
  InboxSourceType, 
  Project, 
  ValueGoal, 
  Pillar 
} from '../../types/hierarchical';
import { 
  Inbox, 
  Plus, 
  CheckSquare, 
  BookOpen, 
  Repeat, 
  Trash2, 
  ExternalLink, 
  Lightbulb, 
  FileText, 
  HelpCircle, 
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { triageInboxIdea, AiInboxTriage } from '../../services/aiService';

interface InboxTabViewProps {
  inboxItems: InboxItem[];
  projects: Project[];
  goals: ValueGoal[];
  pillars: Pillar[];
  onAddInboxItem: (item: Partial<InboxItem>) => void;
  onDeleteItem: (id: string) => void;
  onConvertToTask: (inboxItem: InboxItem, projectId: string) => void;
  onConvertToVault: (inboxItem: InboxItem, pillarId: string) => void;
  onConvertToHabit: (inboxItem: InboxItem, pillarId: string) => void;
}

export const InboxTabView: React.FC<InboxTabViewProps> = ({
  inboxItems,
  projects,
  goals: _goals,
  pillars,
  onAddInboxItem,
  onDeleteItem,
  onConvertToTask,
  onConvertToVault,
  onConvertToHabit,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [quickSourceType, setQuickSourceType] = useState<InboxSourceType>('idea');
  const [quickUrl, setQuickUrl] = useState('');
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const [filterTab, setFilterTab] = useState<'inbox' | 'processed' | 'all'>('inbox');

  const inputRef = useRef<HTMLInputElement>(null);

  // Convert Modal state
  const [convertingItem, setConvertingItem] = useState<InboxItem | null>(null);
  const [convertTargetType, setConvertTargetType] = useState<'task' | 'vault' | 'habit'>('task');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [selectedPillarId, setSelectedPillarId] = useState<string>(pillars[0]?.id || '');
  const [isTriaging, setIsTriaging] = useState<string | null>(null);
  const [aiTriageResult, setAiTriageResult] = useState<AiInboxTriage | null>(null);

  const handleAiTriage = async (item: InboxItem) => {
    setIsTriaging(item.id);
    try {
      const res = await triageInboxIdea(item.title, item.content);
      setAiTriageResult(res);
      setConvertingItem(item);
      setConvertTargetType(res.recommended_destination === 'project' ? 'task' : res.recommended_destination);

      if (res.suggested_pillar_title && pillars.length > 0) {
        const match = pillars.find(
          (p) =>
            p.title.toLowerCase().includes(res.suggested_pillar_title.toLowerCase()) ||
            res.suggested_pillar_title.toLowerCase().includes(p.title.toLowerCase())
        );
        if (match) setSelectedPillarId(match.id);
      }
    } catch (err) {
      console.warn('AI Triage error:', err);
    } finally {
      setIsTriaging(null);
    }
  };

  // Escape key handler for convert modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && convertingItem) {
        setConvertingItem(null);
        setAiTriageResult(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [convertingItem]);

  const pendingCount = inboxItems.filter(i => i.status === 'inbox').length;
  const processedCount = inboxItems.filter(i => i.status === 'processed').length;

  const activeItems = inboxItems.filter(item => {
    if (filterTab === 'inbox') return item.status === 'inbox';
    if (filterTab === 'processed') return item.status === 'processed';
    return true;
  });

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    onAddInboxItem({
      title: quickTitle.trim(),
      content: quickContent.trim() || undefined,
      source_type: quickSourceType,
      url: quickUrl.trim() || undefined,
      status: 'inbox',
    });

    setQuickTitle('');
    setQuickContent('');
    setQuickUrl('');
    setShowAdvancedInputs(false);
    inputRef.current?.focus();
  };

  const handleExecuteConvert = () => {
    if (!convertingItem) return;
    if (convertTargetType === 'task') {
      onConvertToTask(convertingItem, selectedProjectId || projects[0]?.id);
    } else if (convertTargetType === 'vault') {
      onConvertToVault(convertingItem, selectedPillarId || pillars[0]?.id);
    } else if (convertTargetType === 'habit') {
      onConvertToHabit(convertingItem, selectedPillarId || pillars[0]?.id);
    }
    setConvertingItem(null);
  };

  const sourceMeta: Record<InboxSourceType, { label: string; icon: React.ReactNode }> = {
    idea: { label: 'فكرة', icon: <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> },
    task_seed: { label: 'بذرة مهمة', icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> },
    reference: { label: 'مرجع', icon: <FileText className="w-3.5 h-3.5 text-blue-500" /> },
    question: { label: 'سؤال', icon: <HelpCircle className="w-3.5 h-3.5 text-purple-500" /> },
    link: { label: 'رابط', icon: <LinkIcon className="w-3.5 h-3.5 text-stone-500" /> },
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      
      {/* 1. Header & Quick Add Strip */}
      <div className="bg-white dark:bg-[#131d18] rounded-2xl border border-[#e8e4db] dark:border-[#26372d] p-4 sm:p-5 shadow-2xs space-y-3.5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#1a2420] dark:text-white">صندوق الوارد (Inbox)</h1>
                <span className="text-xs font-mono text-[#78857e] dark:text-[#8ea095] tabular-nums">
                  ({pendingCount} بانتظار الفرز)
                </span>
              </div>
              <p className="text-xs text-[#6e7b74] dark:text-[#9bb0a3]">
                التقط كل الأفكار والالتزامات فوراً لتصفية الذهن، ثم وجّهها لمسارها المناسب.
              </p>
            </div>
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center bg-[#f4f2ec] dark:bg-[#192620] p-0.5 rounded-xl text-xs shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterTab('inbox')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterTab === 'inbox'
                  ? 'bg-white dark:bg-[#121c17] text-[#174235] dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-[#637068] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white'
              }`}
            >
              في الصندوق <span className="font-mono tabular-nums text-[11px]">({pendingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('processed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterTab === 'processed'
                  ? 'bg-white dark:bg-[#121c17] text-[#174235] dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-[#637068] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white'
              }`}
            >
              المفرزة <span className="font-mono tabular-nums text-[11px]">({processedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-white dark:bg-[#121c17] text-[#174235] dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-[#637068] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white'
              }`}
            >
              الكل <span className="font-mono tabular-nums text-[11px]">({inboxItems.length})</span>
            </button>
          </div>
        </div>

        {/* Rapid Capture Form */}
        <form onSubmit={handleQuickAdd} className="bg-[#f8f7f4] dark:bg-[#192620] border border-[#e8e4db] dark:border-[#26372d] rounded-xl p-2.5 sm:p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              required
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="اكتب فكرة، التزاماً، أو خاطرة واضغط Enter للإيداع السريع..."
              className="flex-1 bg-white dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#2d4034] rounded-lg px-3 py-2 text-xs text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500 focus:ring-1 focus:ring-[#174235]/20 placeholder:text-[#8a968f]"
            />
            
            <CustomSelect<InboxSourceType>
              value={quickSourceType}
              onChange={(val) => setQuickSourceType(val)}
              options={[
                { value: 'idea', label: 'فكرة', icon: '💡' },
                { value: 'task_seed', label: 'مهمة', icon: '⚡' },
                { value: 'reference', label: 'مرجع', icon: '📄' },
                { value: 'question', label: 'سؤال', icon: '❓' },
                { value: 'link', label: 'رابط', icon: '🔗' },
              ]}
              buttonClassName="rounded-lg py-2 px-2.5 bg-white dark:bg-[#121c17] border-[#d8d4cc] dark:border-[#2d4034] hover:border-[#174235]"
              className="shrink-0"
              size="sm"
            />

            <button
              type="submit"
              className="px-3.5 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إيداع</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
              className="p-2 text-[#7d8982] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-[#121c17] border border-transparent hover:border-[#d8d4cc] dark:hover:border-[#2d4034] transition-colors"
              title="خيارات إضافية"
              aria-label="خيارات إضافية"
            >
              {showAdvancedInputs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showAdvancedInputs && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <input
                type="text"
                value={quickContent}
                onChange={(e) => setQuickContent(e.target.value)}
                placeholder="تفاصيل إضافية أو سياق ملخص..."
                className="bg-white dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#2d4034] rounded-lg px-3 py-1.5 text-xs text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500"
              />
              <input
                type="url"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="رابط خارجي https://..."
                className="bg-white dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#2d4034] rounded-lg px-3 py-1.5 text-xs text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500 font-mono"
              />
            </div>
          )}
        </form>
      </div>

      {/* 2. Inbox Items Feed */}
      {activeItems.length === 0 ? (
        <div className="bg-white dark:bg-[#131d18] border border-[#e8e4db] dark:border-[#26372d] rounded-2xl p-10 text-center text-xs text-[#7d8982] dark:text-[#9bb0a3] space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-[#1a2420] dark:text-white">صندوق الوارد نظيف تماماً (Inbox Zero)</h3>
          <p className="text-xs text-[#6e7b74] dark:text-[#9bb0a3] max-w-sm mx-auto">
            لا توجد أفكار أو مهام معلقة. كافة الالتزامات تم فرزها وتوجيهها لمساراتها الصحيحة.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#131d18] border border-[#e8e4db] dark:border-[#26372d] rounded-2xl divide-y divide-[#f0ede6] dark:divide-[#223028] shadow-2xs overflow-hidden">
          {activeItems.map((item) => {
            const meta = sourceMeta[item.source_type] || sourceMeta.idea;
            const isProcessed = item.status === 'processed';

            return (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 hover:bg-[#faf9f6] dark:hover:bg-[#18261e] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Content & Metadata */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-[#78857e] dark:text-[#8ea095]">
                    <span className="flex items-center gap-1 font-semibold text-[#46534d] dark:text-[#a0b5a8]">
                      {meta.icon}
                      <span>{meta.label}</span>
                    </span>
                    <span className="text-[#c7c2b6] dark:text-[#384a3e]">·</span>
                    <span className="text-[11px] font-mono tabular-nums">
                      {new Date(item.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isProcessed && (
                      <>
                        <span className="text-[#c7c2b6] dark:text-[#384a3e]">·</span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">تم الفرز والتحويل</span>
                      </>
                    )}
                  </div>

                  <h3 className={`text-xs sm:text-sm font-semibold ${isProcessed ? 'text-[#7d8982] dark:text-[#65796c] line-through' : 'text-[#1a2420] dark:text-white'}`}>
                    {item.title}
                  </h3>

                  {item.content && (
                    <p className="text-xs text-[#616e67] dark:text-[#9bb0a3] leading-relaxed line-clamp-2">
                      {item.content}
                    </p>
                  )}

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#174235] dark:text-emerald-400 hover:underline font-mono"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-xs">{item.url}</span>
                    </a>
                  )}
                </div>

                {/* Minimalist Action Strip */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {!isProcessed && (
                    <div className="flex items-center bg-[#f4f2ec] dark:bg-[#192620] rounded-lg p-0.5 text-xs">
                      {/* AI Triage Button */}
                      <button
                        type="button"
                        disabled={isTriaging === item.id}
                        onClick={() => handleAiTriage(item)}
                        className="px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 rounded-md transition-all cursor-pointer flex items-center gap-1"
                        title="تحليل واقتراح أفضل مسار بالذكاء الاصطناعي"
                      >
                        {isTriaging === item.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-amber-500" />
                        )}
                        <span>AI فرز</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAiTriageResult(null);
                          setConvertingItem(item);
                          setConvertTargetType('task');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-[#174235] dark:text-emerald-400 hover:bg-white dark:hover:bg-[#121c17] rounded-md transition-all cursor-pointer flex items-center gap-1"
                        title="تحويل لمهمة بمشروع"
                      >
                        <CheckSquare className="w-3 h-3" />
                        <span>مهمة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiTriageResult(null);
                          setConvertingItem(item);
                          setConvertTargetType('vault');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-[#2c5282] dark:text-blue-400 hover:bg-white dark:hover:bg-[#121c17] rounded-md transition-all cursor-pointer flex items-center gap-1"
                        title="حفظ بخزائن المعرفة"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>خزينة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiTriageResult(null);
                          setConvertingItem(item);
                          setConvertTargetType('habit');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-[#8f691c] dark:text-amber-400 hover:bg-white dark:hover:bg-[#121c17] rounded-md transition-all cursor-pointer flex items-center gap-1"
                        title="تحويل لعادة تحت مجال"
                      >
                        <Repeat className="w-3 h-3" />
                        <span>عادة</span>
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-[#9aa69f] dark:text-[#8ea095] hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="حذف"
                    aria-label="حذف العنصر"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Convert Item Modal */}
      {convertingItem && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="convert-modal-title"
        >
          <div className="bg-white dark:bg-[#131d18] rounded-2xl max-w-md w-full p-5 shadow-xl border border-[#e8e4db] dark:border-[#26372d] space-y-4 animate-in fade-in text-xs transition-colors">
            <div className="flex items-center justify-between border-b border-[#f0ede6] dark:border-[#223028] pb-3">
              <h3 id="convert-modal-title" className="font-bold text-sm text-[#1a2420] dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
                <span>توجيه وفرز العنصر</span>
              </h3>
              <button
                type="button"
                onClick={() => setConvertingItem(null)}
                className="text-[#85928a] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white p-1 rounded cursor-pointer"
                aria-label="إغلاق النافذة"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#f8f7f4] dark:bg-[#192620] p-3 rounded-xl border border-[#ece8df] dark:border-[#283830]">
              <span className="text-[11px] text-[#78857e] dark:text-[#8ea095] block">العنصر المراد فرزه:</span>
              <p className="font-bold text-[#1a2420] dark:text-white mt-0.5">{convertingItem.title}</p>
            </div>

            {/* AI Triage Recommendation Card if available */}
            {aiTriageResult && (
              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>توجيه ذكي مقترح بالذكاء الاصطناعي:</span>
                </div>
                <p className="text-emerald-900 dark:text-emerald-200 text-[11px] leading-relaxed">
                  {aiTriageResult.reasoning}
                </p>
                {aiTriageResult.actionable_steps && aiTriageResult.actionable_steps.length > 0 && (
                  <div className="pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 block mb-0.5">
                      الخطوات التنفيذية المقترحة:
                    </span>
                    <ul className="space-y-0.5 text-[11px] text-emerald-900 dark:text-emerald-200">
                      {aiTriageResult.actionable_steps.map((st, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <span className="text-emerald-600">✓</span>
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1.5">المسار المستهدف:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConvertTargetType('task')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold text-center border cursor-pointer transition-all ${
                      convertTargetType === 'task'
                        ? 'bg-[#174235] dark:bg-emerald-600 text-white border-[#174235] dark:border-emerald-600'
                        : 'bg-white dark:bg-[#16211a] text-[#4a554f] dark:text-[#9bb0a3] border-[#d8d4cc] dark:border-[#26372d] hover:bg-[#faf9f6]'
                    }`}
                  >
                    ⚡ مهمة بمشروع
                  </button>
                  <button
                    type="button"
                    onClick={() => setConvertTargetType('vault')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold text-center border cursor-pointer transition-all ${
                      convertTargetType === 'vault'
                        ? 'bg-[#174235] dark:bg-emerald-600 text-white border-[#174235] dark:border-emerald-600'
                        : 'bg-white dark:bg-[#16211a] text-[#4a554f] dark:text-[#9bb0a3] border-[#d8d4cc] dark:border-[#26372d] hover:bg-[#faf9f6]'
                    }`}
                  >
                    📚 خزينة معرفة
                  </button>
                  <button
                    type="button"
                    onClick={() => setConvertTargetType('habit')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold text-center border cursor-pointer transition-all ${
                      convertTargetType === 'habit'
                        ? 'bg-[#174235] dark:bg-emerald-600 text-white border-[#174235] dark:border-emerald-600'
                        : 'bg-white dark:bg-[#16211a] text-[#4a554f] dark:text-[#9bb0a3] border-[#d8d4cc] dark:border-[#26372d] hover:bg-[#faf9f6]'
                    }`}
                  >
                    🔁 عادة بمجال
                  </button>
                </div>
              </div>

              {convertTargetType === 'task' && (
                <div>
                  <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">المشروع التنفيذي الحاضن:</label>
                  <CustomSelect
                    value={selectedProjectId}
                    onChange={(val) => setSelectedProjectId(val)}
                    options={projects.map((p) => ({ value: p.id, label: p.title }))}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3 bg-white dark:bg-[#16211a] border-[#d8d4cc] dark:border-[#26372d]"
                    dropdownClassName="w-full"
                  />
                </div>
              )}

              {(convertTargetType === 'vault' || convertTargetType === 'habit') && (
                <div>
                  <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">المجال المرتبط:</label>
                  <CustomSelect
                    value={selectedPillarId}
                    onChange={(val) => setSelectedPillarId(val)}
                    options={pillars.map((p) => ({ value: p.id, label: `${p.title} (${p.pillar_group})` }))}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3 bg-white dark:bg-[#16211a] border-[#d8d4cc] dark:border-[#26372d]"
                    dropdownClassName="w-full"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f0ede6] dark:border-[#223028]">
              <button
                type="button"
                onClick={() => setConvertingItem(null)}
                className="px-3.5 py-1.5 bg-[#f4f2ec] dark:bg-[#192620] hover:bg-[#ece8de] dark:hover:bg-[#203026] text-[#4a554f] dark:text-[#c4d6cb] rounded-xl font-semibold cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteConvert}
                className="px-4 py-1.5 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer transition-all"
              >
                تأكيد الفرز والتحويل
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
