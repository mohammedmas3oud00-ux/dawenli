import React, { useState, useRef } from 'react';
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
  Mic,
  MicOff,
  RefreshCw,
  FolderPlus,
  ArrowRight
} from 'lucide-react';
import { deduplicateArabicSpeech, analyzeInboxItemWithAi, AiInboxAnalysisResult } from '../../utils/speechRecognition';

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
  onOpenVoiceAi?: () => void;
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
  onOpenVoiceAi,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [quickSourceType, setQuickSourceType] = useState<InboxSourceType>('idea');
  const [quickUrl, setQuickUrl] = useState('');
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const [filterTab, setFilterTab] = useState<'inbox' | 'processed' | 'all'>('inbox');
  const [isListeningDirect, setIsListeningDirect] = useState(false);

  // AI analysis state for items
  const [analyzingItemId, setAnalyzingItemId] = useState<string | null>(null);
  const [aiAnalysisMap, setAiAnalysisMap] = useState<Record<string, AiInboxAnalysisResult>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceDictation = () => {
    if (isListeningDirect) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListeningDirect(false);
      setQuickTitle((prev) => deduplicateArabicSpeech(prev));
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      if (onOpenVoiceAi) onOpenVoiceAi();
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'ar-SA';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let localFinal = quickTitle;

      recognition.onstart = () => {
        setIsListeningDirect(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            localFinal += ' ' + chunk;
          } else {
            interim += ' ' + chunk;
          }
        }
        const cleaned = deduplicateArabicSpeech((localFinal + ' ' + interim).trim());
        setQuickTitle(cleaned);
      };

      recognition.onerror = () => {
        setIsListeningDirect(false);
      };

      recognition.onend = () => {
        setIsListeningDirect(false);
        setQuickTitle((prev) => deduplicateArabicSpeech(prev));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListeningDirect(false);
      if (onOpenVoiceAi) onOpenVoiceAi();
    }
  };

  // Convert Modal state
  const [convertingItem, setConvertingItem] = useState<InboxItem | null>(null);
  const [convertTargetType, setConvertTargetType] = useState<'task' | 'vault' | 'habit'>('task');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [selectedPillarId, setSelectedPillarId] = useState<string>(pillars[0]?.id || '');

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

  // Trigger AI Analysis for an Inbox Entry
  const handleAnalyzeWithAi = async (item: InboxItem) => {
    setAnalyzingItemId(item.id);
    try {
      const res = await analyzeInboxItemWithAi(
        { title: item.title, content: item.content, url: item.url },
        {
          pillars: pillars.map(p => ({ id: p.id, title: p.title })),
          projects: projects.map(pr => ({ id: pr.id, title: pr.title, goal_id: pr.goal_id })),
        }
      );
      setAiAnalysisMap(prev => ({ ...prev, [item.id]: res }));
    } catch (err: any) {
      console.error('Error analyzing inbox item:', err);
    } finally {
      setAnalyzingItemId(null);
    }
  };

  // Apply AI Suggestion with One Click
  const handleApplyAiSuggestion = (item: InboxItem, aiRes: AiInboxAnalysisResult) => {
    const dest = aiRes.suggestedDestination;
    const targetPillar = pillars.find(p => p.id === aiRes.suggestedPillarId || p.title === aiRes.suggestedPillarTitle) || pillars[0];
    const targetProject = projects.find(pr => pr.id === aiRes.suggestedProjectId || pr.title === aiRes.suggestedProjectTitle) || projects[0];

    const enhancedItem = {
      ...item,
      title: aiRes.actionableTitle || item.title,
    };

    if (dest === 'task' || dest === 'project') {
      onConvertToTask(enhancedItem, targetProject?.id || projects[0]?.id);
    } else if (dest === 'vault') {
      onConvertToVault(enhancedItem, targetPillar?.id || pillars[0]?.id);
    } else if (dest === 'habit') {
      onConvertToHabit(enhancedItem, targetPillar?.id || pillars[0]?.id);
    }
  };

  const sourceMeta: Record<InboxSourceType, { label: string; icon: React.ReactNode }> = {
    idea: { label: 'فكرة', icon: <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> },
    task_seed: { label: 'بذرة مهمة', icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" /> },
    reference: { label: 'مرجع', icon: <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> },
    question: { label: 'سؤال', icon: <HelpCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> },
    link: { label: 'رابط', icon: <LinkIcon className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" /> },
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      
      {/* 1. Sleek, Compact Editorial Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#e8e4db] dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ebf4f0] dark:bg-emerald-950 text-[#174235] dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-[#1a2420] dark:text-slate-100">صندوق الوارد</h1>
                <span className="text-xs font-mono text-[#78857e] dark:text-slate-400 tabular-nums">
                  ({pendingCount} بانتظار الفرز)
                </span>
              </div>
              <p className="text-xs text-[#6e7b74] dark:text-slate-400">
                التقط كل الأفكار والالتزامات فوراً لتصفية الذهن، واستخدم الذكاء الاصطناعي لتوجيهها لمسارها المناسب.
              </p>
            </div>
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center bg-[#f4f2ec] dark:bg-slate-800 p-0.5 rounded-xl text-xs shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setFilterTab('inbox')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterTab === 'inbox'
                  ? 'bg-white dark:bg-slate-700 text-[#174235] dark:text-emerald-300 shadow-2xs font-semibold'
                  : 'text-[#637068] dark:text-slate-400 hover:text-[#1a2420]'
              }`}
            >
              في الصندوق <span className="font-mono tabular-nums text-[11px]">({pendingCount})</span>
            </button>
            <button
              onClick={() => setFilterTab('processed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterTab === 'processed'
                  ? 'bg-white dark:bg-slate-700 text-[#174235] dark:text-emerald-300 shadow-2xs font-semibold'
                  : 'text-[#637068] dark:text-slate-400 hover:text-[#1a2420]'
              }`}
            >
              المفرزة <span className="font-mono tabular-nums text-[11px]">({processedCount})</span>
            </button>
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-[#174235] dark:text-emerald-300 shadow-2xs font-semibold'
                  : 'text-[#637068] dark:text-slate-400 hover:text-[#1a2420]'
              }`}
            >
              الكل <span className="font-mono tabular-nums text-[11px]">({inboxItems.length})</span>
            </button>
          </div>
        </div>

        {/* Rapid Capture Form - Frictionless & Streamlined */}
        <form onSubmit={handleQuickAdd} className="bg-[#f8f7f4] dark:bg-slate-800/80 border border-[#e8e4db] dark:border-slate-700 rounded-xl p-2.5 sm:p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              required
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="اكتب فكرة، التزاماً، أو رابطاً واضغط Enter للإيداع السريع..."
              className="flex-1 bg-white dark:bg-slate-900 border border-[#d8d4cc] dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-[#1a2420] dark:text-slate-100 outline-hidden focus:border-[#174235] focus:ring-1 focus:ring-[#174235]/20 placeholder:text-[#8a968f]"
            />
            
            <select
              value={quickSourceType}
              onChange={(e) => setQuickSourceType(e.target.value as InboxSourceType)}
              className="bg-white dark:bg-slate-900 border border-[#d8d4cc] dark:border-slate-700 rounded-lg py-2 px-2.5 text-xs font-bold text-[#174235] dark:text-emerald-300 outline-hidden cursor-pointer"
            >
              <option value="idea">💡 فكرة</option>
              <option value="task_seed">⚡ مهمة</option>
              <option value="reference">📄 مرجع</option>
              <option value="question">❓ سؤال</option>
              <option value="link">🔗 رابط</option>
            </select>

            <button
              type="button"
              onClick={toggleVoiceDictation}
              className={`p-2 rounded-lg transition-all cursor-pointer border ${
                isListeningDirect
                  ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                  : 'bg-white dark:bg-slate-900 text-[#56635c] dark:text-slate-300 border-[#d8d4cc] dark:border-slate-700 hover:text-[#174235]'
              }`}
              title={isListeningDirect ? 'إيقاف الاستماع الصوتي' : 'إملاء صوتي مباشر بدون تكرار'}
            >
              {isListeningDirect ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {onOpenVoiceAi && (
              <button
                type="button"
                onClick={onOpenVoiceAi}
                className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                title="تحدث بصوتك والتحليل والتفكيك الذكي"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden md:inline">مساعد صوتي</span>
              </button>
            )}

            <button
              type="submit"
              className="px-3.5 py-2 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12352a] text-white rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إيداع</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
              className="p-2 text-[#7d8982] dark:text-slate-400 hover:text-[#1a2420] rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-[#d8d4cc] transition-colors"
              title="خيارات إضافية"
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
                className="bg-white dark:bg-slate-900 border border-[#d8d4cc] dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-[#1a2420] dark:text-slate-100 outline-hidden focus:border-[#174235]"
              />
              <input
                type="url"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="رابط خارجي https://..."
                className="bg-white dark:bg-slate-900 border border-[#d8d4cc] dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-[#1a2420] dark:text-slate-100 outline-hidden focus:border-[#174235]"
              />
            </div>
          )}
        </form>
      </div>

      {/* 2. Clean Inbox Items Feed */}
      {activeItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-[#e8e4db] dark:border-slate-800 rounded-2xl p-10 text-center text-xs text-[#7d8982] dark:text-slate-400 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#ebf4ef] dark:bg-emerald-950 text-[#174235] dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm text-[#1a2420] dark:text-slate-200">صندوق الوارد فارغ تماماً</h3>
          <p className="text-xs text-[#6e7b74] dark:text-slate-400 max-w-sm mx-auto">
            لا توجد أفكار أو مهام معلقة. كافة الالتزامات تم فرزها وتوجيهها لمساراتها الصحيحة.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-[#e8e4db] dark:border-slate-800 rounded-2xl divide-y divide-[#f0ede6] dark:divide-slate-800 shadow-2xs overflow-hidden">
          {activeItems.map((item) => {
            const meta = sourceMeta[item.source_type] || sourceMeta.idea;
            const isProcessed = item.status === 'processed';
            const aiRes = aiAnalysisMap[item.id];
            const isAnalyzingThis = analyzingItemId === item.id;

            return (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 hover:bg-[#faf9f6] dark:hover:bg-slate-800/60 transition-colors space-y-2 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Content & Metadata */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-[#78857e] dark:text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-[#46534d] dark:text-slate-300">
                        {meta.icon}
                        <span>{meta.label}</span>
                      </span>
                      <span className="text-[#c7c2b6] dark:text-slate-600">·</span>
                      <span className="text-[11px] font-mono tabular-nums">
                        {new Date(item.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isProcessed && (
                        <>
                          <span className="text-[#c7c2b6] dark:text-slate-600">·</span>
                          <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">تم الفرز والتحويل</span>
                        </>
                      )}
                    </div>

                    <h3 className={`text-xs sm:text-sm font-medium ${isProcessed ? 'text-[#7d8982] dark:text-slate-500 line-through' : 'text-[#1a2420] dark:text-slate-100'}`}>
                      {item.title}
                    </h3>

                    {item.content && (
                      <p className="text-xs text-[#616e67] dark:text-slate-400 leading-relaxed line-clamp-2">
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

                  {/* Actions & AI Analysis Button */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    {!isProcessed && (
                      <>
                        {/* AI Analyze Button */}
                        <button
                          type="button"
                          onClick={() => handleAnalyzeWithAi(item)}
                          disabled={isAnalyzingThis}
                          className="px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="تحليل العنصر واقتراح الوجهة المثلى بالذكاء الاصطناعي"
                        >
                          {isAnalyzingThis ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-amber-600" />
                          )}
                          <span>تحليل ذكي</span>
                        </button>

                        <div className="flex items-center bg-[#f4f2ec] dark:bg-slate-800 rounded-lg p-0.5 text-xs">
                          <button
                            onClick={() => {
                              setConvertingItem(item);
                              setConvertTargetType('task');
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-[#174235] dark:text-emerald-300 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all cursor-pointer flex items-center gap-1"
                            title="تحويل لمهمة بمشروع"
                          >
                            <CheckSquare className="w-3 h-3" />
                            <span>مهمة</span>
                          </button>
                          <button
                            onClick={() => {
                              setConvertingItem(item);
                              setConvertTargetType('vault');
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-[#2c5282] dark:text-blue-300 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all cursor-pointer flex items-center gap-1"
                            title="حفظ بخزائن المعرفة"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>خزينة</span>
                          </button>
                          <button
                            onClick={() => {
                              setConvertingItem(item);
                              setConvertTargetType('habit');
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-[#8f691c] dark:text-amber-300 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all cursor-pointer flex items-center gap-1"
                            title="تحويل لعادة تحت ركيزة"
                          >
                            <Repeat className="w-3 h-3" />
                            <span>عادة</span>
                          </button>
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 text-[#9aa69f] hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* AI Suggestion Card Display if Analyzed */}
                {aiRes && !isProcessed && (
                  <div className="mt-2 p-3 bg-linear-to-r from-amber-50/80 to-emerald-50/80 dark:from-amber-950/40 dark:to-emerald-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs space-y-2 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-amber-400 text-slate-950 font-bold text-[10px]">
                          اقتراح الذكاء الاصطناعي
                        </span>
                        <span className="font-bold text-[#174235] dark:text-emerald-300">
                          {aiRes.suggestedDestination === 'task' ? '⚡ تحويل لمهمة تنفيذية' : aiRes.suggestedDestination === 'vault' ? '📚 حفظ في خزائن المعرفة' : aiRes.suggestedDestination === 'habit' ? '🔁 بناء عادة جديدة' : '📁 تأسيس مشروع'}
                        </span>
                        <span className="text-[#627369] dark:text-slate-400">
                          تحت: <strong>{aiRes.suggestedPillarTitle}</strong>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyAiSuggestion(item, aiRes)}
                        className="px-3 py-1.5 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12362b] text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                      >
                        <span>تطبيق الاقتراح والفرز الفوري</span>
                        <ArrowRight className="w-3 h-3 rotate-180" />
                      </button>
                    </div>

                    <p className="text-[11px] text-[#4d5c52] dark:text-slate-300 leading-relaxed">
                      💡 <strong>السبب:</strong> {aiRes.reasoning}
                    </p>

                    {aiRes.actionableTitle && aiRes.actionableTitle !== item.title && (
                      <p className="text-[11px] text-[#174235] dark:text-emerald-400 font-medium">
                        العنوان المقترح: "{aiRes.actionableTitle}"
                      </p>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Convert Item Modal */}
      {convertingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-xl border border-[#e8e4db] dark:border-slate-800 space-y-4 animate-in fade-in text-xs">
            <div className="flex items-center justify-between border-b border-[#f0ede6] dark:border-slate-800 pb-3">
              <h3 className="font-semibold text-sm text-[#1a2420] dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
                <span>توجيه وفرز العنصر</span>
              </h3>
              <button
                onClick={() => setConvertingItem(null)}
                className="text-[#85928a] hover:text-[#1a2420] p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#f8f7f4] dark:bg-slate-800 p-3 rounded-xl border border-[#ece8df] dark:border-slate-700">
              <span className="text-[11px] text-[#78857e] dark:text-slate-400 block">العنصر المراد فرزه:</span>
              <p className="font-medium text-[#1a2420] dark:text-slate-100 mt-0.5">{convertingItem.title}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-medium text-[#35403a] dark:text-slate-300 mb-1.5">المسار المستهدف:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConvertTargetType('task')}
                    className={`py-2 px-2 rounded-xl text-xs font-medium text-center border cursor-pointer transition-all ${
                      convertTargetType === 'task'
                        ? 'bg-[#174235] dark:bg-emerald-700 text-white border-[#174235]'
                        : 'bg-white dark:bg-slate-800 text-[#4a554f] dark:text-slate-300 border-[#d8d4cc] dark:border-slate-700 hover:bg-[#faf9f6]'
                    }`}
                  >
                    ⚡ مهمة بمشروع
                  </button>
                  <button
                    type="button"
                    onClick={() => setConvertTargetType('vault')}
                    className={`py-2 px-2 rounded-xl text-xs font-medium text-center border cursor-pointer transition-all ${
                      convertTargetType === 'vault'
                        ? 'bg-[#174235] dark:bg-emerald-700 text-white border-[#174235]'
                        : 'bg-white dark:bg-slate-800 text-[#4a554f] dark:text-slate-300 border-[#d8d4cc] dark:border-slate-700 hover:bg-[#faf9f6]'
                    }`}
                  >
                    📚 خزينة معرفة
                  </button>
                  <button
                    type="button"
                    onClick={() => setConvertTargetType('habit')}
                    className={`py-2 px-2 rounded-xl text-xs font-medium text-center border cursor-pointer transition-all ${
                      convertTargetType === 'habit'
                        ? 'bg-[#174235] dark:bg-emerald-700 text-white border-[#174235]'
                        : 'bg-white dark:bg-slate-800 text-[#4a554f] dark:text-slate-300 border-[#d8d4cc] dark:border-slate-700 hover:bg-[#faf9f6]'
                    }`}
                  >
                    🔁 عادة بركيزة
                  </button>
                </div>
              </div>

              {convertTargetType === 'task' && (
                <div>
                  <label className="block font-medium text-[#35403a] dark:text-slate-300 mb-1">المشروع التنفيذي الحاضن:</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full rounded-xl py-2 px-3 border border-[#d8d4cc] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden font-medium"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {(convertTargetType === 'vault' || convertTargetType === 'habit') && (
                <div>
                  <label className="block font-medium text-[#35403a] dark:text-slate-300 mb-1">الركيزة المرتبطة:</label>
                  <select
                    value={selectedPillarId}
                    onChange={(e) => setSelectedPillarId(e.target.value)}
                    className="w-full rounded-xl py-2 px-3 border border-[#d8d4cc] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden font-medium"
                  >
                    {pillars.map((p) => (
                      <option key={p.id} value={p.id}>{p.title} ({p.pillar_group})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f0ede6] dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConvertingItem(null)}
                className="px-3.5 py-1.5 bg-[#f4f2ec] dark:bg-slate-800 hover:bg-[#ece8de] text-[#4a554f] dark:text-slate-300 rounded-xl font-medium cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteConvert}
                className="px-4 py-1.5 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12352a] text-white rounded-xl font-medium shadow-xs cursor-pointer transition-all"
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
