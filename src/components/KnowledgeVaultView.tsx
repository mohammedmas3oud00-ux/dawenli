import React, { useState } from 'react';
import { 
  BookOpen, 
  Video, 
  GraduationCap, 
  FileText, 
  Plus, 
  Star, 
  ExternalLink, 
  Tag, 
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Pin
} from 'lucide-react';
import { KnowledgeItem, NoteIdea, Pillar } from '../types';

interface KnowledgeVaultViewProps {
  knowledge: KnowledgeItem[];
  notes: NoteIdea[];
  pillars: Pillar[];
  onAddKnowledgeItem: (item: Omit<KnowledgeItem, 'id' | 'addedAt'>) => void;
  onAddNote: (note: Omit<NoteIdea, 'id' | 'createdAt'>) => void;
  onUpdateKnowledgeStatus: (id: string, status: KnowledgeItem['status']) => void;
}

export const KnowledgeVaultView: React.FC<KnowledgeVaultViewProps> = ({
  knowledge,
  notes,
  pillars,
  onAddKnowledgeItem,
  onAddNote,
  onUpdateKnowledgeStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'books' | 'courses' | 'media' | 'notes'>('books');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Form states for adding items
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pillarId, setPillarId] = useState(pillars[0]?.id || '');
  const [status, setStatus] = useState<KnowledgeItem['status']>('in_progress');
  const [rating, setRating] = useState(5);
  const [keyTakeaway, setKeyTakeaway] = useState('');
  const [tagsStr, setTagsStr] = useState('');

  // Note form states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<NoteIdea['type']>('idea');

  const handleSaveKnowledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddKnowledgeItem({
      title: title.trim(),
      type: activeTab === 'books' ? 'book' : activeTab === 'courses' ? 'course' : 'media',
      authorOrSource: author.trim() || 'غير محدد',
      pillarId,
      status,
      rating,
      keyTakeaway: keyTakeaway.trim(),
      tags: tagsStr ? tagsStr.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });

    setTitle('');
    setAuthor('');
    setKeyTakeaway('');
    setIsAddingItem(false);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    onAddNote({
      title: noteTitle.trim(),
      content: noteContent.trim(),
      type: noteType,
      tags: tagsStr ? tagsStr.split(',').map((t) => t.trim()).filter(Boolean) : [],
      pillarId,
      pinned: false,
    });

    setNoteTitle('');
    setNoteContent('');
    setIsAddingItem(false);
  };

  const filteredKnowledge = knowledge.filter((k) => {
    if (activeTab === 'books' && k.type !== 'book') return false;
    if (activeTab === 'courses' && k.type !== 'course') return false;
    if (activeTab === 'media' && k.type !== 'media') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return k.title.toLowerCase().includes(q) || k.authorOrSource.toLowerCase().includes(q) || k.keyTakeaway.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredNotes = notes.filter((n) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-blue-900/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <span>📚</span>
              <span>Knowledge Vault · مستودع المعرفة والتعلم</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              أصول المعرفة والأفكار والملاحظات
            </h1>
            
            <p className="text-sm text-blue-200 max-w-xl leading-relaxed">
              «العلم صيد والكتابة قيده». حفظ ملخصات الكتب، الدورات، المواد الصوتية، ومحاضر الأفكار والاجتماعات في نظام موحد.
            </p>
          </div>

          <button
            onClick={() => setIsAddingItem(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة {activeTab === 'notes' ? 'فكرة / ملاحظة' : 'مرجع / كتاب'}</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'books', label: 'مستودع الكتب', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'courses', label: 'الدورات والتدريب', icon: <GraduationCap className="w-4 h-4" /> },
            { id: 'media', label: 'الوسائط والمقالات', icon: <Video className="w-4 h-4" /> },
            { id: 'notes', label: 'الملاحظات والأفكار', icon: <FileText className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setIsAddingItem(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث في المعارف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-full sm:w-56 focus:outline-hidden focus:bg-white"
          />
        </div>
      </div>

      {/* Add Item Form */}
      {isAddingItem && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-2.5">
            <h3 className="font-bold text-sm text-slate-900">
              {activeTab === 'notes' ? 'إضافة ملاحظة أو فكرة جديدة' : 'إضافة عنصر إلى مستودع المعرفة'}
            </h3>
            <button onClick={() => setIsAddingItem(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>

          {activeTab === 'notes' ? (
            <form onSubmit={handleSaveNote} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">عنوان الفكرة / الملاحظة:</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="عنوان الفكرة..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">المحتوى والتفاصيل:</label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="اكتب الأفكار والوقفات بالتفصيل..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">النوع:</label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="idea">💡 فكرة إبداعية</option>
                    <option value="note">📝 ملاحظة عامة</option>
                    <option value="meeting">👥 محضر اجتماع</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">الوسوم (مفصولة بفواصل):</label>
                  <input
                    type="text"
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                    placeholder="إنتاجية، فكر، برمجة..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddingItem(false)} className="px-3 py-1.5 text-slate-500">إلغاء</button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg">حفظ الملاحظة</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveKnowledge} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">العنوان:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="اسم الكتاب أو الدورة..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">المؤلف أو المصدر:</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="اسم المؤلف أو المنصة..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">أبرز فائدة / الخلاصة:</label>
                <textarea
                  rows={2}
                  value={keyTakeaway}
                  onChange={(e) => setKeyTakeaway(e.target.value)}
                  placeholder="الدرس الأهم الذي خرجت به..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">الحالة:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="want_to_consume">قائمة الانتظار (أريد قراءته)</option>
                    <option value="in_progress">قيد القراءة / التعلم</option>
                    <option value="completed">منتهي ومكتمل</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">التقييم:</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (ممتاز)</option>
                    <option value={4}>⭐⭐⭐⭐ (جيد جداً)</option>
                    <option value={3}>⭐⭐⭐ (متوسط)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">الركيزة:</label>
                  <select
                    value={pillarId}
                    onChange={(e) => setPillarId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {pillars.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddingItem(false)} className="px-3 py-1.5 text-slate-500">إلغاء</button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg">إضافة للمستودع</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Content Gallery / Cards Grid */}
      {activeTab === 'notes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => {
            const pillar = pillars.find((p) => p.id === note.pillarId);
            return (
              <div 
                key={note.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-indigo-300 transition-all space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                    {note.type === 'idea' ? '💡 فكرة' : note.type === 'meeting' ? '👥 اجتماع' : '📝 ملاحظة'}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{note.createdAt}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{note.title}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                    {note.content}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
                  {pillar && (
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {pillar.title}
                    </span>
                  )}
                  {note.tags?.map((t, i) => (
                    <span key={i} className="text-[10px] text-indigo-600 font-mono">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKnowledge.map((item) => {
            const pillar = pillars.find((p) => p.id === item.pillarId);
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'completed' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : item.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status === 'completed' ? '✓ مكتمل' : item.status === 'in_progress' ? '⏳ قيد القراءة' : '○ في الانتظار'}
                    </span>

                    <div className="flex items-center text-amber-500 text-xs">
                      {'★'.repeat(item.rating || 5)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{item.authorOrSource}</p>
                  </div>

                  {item.keyTakeaway && (
                    <div className="bg-slate-50 p-2.5 rounded-lg text-xs text-slate-700 border border-slate-100">
                      <span className="font-bold block text-[10px] text-slate-400 mb-0.5">الخلاصة والفائدة:</span>
                      <p className="line-clamp-3 text-slate-600 leading-relaxed">{item.keyTakeaway}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-indigo-700 font-medium">{pillar?.title || 'عام'}</span>
                  
                  {/* Status toggle button */}
                  <button
                    onClick={() => {
                      const nextStatus: KnowledgeItem['status'] = item.status === 'want_to_consume' ? 'in_progress' : item.status === 'in_progress' ? 'completed' : 'in_progress';
                      onUpdateKnowledgeStatus(item.id, nextStatus);
                    }}
                    className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer"
                  >
                    تغيير الحالة ↻
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
