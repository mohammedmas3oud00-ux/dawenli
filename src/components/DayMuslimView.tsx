import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  BookOpen, 
  Heart, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Clock, 
  ChevronRight, 
  RotateCcw,
  MessageSquareQuote,
  Flame,
  Award
} from 'lucide-react';
import { MuslimDayChecklist } from '../types';

interface DayMuslimViewProps {
  muslimDay: MuslimDayChecklist;
  onUpdateMuslimDay: (updated: MuslimDayChecklist) => void;
}

export const DayMuslimView: React.FC<DayMuslimViewProps> = ({
  muslimDay,
  onUpdateMuslimDay,
}) => {
  const [adhkarCounter, setAdhkarCounter] = useState<number>(0);
  const [adhkarText, setAdhkarText] = useState<string>('سبحان الله وبحمده، سبحان الله العظيم');
  const [editingWird, setEditingWird] = useState(false);
  const [wirdInput, setWirdInput] = useState(muslimDay.quranJuzOrSurah || '');
  const [reflectionInput, setReflectionInput] = useState(muslimDay.reflectionNote || '');

  const toggleField = (field: keyof MuslimDayChecklist) => {
    const val = !muslimDay[field];
    onUpdateMuslimDay({
      ...muslimDay,
      [field]: val,
    });
  };

  const handleSaveWird = () => {
    onUpdateMuslimDay({
      ...muslimDay,
      quranJuzOrSurah: wirdInput,
    });
    setEditingWird(false);
  };

  const handleSaveReflection = () => {
    onUpdateMuslimDay({
      ...muslimDay,
      reflectionNote: reflectionInput,
    });
  };

  const prayers = [
    { key: 'fajr' as const, name: 'صلاة الفجر', time: 'في وقتها / جماعة', sunnah: 'سنة الفجر ركعتان' },
    { key: 'dhuhr' as const, name: 'صلاة الظهر', time: 'في وقتها', sunnah: '4 قبلها و 2 بعدها' },
    { key: 'asr' as const, name: 'صلاة العصر', time: 'في وقتها (الصلاة الوسطى)', sunnah: '4 قبلها مستحبة' },
    { key: 'maghrib' as const, name: 'صلاة المغرب', time: 'في وقتها', sunnah: 'ركعتان بعدها' },
    { key: 'isha' as const, name: 'صلاة العشاء', time: 'في وقتها', sunnah: 'ركعتان بعدها + الشفع والوتر' },
  ];

  const totalPrayersDone = prayers.filter((p) => !!muslimDay[p.key]).length;

  const adhkarOptions = [
    { text: 'سبحان الله وبحمده، سبحان الله العظيم', target: 100 },
    { text: 'أستغفر الله وأتوب إليه', target: 100 },
    { text: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير', target: 100 },
    { text: 'اللهم صل وسلم على نبينا محمد', target: 100 },
    { text: 'لا حول ولا قوة إلا بالله العلي العظيم', target: 100 },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-emerald-800 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span>🕌</span>
            <span>Day Muslim · يوم المسلم اليومي</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            نظام العبادة والارتقاء الإيماني اليومي
          </h1>
          
          <p className="text-sm text-emerald-200 max-w-2xl leading-relaxed">
            «أحب الأعمال إلى الله أدومها وإن قل». متابعة الصلوات الخمس في أوقاتها، أذكار الصباح والمساء، والورد القرآني، مع محاسبة النفس قبل النوم.
          </p>
        </div>
      </div>

      {/* Notion Callout Box: النية والاستحضار */}
      <aside className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-start gap-3.5 text-xs text-emerald-950">
        <span className="text-2xl mt-0.5">🌿</span>
        <div className="space-y-1">
          <span className="font-bold block text-sm">تجديد النية واستحضار الإخلاص:</span>
          <p className="text-emerald-800 leading-relaxed">
            اجعل يومك كله عبادة؛ عملك، دراستك، إحسانك للناس، ورياضتك بنية التقوي على طاعة الله ونفع عباده تكون كلها في ميزان حسناتك.
          </p>
        </div>
      </aside>

      {/* Section 1: الصلوات الخمس والسنن الرواتب */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🕌 الصلوات الخمس في أوقاتها</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                {totalPrayersDone} من 5 صلوات
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              الصلاة عماد الدين، وأول ما يحاسب عليه العبد يوم القيامة.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleField('sunnahPrayers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                muslimDay.sunnahPrayers
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <span>{muslimDay.sunnahPrayers ? '✓ تم أداء السنن الرواتب' : '○ السنن الرواتب (12 ركعة)'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {prayers.map((prayer) => {
            const isCompleted = !!muslimDay[prayer.key];
            return (
              <div
                key={prayer.key}
                onClick={() => toggleField(prayer.key)}
                className={`p-4 rounded-xl border flex flex-col justify-between text-center transition-all cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs'
                    : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isCompleted ? '✓' : '○'}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm">{prayer.name}</h3>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{prayer.time}</span>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400">
                  {prayer.sunnah}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: ورد القرآن الكريم وتدبر الآيات */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">ورد القرآن الكريم اليومي</h2>
              <p className="text-xs text-slate-500">«إن هذا القرآن يهدي للتي هي أقوم»</p>
            </div>
          </div>

          <button
            onClick={() => toggleField('quranWird')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              muslimDay.quranWird
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
            }`}
          >
            <span>{muslimDay.quranWird ? '✓ تم إنجاز الورد اليومي' : '○ تعليم كمنجز'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <span className="font-bold text-slate-900 block">ما تم أو سيتم قراءته اليوم:</span>
            
            {editingWird ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={wirdInput}
                  onChange={(e) => setWirdInput(e.target.value)}
                  placeholder="مثال: سورة البقرة من آية 1 إلى 50، أو الجزء الخامس..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setEditingWird(false)}
                    className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveWird}
                    className="px-3 py-1 bg-emerald-600 text-white font-bold rounded cursor-pointer"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setEditingWird(true)}
                className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 cursor-pointer hover:border-emerald-400 transition-colors flex items-center justify-between"
              >
                <span>{muslimDay.quranJuzOrSurah || 'اضغط هنا لتحديد ورد اليوم...'}</span>
                <span className="text-[10px] text-indigo-600 font-semibold">تعديل</span>
              </div>
            )}
          </div>

          <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-4 space-y-1 text-amber-950">
            <span className="font-bold flex items-center gap-1.5">
              <span>💡</span>
              <span>همسة تدبر:</span>
            </span>
            <p className="text-amber-900 text-xs leading-relaxed">
              لا يكن همّك آخر السورة، قف عند الآية التي تحرك قلبك ورددها وتأمل خطاب الله لك فيها، فآية واحدة بتدبر خير من ختمة بغير فهم.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: الأذكار اليومية والسبحة الإلكترونية */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>📿 الأذكار وحصن المسلم اليومي</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            أذكار الصباح والمساء حصن حصين وسلام للنفس وطمأنينة للقلب.
          </p>
        </div>

        {/* Adhkar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div 
            onClick={() => toggleField('morningAdhkar')}
            className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              muslimDay.morningAdhkar
                ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                : 'bg-slate-50 border-slate-200 hover:border-amber-300 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5 text-amber-500" />
              <div>
                <span className="font-bold block text-sm">أذكار الصباح</span>
                <span className="text-[11px] text-slate-500">من بعد صلاة الفجر حتى طلوع الشمس</span>
              </div>
            </div>
            <input 
              type="checkbox"
              checked={muslimDay.morningAdhkar}
              onChange={() => toggleField('morningAdhkar')}
              className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div 
            onClick={() => toggleField('eveningAdhkar')}
            className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              muslimDay.eveningAdhkar
                ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950'
                : 'bg-slate-50 border-slate-200 hover:border-indigo-300 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-indigo-500" />
              <div>
                <span className="font-bold block text-sm">أذكار المساء</span>
                <span className="text-[11px] text-slate-500">من بعد صلاة العصر حتى غروب الشمس</span>
              </div>
            </div>
            <input 
              type="checkbox"
              checked={muslimDay.eveningAdhkar}
              onChange={() => toggleField('eveningAdhkar')}
              className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Interactive Digital Tasbeeh */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-xs text-slate-900 block">عداد التسبيح والاستغفار التفاعلي:</span>
              <span className="text-[11px] text-slate-500">اختر الذكر واضغط للعد حتى تحقق الورد اليومي.</span>
            </div>

            {/* Quick selector */}
            <select
              value={adhkarText}
              onChange={(e) => {
                setAdhkarText(e.target.value);
                setAdhkarCounter(0);
              }}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 cursor-pointer"
            >
              {adhkarOptions.map((opt, i) => (
                <option key={i} value={opt.text}>{opt.text.slice(0, 35)}...</option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center space-y-4">
            <p className="text-center font-bold text-sm sm:text-base text-slate-800 max-w-lg leading-relaxed">
              «{adhkarText}»
            </p>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setAdhkarCounter(0)}
                title="تصفير العداد"
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setAdhkarCounter((c) => c + 1)}
                className="w-24 h-24 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-mono font-extrabold text-3xl flex items-center justify-center shadow-md transition-all cursor-pointer border-4 border-emerald-100"
              >
                {adhkarCounter}
              </button>

              <div className="text-xs text-slate-500 font-mono">
                الهدف: 100
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Section 4: النوافل والصدقة ومحاسبة النفس */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            🌱 النوافل والصدقة ومحاسبة النفس
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            «حاسبوا أنفسكم قبل أن تحاسبوا، وزنوا أعمالكم قبل أن توزن عليكم»
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div 
            onClick={() => toggleField('qiyamOrWitr')}
            className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              muslimDay.qiyamOrWitr
                ? 'bg-purple-50/70 border-purple-300 text-purple-950'
                : 'bg-slate-50 border-slate-200 hover:border-purple-300 text-slate-700'
            }`}
          >
            <div>
              <span className="font-bold block text-sm">قيام الليل والوتر</span>
              <span className="text-[11px] text-slate-500">ركعة الوتر جنة القلب</span>
            </div>
            <input 
              type="checkbox"
              checked={muslimDay.qiyamOrWitr}
              onChange={() => toggleField('qiyamOrWitr')}
              className="w-5 h-5 text-purple-600 rounded cursor-pointer"
            />
          </div>

          <div 
            onClick={() => toggleField('sadaqah')}
            className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              muslimDay.sadaqah
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-slate-50 border-slate-200 hover:border-emerald-300 text-slate-700'
            }`}
          >
            <div>
              <span className="font-bold block text-sm">صدقة اليوم</span>
              <span className="text-[11px] text-slate-500">«داووا مرضاكم بالصدقة»، وتبسمك في وجه أخيك صدقة</span>
            </div>
            <input 
              type="checkbox"
              checked={muslimDay.sadaqah}
              onChange={() => toggleField('sadaqah')}
              className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Reflection Note */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-slate-800 block">
            خاطرة محاسبة النفس وتأمل اليوم:
          </span>
          <textarea
            rows={3}
            value={reflectionInput}
            onChange={(e) => setReflectionInput(e.target.value)}
            onBlur={handleSaveReflection}
            placeholder="كيف كان إخلاصك اليوم؟ هل زل لسانك بغيبة؟ هل أحسنت لأهلك؟ اكتب تأملك ودعاءك..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

      </div>

    </div>
  );
};
