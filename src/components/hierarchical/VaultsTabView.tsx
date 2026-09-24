import React, { useState, useEffect } from 'react';
import { VaultItem, VaultType, Pillar, Project } from '../../types/hierarchical';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Bookmark, 
  FileText, 
  Link as LinkIcon, 
  Trash2, 
  Edit2, 
  ExternalLink, 
  Star, 
  Eye, 
  Copy, 
  Check 
} from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface VaultsTabViewProps {
  vaults: VaultItem[];
  pillars: Pillar[];
  projects: Project[];
  onSaveVaultItem: (item: Partial<VaultItem>) => void;
  onDeleteVaultItem: (vaultId: string) => void;
}

export const VaultsTabView: React.FC<VaultsTabViewProps> = ({
  vaults,
  pillars,
  projects,
  onSaveVaultItem,
  onDeleteVaultItem,
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [readingItem, setReadingItem] = useState<VaultItem | null>(null);
  const [copiedContent, setCopiedContent] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<VaultType>('notes');
  const [formPillarId, setFormPillarId] = useState(pillars[0]?.id || '');
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTagsStr, setFormTagsStr] = useState('');
  const [formRating, setFormRating] = useState<number>(5);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (readingItem) setReadingItem(null);
        else if (isFormOpen) setIsFormOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingItem, isFormOpen]);

  const filteredVaults = vaults.filter((v) => {
    if (selectedTypeFilter !== 'all' && v.vault_type !== selectedTypeFilter) return false;
    if (selectedPillarFilter !== 'all' && v.pillar_id !== selectedPillarFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = v.title.toLowerCase().includes(q);
      const matchSummary = v.summary?.toLowerCase().includes(q);
      const matchAuthor = v.author_or_source?.toLowerCase().includes(q);
      const matchTags = v.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchSummary && !matchAuthor && !matchTags) return false;
    }
    return true;
  });

  const handleOpenNew = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormType('notes');
    setFormPillarId(pillars[0]?.id || '');
    setFormProjectId('');
    setFormAuthor('');
    setFormUrl('');
    setFormSummary('');
    setFormContent('');
    setFormTagsStr('');
    setFormRating(5);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: VaultItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormType(item.vault_type);
    setFormPillarId(item.pillar_id);
    setFormProjectId(item.project_id || '');
    setFormAuthor(item.author_or_source || '');
    setFormUrl(item.url || '');
    setFormSummary(item.summary || '');
    setFormContent(item.content || '');
    setFormTagsStr(item.tags?.join(', ') || '');
    setFormRating(item.rating || 5);
    setIsFormOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const tags = formTagsStr
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    onSaveVaultItem({
      ...(editingItem ? { id: editingItem.id } : {}),
      title: formTitle.trim(),
      vault_type: formType,
      pillar_id: formPillarId,
      project_id: formProjectId || null,
      author_or_source: formAuthor.trim() || undefined,
      url: formUrl.trim() || undefined,
      summary: formSummary.trim(),
      content: formContent.trim(),
      tags,
      rating: formRating,
    });

    setIsFormOpen(false);
  };

  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  const typeConfig: Record<VaultType, { label: string; icon: React.ReactNode }> = {
    books: { label: 'كتاب / ملخص', icon: <Bookmark className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> },
    notes: { label: 'مذكرة / فكرة', icon: <FileText className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" /> },
    resources: { label: 'مرجع / رابط', icon: <LinkIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> },
    templates: { label: 'قالب تشغيلي', icon: <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> },
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      
      {/* 1. Compact Header */}
      <div className="bg-white dark:bg-[#131d18] rounded-2xl border border-[#e8e4db] dark:border-[#26372d] p-4 sm:p-5 shadow-2xs space-y-3.5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#1a2420] dark:text-white">
                  خزائن المعرفة (Vaults)
                </h1>
                <span className="text-xs font-mono text-[#78857e] dark:text-[#8ea095] tabular-nums">
                  ({vaults.length} عناصر معرفية)
                </span>
              </div>
              <p className="text-xs text-[#6e7b74] dark:text-[#9bb0a3]">
                مستودعات معرفية منظمة تغذي المشاريع والمجالات: ملخصات، مذكرات فكرية، وقوالب.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة للخزينة</span>
          </button>
        </div>

        {/* Categories Tab & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-[#f0ede6] dark:border-[#223028]">
          {/* Segmented Category Filter */}
          <div className="flex items-center bg-[#f4f2ec] dark:bg-[#192620] p-0.5 rounded-xl text-xs overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedTypeFilter === 'all'
                  ? 'bg-white dark:bg-[#121c17] text-[#174235] dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-[#637068] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white'
              }`}
            >
              الكل <span className="font-mono tabular-nums text-[11px]">({vaults.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('books')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedTypeFilter === 'books'
                  ? 'bg-white dark:bg-[#121c17] text-[#174235] dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-[#637068] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white'
              }`}
            >
              الكتب
            </button>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('notes')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedTypeFilter === 'notes'
                  ? 'bg-white dark:bg-[#121c17] text-[#174235] dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-[#637068] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white'
              }`}
            >
              الملاحظات
            </button>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('resources')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedTypeFilter === 'resources'
                  ? 'bg-white dark:bg-[#121c17] text-[#174235] dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-[#637068] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white'
              }`}
            >
              المراجع
            </button>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('templates')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedTypeFilter === 'templates'
                  ? 'bg-white dark:bg-[#121c17] text-[#174235] dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-[#637068] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white'
              }`}
            >
              القوالب
            </button>
          </div>

          {/* Search & Pillar Select */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#85928a] dark:text-[#78857e]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في الخزائن..."
                className="w-full bg-[#f8f7f4] dark:bg-[#192620] border border-[#d8d4cc] dark:border-[#2d4034] rounded-lg pr-7 pl-2.5 py-1.5 text-xs text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500"
              />
            </div>

            <CustomSelect
              value={selectedPillarFilter}
              onChange={(val) => setSelectedPillarFilter(val)}
              options={[
                { value: 'all', label: 'كل المجالات' },
                ...pillars.map((p) => ({ value: p.id, label: p.title })),
              ]}
              size="xs"
              buttonClassName="rounded-lg py-1.5 px-2 bg-[#f8f7f4] dark:bg-[#192620] border-[#d8d4cc] dark:border-[#2d4034]"
            />
          </div>
        </div>
      </div>

      {/* 2. Knowledge Vaults Grid */}
      {filteredVaults.length === 0 ? (
        <div className="bg-white dark:bg-[#131d18] border border-[#e8e4db] dark:border-[#26372d] rounded-2xl p-10 text-center text-xs text-[#7d8982] dark:text-[#9bb0a3]">
          لا توجد عناصر مطابقة في الخزائن حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredVaults.map((item) => {
            const config = typeConfig[item.vault_type] || typeConfig.notes;
            const pillar = pillars.find(p => p.id === item.pillar_id);
            const project = projects.find(pr => pr.id === item.project_id);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#131d18] border border-[#e8e4db] dark:border-[#26372d] hover:border-[#174235]/40 dark:hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  {/* Clean Inline Typographic Metadata */}
                  <div className="flex items-center justify-between text-xs text-[#78857e] dark:text-[#8ea095]">
                    <div className="flex items-center gap-1.5 font-medium">
                      {config.icon}
                      <span className="text-[#35403a] dark:text-[#b4c7bd] font-semibold">{config.label}</span>
                      {pillar && (
                        <>
                          <span className="text-[#d8d4cc] dark:text-[#384a3e]">·</span>
                          <span className="text-[#616e67] dark:text-[#8ea095]">{pillar.title}</span>
                        </>
                      )}
                    </div>

                    {item.rating && (
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#1a2420] dark:text-white line-clamp-1 group-hover:text-[#174235] dark:group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h3>
                    {item.author_or_source && (
                      <span className="text-[11px] text-[#78857e] dark:text-[#8ea095] block font-medium mt-0.5">
                        بواسطة: {item.author_or_source}
                      </span>
                    )}
                  </div>

                  {item.summary && (
                    <p className="text-xs text-[#525f58] dark:text-[#9bb0a3] line-clamp-2 leading-relaxed bg-[#faf9f6] dark:bg-[#18261e] p-2.5 rounded-xl border border-[#f0ede6] dark:border-[#223328]">
                      {item.summary}
                    </p>
                  )}

                  {/* Connected Project Link */}
                  {project && (
                    <div className="text-[11px] text-[#2c5282] dark:text-blue-400 font-medium flex items-center gap-1 pt-0.5">
                      <span>📁 مشروع مرتبط:</span>
                      <span className="font-bold">{project.title}</span>
                    </div>
                  )}

                  {/* Editorial Text Tags */}
                  {item.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[11px] text-[#78857e] dark:text-[#8ea095]">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="hover:text-[#174235] dark:hover:text-emerald-400 transition-colors">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Action Strip */}
                <div className="flex items-center justify-between pt-2.5 border-t border-[#f0ede6] dark:border-[#223028] text-xs">
                  <button
                    type="button"
                    onClick={() => setReadingItem(item)}
                    className="flex items-center gap-1.5 font-bold text-[#174235] dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>قراءة المحتوى</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-[#85928a] dark:text-[#8ea095] hover:text-[#174235] dark:hover:text-white rounded-lg hover:bg-[#ebf4f0] dark:hover:bg-[#1e2f24] transition-colors"
                        title="فتح الرابط"
                        aria-label="فتح الرابط"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-[#85928a] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white rounded-lg hover:bg-[#f4f2ec] dark:hover:bg-[#203026] transition-colors cursor-pointer"
                      title="تعديل"
                      aria-label="تعديل المادة"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteVaultItem(item.id)}
                      className="p-1.5 text-[#85928a] dark:text-[#8ea095] hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="حذف"
                      aria-label="حذف المادة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reading Mode Drawer/Modal */}
      {readingItem && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reading-item-title"
        >
          <div className="bg-[#fcfbfa] dark:bg-[#131d18] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#e8e4db] dark:border-[#26372d] animate-in fade-in transition-colors">
            <div className="p-5 border-b border-[#e8e4db] dark:border-[#26372d] flex items-center justify-between bg-white dark:bg-[#16211a] rounded-t-2xl">
              <div>
                <span className="text-[11px] text-[#78857e] dark:text-[#8ea095] block font-medium">
                  {typeConfig[readingItem.vault_type]?.label} · {pillars.find(p => p.id === readingItem.pillar_id)?.title}
                </span>
                <h2 id="reading-item-title" className="text-base font-bold text-[#1a2420] dark:text-white mt-0.5">{readingItem.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyContent(readingItem.content || readingItem.summary || '')}
                  className="p-2 text-[#78857e] dark:text-[#8ea095] hover:text-[#174235] dark:hover:text-emerald-400 rounded-lg hover:bg-[#f4f2ec] dark:hover:bg-[#203026] cursor-pointer"
                  title="نسخ المحتوى"
                  aria-label="نسخ المحتوى"
                >
                  {copiedContent ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setReadingItem(null)}
                  className="p-2 text-[#78857e] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white rounded-lg hover:bg-[#f4f2ec] dark:hover:bg-[#203026] cursor-pointer"
                  aria-label="إغلاق القراءة"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm text-[#2d3731] dark:text-[#d3e2d8] leading-relaxed font-sans">
              {readingItem.summary && (
                <div className="bg-[#faf8f4] dark:bg-[#18261e] p-4 rounded-xl border border-[#ece8df] dark:border-[#223328] italic text-[#4a554f] dark:text-[#b4c7bd]">
                  <span className="font-bold not-italic block text-xs text-[#78857e] dark:text-[#8ea095] mb-1">الملخص التنفيذي:</span>
                  {readingItem.summary}
                </div>
              )}

              <div className="whitespace-pre-wrap leading-loose">
                {readingItem.content || 'لا يوجد نص تفصيلي مسجل لهذا العنصر.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Create/Edit Modal */}
      {isFormOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vault-form-title"
        >
          <div className="bg-white dark:bg-[#131d18] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl border border-[#e8e4db] dark:border-[#26372d] animate-in fade-in text-xs transition-colors">
            <div className="p-4 border-b border-[#f0ede6] dark:border-[#223028] flex items-center justify-between">
              <h3 id="vault-form-title" className="font-bold text-sm text-[#1a2420] dark:text-white">
                {editingItem ? 'تعديل عنصر المعرفة' : 'إيداع عنصر جديد في الخزائن'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)} 
                className="text-[#85928a] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white p-1 rounded cursor-pointer"
                aria-label="إغلاق النافذة"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-4 overflow-y-auto space-y-3 flex-1">
              <div>
                <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">العنوان:</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="عنوان الكتاب، الفكرة، أو القالب..."
                  className="w-full p-2 bg-white dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">النوع:</label>
                  <CustomSelect<VaultType>
                    value={formType}
                    onChange={(val) => setFormType(val)}
                    options={[
                      { value: 'books', label: 'كتاب / ملخص', icon: '📚' },
                      { value: 'notes', label: 'مذكرة فكرية', icon: '📝' },
                      { value: 'resources', label: 'مورد / أداة', icon: '🔗' },
                      { value: 'templates', label: 'قالب تشغيلي', icon: '📋' },
                    ]}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3 text-xs bg-white dark:bg-[#121c17] border-[#d8d4cc] dark:border-[#2d4034]"
                    dropdownClassName="w-full"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">المجال المرتبط:</label>
                  <CustomSelect
                    value={formPillarId}
                    onChange={(val) => setFormPillarId(val)}
                    options={pillars.map((p) => ({ value: p.id, label: p.title }))}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3 text-xs bg-white dark:bg-[#121c17] border-[#d8d4cc] dark:border-[#2d4034]"
                    dropdownClassName="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">المؤلف أو المصدر:</label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="اسم الكاتب أو المرجع"
                    className="w-full p-2 bg-white dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs text-[#1a2420] dark:text-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">مشروع مرتبط (اختياري):</label>
                  <CustomSelect
                    value={formProjectId}
                    onChange={(val) => setFormProjectId(val)}
                    options={[
                      { value: '', label: 'بدون مشروع مباشر' },
                      ...projects.map((pr) => ({ value: pr.id, label: pr.title })),
                    ]}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3 text-xs bg-white dark:bg-[#121c17] border-[#d8d4cc] dark:border-[#2d4034]"
                    dropdownClassName="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">الرابط المرجعي (اختياري):</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2 bg-white dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs text-[#1a2420] dark:text-white outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">الملخص السريع:</label>
                <textarea
                  rows={2}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="فكرة المادة في جملتين..."
                  className="w-full p-2 bg-white dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">المحتوى التفصيلي والملاحظات:</label>
                <textarea
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="اكتب الملاحظات، النقاط الجوهرية، أو نصوص الاقتباسات هنا..."
                  className="w-full p-2 bg-white dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">الوسوم (مفصولة بفاصلة):</label>
                  <input
                    type="text"
                    value={formTagsStr}
                    onChange={(e) => setFormTagsStr(e.target.value)}
                    placeholder="إنتاجية, فكر, كتابة"
                    className="w-full p-2 bg-white dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs text-[#1a2420] dark:text-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">التقييم:</label>
                  <CustomSelect<number>
                    value={formRating}
                    onChange={(val) => setFormRating(val)}
                    options={[
                      { value: 5, label: '⭐⭐⭐⭐⭐ (5/5 ممتاز)' },
                      { value: 4, label: '⭐⭐⭐⭐ (4/5 جيد جداً)' },
                      { value: 3, label: '⭐⭐⭐ (3/5 متوسط)' },
                      { value: 2, label: '⭐⭐ (2/5 دون التوقعات)' },
                      { value: 1, label: '⭐ (1/5)' },
                    ]}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3 text-xs bg-white dark:bg-[#121c17] border-[#d8d4cc] dark:border-[#2d4034]"
                    dropdownClassName="w-full"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f0ede6] dark:border-[#223028]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3.5 py-1.5 bg-[#f4f2ec] dark:bg-[#192620] hover:bg-[#ece8de] dark:hover:bg-[#203026] text-[#4a554f] dark:text-[#c4d6cb] rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer transition-all"
                >
                  حفظ في الخزائن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
