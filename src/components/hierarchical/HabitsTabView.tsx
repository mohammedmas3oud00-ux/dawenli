import React, { useState, useEffect } from 'react';
import { Habit, Pillar, HabitTimeOfDay, HabitFrequency } from '../../types/hierarchical';
import { 
  Repeat, 
  Plus, 
  Flame, 
  Check, 
  Trash2, 
  Edit2, 
  Sun, 
  Sunset, 
  Moon, 
  Clock3 
} from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface HabitsTabViewProps {
  habits: Habit[];
  pillars: Pillar[];
  onToggleHabitDate: (habitId: string, dateStr: string) => void;
  onSaveHabit: (habit: Partial<Habit>) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitsTabView: React.FC<HabitsTabViewProps> = ({
  habits,
  pillars,
  onToggleHabitDate,
  onSaveHabit,
  onDeleteHabit,
}) => {
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Modal form fields
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalPillarId, setModalPillarId] = useState(pillars[0]?.id || '');
  const [modalFrequency, setModalFrequency] = useState<HabitFrequency>('daily');
  const [modalTargetDays, setModalTargetDays] = useState(7);
  const [modalTimeOfDay, setModalTimeOfDay] = useState<HabitTimeOfDay>('morning');

  // Days for the 7-day visual matrix (last 7 days ending today)
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const isoDate = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('ar-EG', { weekday: 'narrow' });
    const dayNumber = d.getDate();
    return { isoDate, dayName, dayNumber, isToday: i === 6 };
  });

  const todayStr = today.toISOString().split('T')[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const filteredHabits = habits.filter(h => {
    if (selectedPillarFilter === 'all') return true;
    return h.pillar_id === selectedPillarFilter;
  });

  // Calculate consistency
  const totalHabits = habits.length;
  const completedTodayCount = habits.filter(h => h.completed_dates.includes(todayStr)).length;
  const todayPercentage = totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;
  const highestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.current_streak || 0), 0) : 0;
  const coveredPillarsCount = new Set(habits.map(h => h.pillar_id)).size;

  const handleOpenNew = () => {
    setEditingHabit(null);
    setModalTitle('');
    setModalDescription('');
    setModalPillarId(pillars[0]?.id || '');
    setModalFrequency('daily');
    setModalTargetDays(7);
    setModalTimeOfDay('morning');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: Habit) => {
    setEditingHabit(h);
    setModalTitle(h.title);
    setModalDescription(h.description || '');
    setModalPillarId(h.pillar_id);
    setModalFrequency(h.frequency);
    setModalTargetDays(h.target_days_per_week || 7);
    setModalTimeOfDay(h.time_of_day || 'morning');
    setIsModalOpen(true);
  };

  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    onSaveHabit({
      ...(editingHabit ? { id: editingHabit.id } : {}),
      title: modalTitle.trim(),
      description: modalDescription.trim(),
      pillar_id: modalPillarId,
      frequency: modalFrequency,
      target_days_per_week: Number(modalTargetDays) || 7,
      time_of_day: modalTimeOfDay,
      is_active: true,
    });

    setIsModalOpen(false);
  };

  const getTimeIcon = (time: HabitTimeOfDay) => {
    switch (time) {
      case 'morning': return <Sun className="w-3 h-3 text-amber-500" />;
      case 'afternoon': return <Clock3 className="w-3 h-3 text-stone-500" />;
      case 'evening': return <Sunset className="w-3 h-3 text-indigo-400" />;
      default: return <Moon className="w-3 h-3 text-stone-500" />;
    }
  };

  const getTimeLabel = (time: HabitTimeOfDay) => {
    switch (time) {
      case 'morning': return 'صباحاً';
      case 'afternoon': return 'ظهراً';
      case 'evening': return 'مساءً';
      default: return 'أي وقت';
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      
      {/* 1. Header & Metrics Strip */}
      <div className="bg-white dark:bg-[#131d18] rounded-2xl border border-[#e8e4db] dark:border-[#26372d] p-4 sm:p-5 shadow-2xs space-y-3.5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#1a2420] dark:text-white">
                  متتبع العادات (Habits)
                </h1>
                <span className="text-xs font-mono text-[#78857e] dark:text-[#8ea095] tabular-nums">
                  ({completedTodayCount} من {totalHabits} منجزة اليوم)
                </span>
              </div>
              <p className="text-xs text-[#6e7b74] dark:text-[#9bb0a3]">
                العادات تغذي مجالات الحياة يومياً بالتكرار الهادئ والمستمر.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة عادة</span>
          </button>
        </div>

        {/* Streamlined Horizontal Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#f0ede6] dark:border-[#223028] text-xs text-[#525f58] dark:text-[#9bb0a3]">
          <div className="flex items-center gap-2">
            <span className="text-[#78857e] dark:text-[#8ea095]">التزام اليوم:</span>
            <span className="font-mono font-bold text-[#174235] dark:text-emerald-400 tabular-nums">{todayPercentage}%</span>
            <div className="w-20 bg-[#e8e4dc] dark:bg-[#203026] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#174235] dark:bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${todayPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[#78857e] dark:text-[#8ea095]">العادات:</span>
              <span className="font-mono font-semibold text-[#1a2420] dark:text-white tabular-nums">{totalHabits}</span>
            </div>

            <span className="text-[#d8d4cc] dark:text-[#33463a]">·</span>

            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-[#78857e] dark:text-[#8ea095]">أعلى سلسلة:</span>
              <span className="font-mono font-semibold text-[#1a2420] dark:text-white tabular-nums">{highestStreak} يوماً</span>
            </div>

            <span className="text-[#d8d4cc] dark:text-[#33463a]">·</span>

            <div className="flex items-center gap-1.5">
              <span className="text-[#78857e] dark:text-[#8ea095]">المجالات المغطاة:</span>
              <span className="font-mono font-semibold text-[#1a2420] dark:text-white tabular-nums">{coveredPillarsCount} من {pillars.length}</span>
            </div>
          </div>
        </div>

        {/* Pillar Filter Tabs */}
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto py-2.5 border-t border-[#f0ede6] dark:border-[#223028] scrollbar-none relative z-10">
          <button
            type="button"
            onClick={() => setSelectedPillarFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
              selectedPillarFilter === 'all'
                ? 'bg-[#174235] dark:bg-emerald-600 text-white'
                : 'text-[#637068] dark:text-[#9bb0a3] hover:text-[#1a2420] dark:hover:text-white hover:bg-[#f4f2ec] dark:hover:bg-[#1a2620] border border-[#e5e1d7] dark:border-[#27382e]'
            }`}
          >
            كافة المجالات <span className="font-mono tabular-nums text-[11px] opacity-90">({habits.length})</span>
          </button>
          {pillars.map((pillar) => {
            const count = habits.filter(h => h.pillar_id === pillar.id).length;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setSelectedPillarFilter(pillar.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                  selectedPillarFilter === pillar.id
                    ? 'bg-[#174235] dark:bg-emerald-600 text-white font-bold'
                    : 'text-[#637068] dark:text-[#9bb0a3] hover:text-[#1a2420] dark:hover:text-white hover:bg-[#f4f2ec] dark:hover:bg-[#1a2620] border border-[#e5e1d7] dark:border-[#27382e]'
                }`}
              >
                {pillar.title} <span className="font-mono tabular-nums text-[11px] opacity-90">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Habits Weekly Matrix Table */}
      <div className="bg-white dark:bg-[#131d18] border border-[#e8e4db] dark:border-[#26372d] rounded-2xl overflow-hidden shadow-2xs transition-colors">
        
        {/* Table Header */}
        <div className="bg-[#faf9f6] dark:bg-[#16211a] border-b border-[#e8e4db] dark:border-[#26372d] px-4 py-3 flex items-center justify-between text-xs font-semibold text-[#6e7b74] dark:text-[#8ea095]">
          <div className="w-1/2 sm:w-2/5">العادة والمجال</div>
          <div className="flex items-center gap-1.5 sm:gap-3 text-center">
            {weekDays.map((d) => (
              <div 
                key={d.isoDate} 
                className={`w-7 sm:w-9 text-center ${d.isToday ? 'text-[#174235] dark:text-emerald-400 font-bold' : 'text-[#85928a] dark:text-[#708075]'}`}
              >
                <div className="text-[10px]">{d.dayName}</div>
                <div className="text-xs font-mono tabular-nums">{d.dayNumber}</div>
              </div>
            ))}
          </div>
          <div className="hidden sm:block w-20 text-center">السلسلة</div>
        </div>

        {/* Habit Rows */}
        {filteredHabits.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#7d8982] dark:text-[#9bb0a3]">
            لا توجد عادات مسجلة تحت هذا التصنيف حالياً.
          </div>
        ) : (
          <div className="divide-y divide-[#f0ede6] dark:divide-[#223028]">
            {filteredHabits.map((habit) => {
              const pillar = pillars.find(p => p.id === habit.pillar_id);
              const isDoneToday = habit.completed_dates.includes(todayStr);

              return (
                <div 
                  key={habit.id}
                  className="px-4 py-3.5 hover:bg-[#faf9f6] dark:hover:bg-[#18261e] transition-colors flex items-center justify-between gap-3 group"
                >
                  {/* Left: Habit Info */}
                  <div className="w-1/2 sm:w-2/5 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-semibold text-[#1a2420] dark:text-white truncate">
                        {habit.title}
                      </h3>
                      {isDoneToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#174235] dark:bg-emerald-400" title="أُنجزت اليوم" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#78857e] dark:text-[#8ea095] mt-0.5">
                      {pillar && <span>{pillar.title}</span>}
                      <span className="text-[#d8d4cc] dark:text-[#384a3e]">·</span>
                      <span className="flex items-center gap-1">
                        {getTimeIcon(habit.time_of_day)}
                        <span>{getTimeLabel(habit.time_of_day)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Center: 7-Day Tactile Checkbox Matrix */}
                  <div className="flex items-center gap-1.5 sm:gap-3">
                    {weekDays.map((d) => {
                      const isCompleted = habit.completed_dates.includes(d.isoDate);
                      return (
                        <button
                          key={d.isoDate}
                          type="button"
                          onClick={() => onToggleHabitDate(habit.id, d.isoDate)}
                          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            isCompleted
                              ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-2xs'
                              : d.isToday
                              ? 'bg-white dark:bg-[#121c17] border-2 border-dashed border-[#174235]/40 dark:border-emerald-500/40 hover:border-[#174235] text-[#85928a]'
                              : 'bg-[#f4f2ec] dark:bg-[#1c2921] hover:bg-[#eae6dc] dark:hover:bg-[#25362c] text-transparent'
                          }`}
                          title={`${habit.title} - ${d.isoDate}`}
                          aria-label={`${habit.title} ليوم ${d.isoDate} - ${isCompleted ? 'مكتمل' : 'غير مكتمل'}`}
                        >
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-2" />
                          ) : (
                            <span className="text-[10px] sm:text-xs">·</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right: Streak & Actions */}
                  <div className="flex items-center justify-end gap-2 w-auto sm:w-20 shrink-0">
                    <div className="flex items-center gap-1 text-xs font-mono tabular-nums font-bold text-[#1a2420] dark:text-white">
                      <Flame className={`w-3.5 h-3.5 ${habit.current_streak > 0 ? 'text-amber-500 fill-amber-500' : 'text-[#c7c2b6] dark:text-[#3d5043]'}`} />
                      <span>{habit.current_streak}</span>
                    </div>

                    <div className="opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(habit)}
                        className="p-1 text-[#85928a] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white rounded cursor-pointer"
                        title="تعديل"
                        aria-label="تعديل العادة"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteHabit(habit.id)}
                        className="p-1 text-[#85928a] dark:text-[#8ea095] hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer"
                        title="حذف"
                        aria-label="حذف العادة"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Habit Create/Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="habit-modal-title"
        >
          <div className="bg-white dark:bg-[#131d18] rounded-2xl max-w-md w-full p-5 shadow-xl border border-[#e8e4db] dark:border-[#26372d] space-y-4 animate-in fade-in text-xs transition-colors">
            <div className="flex items-center justify-between border-b border-[#f0ede6] dark:border-[#223028] pb-3">
              <h3 id="habit-modal-title" className="font-bold text-sm text-[#1a2420] dark:text-white">
                {editingHabit ? 'تعديل العادة' : 'إضافة عادة يومية جديدة'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#85928a] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white p-1 rounded cursor-pointer"
                aria-label="إغلاق النافذة"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-3">
              <div>
                <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">اسم العادة أو الممارسة:</label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="مثال: قراءة 20 صفحة يومياً، ورد الذكر..."
                  className="w-full p-2.5 bg-white dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">المجال الحاضن:</label>
                <CustomSelect
                  value={modalPillarId}
                  onChange={(val) => setModalPillarId(val)}
                  options={pillars.map((p) => ({ value: p.id, label: `${p.title} (${p.pillar_group})` }))}
                  className="w-full"
                  buttonClassName="w-full rounded-xl py-2 px-3 text-xs bg-white dark:bg-[#121c17] border-[#d8d4cc] dark:border-[#2d4034]"
                  dropdownClassName="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">وقت الممارسة:</label>
                  <CustomSelect<HabitTimeOfDay>
                    value={modalTimeOfDay}
                    onChange={(val) => setModalTimeOfDay(val)}
                    options={[
                      { value: 'morning', label: 'صباحاً', icon: '🌅' },
                      { value: 'afternoon', label: 'ظهراً', icon: '☀️' },
                      { value: 'evening', label: 'مساءً', icon: '🌆' },
                      { value: 'anytime', label: 'أي وقت', icon: '🕒' },
                    ]}
                    className="w-full"
                    buttonClassName="w-full rounded-xl py-2 px-3 text-xs bg-white dark:bg-[#121c17] border-[#d8d4cc] dark:border-[#2d4034]"
                    dropdownClassName="w-full"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">أيام الالتزام / الأسبوع:</label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={modalTargetDays}
                    onChange={(e) => setModalTargetDays(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#35403a] dark:text-[#c4d6cb] mb-1">ملاحظة أو نية (اختياري):</label>
                <textarea
                  rows={2}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="لماذا هذه العادة مهمة لهويتك؟"
                  className="w-full p-2 bg-white dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f0ede6] dark:border-[#223028]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-[#f4f2ec] dark:bg-[#192620] hover:bg-[#ece8de] dark:hover:bg-[#203026] text-[#4a554f] dark:text-[#c4d6cb] rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer transition-all"
                >
                  حفظ العادة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
