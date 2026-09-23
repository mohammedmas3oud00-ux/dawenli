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
  ChevronUp
} from 'lucide-react';
import { CustomSelect } from './CustomSelect';

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
    idea: { label: 'فكرة', icon: <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> },
    task_seed: { label: 'بذرة مهمة', icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-700" /> },
    reference: { label: 'مرجع', icon: <FileText className="w-3.5 h-3.5 text-blue-600" /> },
    question: { label: 'سؤال', icon: <HelpCircle className="w-3.5 h-3.5 text-purple-600" /> },
    link: { label: 'رابط', icon: <LinkIcon className="w-3.5 h-3.5 text-stone-600" /> },
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      
      {/* 1. Sleek, Compact Editorial Header */}
      <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ebf4f0] text-[#174235] flex items-center justify-center shrink-0">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-[#1a2420]">صندوق الوارد (GTD Inbox)</h1>
                <span className="text-xs font-mono text-[#78857e] tabular-nums">
                  ({pendingCount} بانتظار الفرز)
                </span>
              </div>
              <p className="text-xs text-[#6e7b74]">
                التقط كل الأفكار والالتزامات فوراً لتصفية الذهن، ثم وجّهها لمسارها المناسب.
              </p>
            </div>
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center bg-[#f4f2ec] p-0.5 rounded-xl text-xs shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setFilterTab('inbox')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterTab === 'inbox'
                  ? 'bg-white text-[#174235] shadow-2xs font-semibold'
                  : 'text-[#637068] hover:text-[#1a2420]'
              }`}
            >
              في الصندوق <span className="font-mono tabular-nums text-[11px]">({pendingCount})</span>
            </button>
            <button
              onClick={() => setFilterTab('processed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterTab === 'processed'
                  ? 'bg-white text-[#174235] shadow-2xs font-semibold'
                  : 'text-[#637068] hover:text-[#1a2420]'
              }`}
            >
              المفرزة <span className="font-mono tabular-nums text-[11px]">({processedCount})</span>
            </button>
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-white text-[#174235] shadow-2xs font-semibold'
                  : 'text-[#637068] hover:text-[#1a2420]'
              }`}
            >
              الكل <span className="font-mono tabular-nums text-[11px]">({inboxItems.length})</span>
            </button>
          </div>
        </div>

        {/* Rapid Capture Form - Frictionless & Streamlined */}
        <form onSubmit={handleQuickAdd} className="bg-[#f8f7f4] border border-[#e8e4db] rounded-xl p-2.5 sm:p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              required
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="اكتب فكرة، التزاماً، أو رابطاً واضغط Enter للإيداع السريع..."
              className="flex-1 bg-white border border-[#d8d4cc] rounded-lg px-3 py-2 text-xs text-[#1a2420] outline-hidden focus:border-[#174235] focus:ring-1 focus:ring-[#174235]/20 placeholder:text-[#8a968f]"
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
              buttonClassName="rounded-lg py-2 px-2.5 bg-white border-[#d8d4cc] hover:border-[#174235]"
              className="shrink-0"
              size="sm"
            />

            <button
              type="submit"
              className="px-3.5 py-2 bg-[#174235] hover:bg-[#12352a] text-white rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إيداع</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
              className="p-2 text-[#7d8982] hover:text-[#1a2420] rounded-lg hover:bg-white border border-transparent hover:border-[#d8d4cc] transition-colors"
              title="خيارات إضافية (سياق، رابط)"
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
                className="bg-white border border-[#d8d4cc] rounded-lg px-3 py-1.5 text-xs text-[#1a2420] outline-hidden focus:border-[#174235]"
              />
              <input
                type="url"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="رابط خارجي https://..."
                className="bg-white border border-[#d8d4cc] rounded-lg px-3 py-1.5 text-xs text-[#1a2420] outline-hidden focus:border-[#174235]"
              />
            </div>
          )}
        </form>
      </div>

      {/* 2. Clean Inbox Items Feed */}
      {activeItems.length === 0 ? (
        <div className="bg-white border border-[#e8e4db] rounded-2xl p-10 text-center text-xs text-[#7d8982] space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#ebf4f0] text-[#174235] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm text-[#1a2420]">صندوق الوارد نظيف تماماً (Inbox Zero)</h3>
          <p className="text-xs text-[#6e7b74] max-w-sm mx-auto">
            لا توجد أفكار أو مهام معلقة. كافة الالتزامات تم فرزها وتوجيهها لمساراتها الصحيحة.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#e8e4db] rounded-2xl divide-y divide-[#f0ede6] shadow-2xs overflow-hidden">
          {activeItems.map((item) => {
            const meta = sourceMeta[item.source_type] || sourceMeta.idea;
            const isProcessed = item.status === 'processed';

            return (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 hover:bg-[#faf9f6] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Content & Metadata */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-[#78857e]">
                    <span className="flex items-center gap-1 font-medium text-[#46534d]">
                      {meta.icon}
                      <span>{meta.label}</span>
                    </span>
                    <span className="text-[#c7c2b6]">·</span>
                    <span className="text-[11px] font-mono tabular-nums">
                      {new Date(item.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isProcessed && (
                      <>
                        <span className="text-[#c7c2b6]">·</span>
                        <span className="text-[11px] text-emerald-800 font-medium">تم الفرز والتحويل</span>
                      </>
                    )}
                  </div>

                  <h3 className={`text-xs sm:text-sm font-medium ${isProcessed ? 'text-[#7d8982] line-through' : 'text-[#1a2420]'}`}>
                    {item.title}
                  </h3>

                  {item.content && (
                    <p className="text-xs text-[#616e67] leading-relaxed line-clamp-2">
                      {item.content}
                    </p>
                  )}

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#174235] hover:underline font-mono"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-xs">{item.url}</span>
                    </a>
                  )}
                </div>

                {/* Minimalist Action Strip */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {!isProcessed && (
                    <div className="flex items-center bg-[#f4f2ec] rounded-lg p-0.5 text-xs">
                      <button
                        onClick={() => {
                          setConvertingItem(item);
                          setConvertTargetType('task');
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-[#174235] hover:bg-white rounded-md transition-all cursor-pointer flex items-center gap-1"
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
                        className="px-2.5 py-1 text-xs font-medium text-[#2c5282] hover:bg-white rounded-md transition-all cursor-pointer flex items-center gap-1"
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
                        className="px-2.5 py-1 text-xs font-medium text-[#8f691c] hover:bg-white rounded-md transition-all cursor-pointer flex items-center gap-1"
                        title="تحويل لعادة تحت ركيزة"
                      >
                        <Repeat className="w-3 h-3" />
                        <span>عادة</span>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-[#9aa69f] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="حذف"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-[#e8e4db] space-y-4 animate-in fade-in text-xs">
            <div className="flex items-center justify-between border-b border-[#f0ede6] pb-3">
              <h3 className="font-semibold text-sm text-[#1a2420] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#174235]" />
                <span>توجيه وفرز العنصر</span>
              </h3>
              <button
                onClick={() => setConvertingItem(null)}
                className="text-[#85928a] hover:text-[#1a2420] p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#f8f7f4] p-3 rounded-xl border border-[#ece8df]">
              <span className="text-[11px] text-[#78857e] block">العنصر المراد فرزه:</span>
              <p className="font-medium text-[#1a2420] mt-0.5">{convertingItem.title}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-medium text-[#35403a] mb-1.5">المسار المستهدف:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConvertTargetType('task')}
                    className={`py-2 px-2 rounded-xl text-xs font-medium text-center border cursor-pointer transition-all ${
                      convertTargetType === 'task'
                        ? 'bg-[#174235] text-white border-[#174235]'
                        : 'bg-white text-[#4a554f] border-[#d8d4cc] hover:bg-[#faf9f6]'
                    }`}
                  >
                    ⚡ مهمة بمشروع
                  </button>
                  <button
                    type="button"
                    onClick={() => setConvertTargetType('vault')}
                    className={`py-2 px-2 rounded-xl text-xs font-medium text-center border cursor-pointer transition-all ${
                      convertTargetType === 'vault'
                        ? 'bg-[#174235] text-white border-[#174235]'
                        : 'bg-white text-[#4a554f] border-[#d8d4cc] hover:bg-[#faf9f6]'
                    }`}
                  >
                    📚 خزينة معرفة
                  </button>
                  <button
                    type="button"
                    onClick={() => setConvertTargetType('habit')}
                    className={`py-2 px-2 rounded-xl text-xs font-medium text-center border cursor-pointer transition-all ${
                      convertTargetType === 'habit'
                        ? 'bg-[#174235] text-white border-[#174235]'
                        : 'bg-white text-[#4a554f] border-[#d8d4cc] hover:bg-[#faf9f6]'
                    }`}
                  >
                    🔁 عادة بركيزة
                  </button>
                </div>
              </div>

              {convertTargetType === 'task' && (
                <div>
                  <label className="block font-medium text-[#35403a] mb-1">المشروع التنفيذي الحاضن:</label>
                  <CustomSelect
                    value={selectedProjectId}
                    onChange={(val) => setSelectedProjectId(val)}
                    options={projects.map((p) => ({ value: p.id, label: p.title }))}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3"
                    dropdownClassName="w-full"
                  />
                </div>
              )}

              {(convertTargetType === 'vault' || convertTargetType === 'habit') && (
                <div>
                  <label className="block font-medium text-[#35403a] mb-1">الركيزة المرتبطة:</label>
                  <CustomSelect
                    value={selectedPillarId}
                    onChange={(val) => setSelectedPillarId(val)}
                    options={pillars.map((p) => ({ value: p.id, label: `${p.title} (${p.pillar_group})` }))}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3"
                    dropdownClassName="w-full"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f0ede6]">
              <button
                type="button"
                onClick={() => setConvertingItem(null)}
                className="px-3.5 py-1.5 bg-[#f4f2ec] hover:bg-[#ece8de] text-[#4a554f] rounded-xl font-medium cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteConvert}
                className="px-4 py-1.5 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl font-medium shadow-xs cursor-pointer transition-all"
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
