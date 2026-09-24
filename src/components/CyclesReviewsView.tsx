import React, { useState } from 'react';
import { 
  Trophy, 
  AlertCircle, 
  Heart, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles,
  TrendingUp,
  Star
} from 'lucide-react';
import { ReviewCycleEntry } from '../types';

interface CyclesReviewsViewProps {
  reviews: ReviewCycleEntry[];
  onAddReview: (review: Omit<ReviewCycleEntry, 'id'>) => void;
}

export const CyclesReviewsView: React.FC<CyclesReviewsViewProps> = ({
  reviews,
  onAddReview,
}) => {
  const [activeCycleTab, setActiveCycleTab] = useState<'weekly' | 'daily' | 'all'>('weekly');
  const [isWriting, setIsWriting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [score, setScore] = useState(8);
  const [accomplishmentsStr, setAccomplishmentsStr] = useState('');
  const [lessonsStr, setLessonsStr] = useState('');
  const [gratitudeStr, setGratitudeStr] = useState('');
  const [notes, setNotes] = useState('');

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddReview({
      title: title.trim(),
      type: activeCycleTab === 'daily' ? 'daily' : 'weekly',
      date: new Date().toISOString().split('T')[0],
      score,
      accomplishments: accomplishmentsStr.split('\n').map((s) => s.trim()).filter(Boolean),
      disappointmentsAndLessons: lessonsStr.split('\n').map((s) => s.trim()).filter(Boolean),
      gratitude: gratitudeStr.split('\n').map((s) => s.trim()).filter(Boolean),
      notes: notes.trim(),
    });

    setTitle('');
    setAccomplishmentsStr('');
    setLessonsStr('');
    setGratitudeStr('');
    setNotes('');
    setIsWriting(false);
  };

  const filteredReviews = reviews.filter((r) => {
    if (activeCycleTab === 'all') return true;
    return r.type === activeCycleTab;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-amber-900/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <span>🔄</span>
              <span>Cycles & Reviews · دورات المراجعة والمحاسبة</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              سجل الإنجازات والدروس المستفادة
            </h1>
            
            <p className="text-sm text-amber-200 max-w-xl leading-relaxed">
              «التأمل والمراجعة الدورية يحولان الخبرات اليومية إلى حكمة راسخة». احتفل بإنجازاتك، وتعلم من عثراتك.
            </p>
          </div>

          <button
            onClick={() => setIsWriting(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>كتابة مراجعة جديدة</span>
          </button>
        </div>
      </div>

      {/* Cycle Selector Buttons (D / W / M / Q) */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setActiveCycleTab('weekly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeCycleTab === 'weekly'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>📆 المراجعات الأسبوعية</span>
        </button>

        <button
          onClick={() => setActiveCycleTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeCycleTab === 'daily'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>☀️ التأمل اليومي</span>
        </button>

        <button
          onClick={() => setActiveCycleTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeCycleTab === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>📋 كافة السجلات ({reviews.length})</span>
        </button>
      </div>

      {/* New Review Form */}
      {isWriting && (
        <form onSubmit={handleSaveReview} className="bg-white border border-amber-200 rounded-xl p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm text-slate-900">كتابة مراجعة وتأمل دوري</h3>
            <button type="button" onClick={() => setIsWriting(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">عنوان المراجعة:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: مراجعة الأسبوع الثالث من سبتمبر..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">تقييم الأسبوع / اليوم (من 10):</label>
              <input
                type="number"
                min={1}
                max={10}
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value) || 8)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Accomplishments */}
          <div>
            <label className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
              <Trophy className="w-3.5 h-3.5 text-emerald-600" />
              <span>ما أنجزته بنجاح — سطر لكل إنجاز:</span>
            </label>
            <textarea
              rows={3}
              value={accomplishmentsStr}
              onChange={(e) => setAccomplishmentsStr(e.target.value)}
              placeholder="- صلاة الفجر في المسجد طوال الأسبوع&#10;- إنجاز معمارية المشروع الجديد&#10;- قراءة 50 صفحة وتلخيصها"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          {/* Disappointments & Lessons */}
          <div>
            <label className="font-bold text-amber-800 flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>العثرات والدروس المستفادة — سطر لكل درس:</span>
            </label>
            <textarea
              rows={3}
              value={lessonsStr}
              onChange={(e) => setLessonsStr(e.target.value)}
              placeholder="- السهر المفرط سبب تشتت الذهن — الدرس: إغلاق الشاشات 10:30 مساءً&#10;- عدم توثيق الكود أثناء العمل — الدرس: تخصيص ربع ساعة للتوثيق يومياً"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          {/* Gratitude */}
          <div>
            <label className="font-bold text-indigo-800 flex items-center gap-1.5 mb-1">
              <Heart className="w-3.5 h-3.5 text-indigo-600" />
              <span>سجل الامتنان والحمد:</span>
            </label>
            <textarea
              rows={2}
              value={gratitudeStr}
              onChange={(e) => setGratitudeStr(e.target.value)}
              placeholder="الحمد لله على نعمة التوفيق، والستر، وبركة الوقت..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsWriting(false)} className="px-3 py-1.5 text-slate-500">إلغاء</button>
            <button type="submit" className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg">حفظ المراجعة</button>
          </div>
        </form>
      )}

      {/* Reviews Cards List */}
      <div className="space-y-6">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl text-xs text-slate-400">
            لا توجد مراجعات مسجلة في هذا القسم حالياً.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div 
              key={rev.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{rev.title}</h3>
                  <span className="text-xs text-slate-400 font-mono">{rev.date}</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-xs">
                  <span>التقييم:</span>
                  <span className="text-sm font-extrabold">{rev.score}</span>
                  <span>/ 10</span>
                </div>
              </div>

              {/* Accomplishments Section */}
              {rev.accomplishments?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                    <span>سجل الإنجازات:</span>
                  </h4>
                  <ul className="space-y-1 pr-4 list-disc text-xs text-slate-700">
                    {rev.accomplishments.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lessons & Disappointments Section */}
              {rev.disappointmentsAndLessons?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>الدروس والعثرات المستفادة:</span>
                  </h4>
                  <ul className="space-y-1 pr-4 list-disc text-xs text-slate-700">
                    {rev.disappointmentsAndLessons.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gratitude Section */}
              {rev.gratitude?.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-indigo-600" />
                    <span>الامتنان والحمد:</span>
                  </h4>
                  <ul className="space-y-0.5 pr-4 list-disc text-xs text-slate-600">
                    {rev.gratitude.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
};
