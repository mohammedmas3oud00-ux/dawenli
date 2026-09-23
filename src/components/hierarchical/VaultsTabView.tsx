import React, { useState } from 'react';
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
    books: { label: 'كتاب / ملخص', icon: <Bookmark className="w-3.5 h-3.5 text-amber-700" /> },
    notes: { label: 'مذكرة / فكرة', icon: <FileText className="w-3.5 h-3.5 text-emerald-800" /> },
    resources: { label: 'مرجع / رابط', icon: <LinkIcon className="w-3.5 h-3.5 text-blue-700" /> },
    templates: { label: 'قالب تشغيلي', icon: <BookOpen className="w-3.5 h-3.5 text-purple-700" /> },
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      
      {/* 1. Compact Editorial Header */}
      <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ebf4f0] text-[#174235] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-[#1a2420]">
                  خزائن المعرفة (PPV Vaults)
                </h1>
                <span className="text-xs font-mono text-[#78857e] tabular-nums">
                  ({vaults.length} عناصر معرفية)
                </span>
              </div>
              <p className="text-xs text-[#6e7b74]">
                مستودعات معرفية منظمة تغذي المشاريع والركائز: ملخصات، مذكرات فكرية، وقوالب.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة للخزينة</span>
          </button>
        </div>

        {/* Categories Tab & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-[#f0ede6]">
          {/* Segmented Category Filter */}
          <div className="flex items-center bg-[#f4f2ec] p-0.5 rounded-xl text-xs overflow-x-auto">
            <button
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedTypeFilter === 'all'
                  ? 'bg-white text-[#174235] shadow-2xs font-semibold'
                  : 'text-[#637068] hover:text-[#1a2420]'
              }`}
            >
              الكل <span className="font-mono tabular-nums text-[11px]">({vaults.length})</span>
            </button>
            <button
              onClick={() => setSelectedTypeFilter('books')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedTypeFilter === 'books'
                  ? 'bg-white text-[#174235] shadow-2xs font-semibold'
                  : 'text-[#637068] hover:text-[#1a2420]'
              }`}
            >
              الكتب
            </button>
            <button
              onClick={() => setSelectedTypeFilter('notes')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedTypeFilter === 'notes'
                  ? 'bg-white text-[#174235] shadow-2xs font-semibold'
                  : 'text-[#637068] hover:text-[#1a2420]'
              }`}
            >
              الملاحظات
            </button>
            <button
              onClick={() => setSelectedTypeFilter('resources')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedTypeFilter === 'resources'
                  ? 'bg-white text-[#174235] shadow-2xs font-semibold'
                  : 'text-[#637068] hover:text-[#1a2420]'
              }`}
            >
              الموارد
            </button>
            <button
              onClick={() => setSelectedTypeFilter('templates')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedTypeFilter === 'templates'
                  ? 'bg-white text-[#174235] shadow-2xs font-semibold'
                  : 'text-[#637068] hover:text-[#1a2420]'
              }`}
            >
              القوالب
            </button>
          </div>

          {/* Search & Pillar Select */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#85928a]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في الخزائن..."
                className="w-full bg-[#f8f7f4] border border-[#d8d4cc] rounded-lg pr-7 pl-2.5 py-1.5 text-xs text-[#1a2420] outline-hidden focus:border-[#174235]"
              />
            </div>

            <CustomSelect
              value={selectedPillarFilter}
              onChange={(val) => setSelectedPillarFilter(val)}
              options={[
                { value: 'all', label: 'كل الركائز' },
                ...pillars.map((p) => ({ value: p.id, label: p.title })),
              ]}
              size="xs"
              buttonClassName="rounded-lg py-1.5 px-2 bg-[#f8f7f4] border-[#d8d4cc]"
            />
          </div>
        </div>
      </div>

      {/* 2. Knowledge Vaults Grid - Zero-Pill High Craft Design */}
      {filteredVaults.length === 0 ? (
        <div className="bg-white border border-[#e8e4db] rounded-2xl p-10 text-center text-xs text-[#7d8982]">
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
                className="bg-white border border-[#e8e4db] hover:border-[#174235]/40 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  {/* Clean Inline Typographic Metadata (Anti-Pill) */}
                  <div className="flex items-center justify-between text-xs text-[#78857e]">
                    <div className="flex items-center gap-1.5 font-medium">
                      {config.icon}
                      <span className="text-[#35403a]">{config.label}</span>
                      {pillar && (
                        <>
                          <span className="text-[#d8d4cc]">·</span>
                          <span className="text-[#616e67]">{pillar.title}</span>
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
                    <h3 className="text-sm font-semibold text-[#1a2420] line-clamp-1 group-hover:text-[#174235] transition-colors">
                      {item.title}
                    </h3>
                    {item.author_or_source && (
                      <span className="text-[11px] text-[#78857e] block font-medium mt-0.5">
                        بواسطة: {item.author_or_source}
                      </span>
                    )}
                  </div>

                  {item.summary && (
                    <p className="text-xs text-[#525f58] line-clamp-2 leading-relaxed bg-[#faf9f6] p-2.5 rounded-xl border border-[#f0ede6]">
                      {item.summary}
                    </p>
                  )}

                  {/* Connected Project Link */}
                  {project && (
                    <div className="text-[11px] text-[#2c5282] font-medium flex items-center gap-1 pt-0.5">
                      <span>📁 مشروع مرتبط:</span>
                      <span className="font-semibold">{project.title}</span>
                    </div>
                  )}

                  {/* Editorial Text Tags (Anti-Badge) */}
                  {item.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[11px] text-[#78857e]">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="hover:text-[#174235] transition-colors">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Action Strip */}
                <div className="flex items-center justify-between pt-2.5 border-t border-[#f0ede6] text-xs">
                  <button
                    onClick={() => setReadingItem(item)}
                    className="flex items-center gap-1.5 font-medium text-[#174235] hover:underline cursor-pointer"
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
                        className="p-1.5 text-[#85928a] hover:text-[#174235] rounded-lg hover:bg-[#ebf4f0] transition-colors"
                        title="فتح الرابط"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-[#85928a] hover:text-[#1a2420] rounded-lg hover:bg-[#f4f2ec] transition-colors cursor-pointer"
                      title="تعديل"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteVaultItem(item.id)}
                      className="p-1.5 text-[#85928a] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="حذف"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-[#fcfbfa] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#e8e4db] animate-in fade-in">
            <div className="p-5 border-b border-[#e8e4db] flex items-center justify-between bg-white rounded-t-2xl">
              <div>
                <span className="text-[11px] text-[#78857e] block font-medium">
                  {typeConfig[readingItem.vault_type]?.label} · {pillars.find(p => p.id === readingItem.pillar_id)?.title}
                </span>
                <h2 className="text-base font-bold text-[#1a2420] mt-0.5">{readingItem.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyContent(readingItem.content || readingItem.summary || '')}
                  className="p-2 text-[#78857e] hover:text-[#174235] rounded-lg hover:bg-[#f4f2ec] cursor-pointer"
                  title="نسخ المحتوى"
                >
                  {copiedContent ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setReadingItem(null)}
                  className="p-2 text-[#78857e] hover:text-[#1a2420] rounded-lg hover:bg-[#f4f2ec] cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm text-[#2d3731] leading-relaxed font-sans">
              {readingItem.summary && (
                <div className="bg-[#faf8f4] p-4 rounded-xl border border-[#ece8df] italic text-[#4a554f]">
                  <span className="font-semibold not-italic block text-xs text-[#78857e] mb-1">الملخص التنفيذي:</span>
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl border border-[#e8e4db] animate-in fade-in text-xs">
            <div className="p-4 border-b border-[#f0ede6] flex items-center justify-between">
              <h3 className="font-semibold text-sm text-[#1a2420]">
                {editingItem ? 'تعديل عنصر المعرفة' : 'إيداع عنصر جديد في الخزائن'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-[#85928a] hover:text-[#1a2420] p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-4 overflow-y-auto space-y-3 flex-1">
              <div>
                <label className="block font-medium text-[#35403a] mb-1">العنوان:</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="عنوان الكتاب، الفكرة، أو القالب..."
                  className="w-full p-2 bg-white border border-[#d8d4cc] rounded-xl text-xs text-[#1a2420] outline-hidden focus:border-[#174235]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-[#35403a] mb-1">النوع:</label>
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
                    buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                    dropdownClassName="w-full"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#35403a] mb-1">الركيزة المرتبطة:</label>
                  <CustomSelect
                    value={formPillarId}
                    onChange={(val) => setFormPillarId(val)}
                    options={pillars.map((p) => ({ value: p.id, label: p.title }))}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                    dropdownClassName="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-[#35403a] mb-1">المؤلف أو المصدر:</label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="اسم الكاتب أو المرجع"
                    className="w-full p-2 bg-white border border-[#d8d4cc] rounded-xl text-xs text-[#1a2420] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#35403a] mb-1">مشروع مرتبط (اختياري):</label>
                  <CustomSelect
                    value={formProjectId}
                    onChange={(val) => setFormProjectId(val)}
                    options={[
                      { value: '', label: 'بدون مشروع مباشر' },
                      ...projects.map((pr) => ({ value: pr.id, label: pr.title })),
                    ]}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                    dropdownClassName="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#35403a] mb-1">الرابط المرجعي (اختياري):</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2 bg-white border border-[#d8d4cc] rounded-xl text-xs text-[#1a2420] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-[#35403a] mb-1">الملخص السريع:</label>
                <textarea
                  rows={2}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="فكرة المادة في جملتين..."
                  className="w-full p-2 bg-white border border-[#d8d4cc] rounded-xl text-xs text-[#1a2420] outline-hidden focus:border-[#174235]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#35403a] mb-1">المحتوى التفصيلي والملاحظات:</label>
                <textarea
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="اكتب الملاحظات، النقاط الجوهرية، أو نصوص الاقتباسات هنا..."
                  className="w-full p-2 bg-white border border-[#d8d4cc] rounded-xl text-xs text-[#1a2420] outline-hidden focus:border-[#174235] font-sans leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-[#35403a] mb-1">الوسوم (مفصولة بفاصلة):</label>
                  <input
                    type="text"
                    value={formTagsStr}
                    onChange={(e) => setFormTagsStr(e.target.value)}
                    placeholder="إنتاجية, فكر, كتابة"
                    className="w-full p-2 bg-white border border-[#d8d4cc] rounded-xl text-xs text-[#1a2420] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#35403a] mb-1">التقييم:</label>
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
                    buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                    dropdownClassName="w-full"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f0ede6]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3.5 py-1.5 bg-[#f4f2ec] hover:bg-[#ece8de] text-[#4a554f] rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl font-medium shadow-xs cursor-pointer"
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
