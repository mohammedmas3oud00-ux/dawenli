import React, { useState } from 'react';
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
      case 'morning': return <Sun className="w-3 h-3 text-amber-600" />;
      case 'afternoon': return <Clock3 className="w-3 h-3 text-stone-500" />;
      case 'evening': return <Sunset className="w-3 h-3 text-indigo-500" />;
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
      
      {/* 1. Lean, Compact Header & Metrics Strip */}
      <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ebf4f0] text-[#174235] flex items-center justify-center shrink-0">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-[#1a2420]">
                  متتبع العادات
                </h1>
                <span className="text-xs font-mono text-[#78857e] tabular-nums">
                  ({completedTodayCount} من {totalHabits} منجزة اليوم)
                </span>
              </div>
              <p className="text-xs text-[#6e7b74]">
                العادات تحمي الهوية وتغذي الركائز يومياً بالتكرار الهادئ المستمر.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة عادة</span>
          </button>
        </div>

        {/* Streamlined Horizontal Summary Bar - Replaces 4 bulky cards */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#f0ede6] text-xs text-[#525f58]">
          <div className="flex items-center gap-2">
            <span className="text-[#78857e]">التزام اليوم:</span>
            <span className="font-mono font-bold text-[#174235] tabular-nums">{todayPercentage}%</span>
            <div className="w-20 bg-[#e8e4dc] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#174235] h-full transition-all duration-300"
                style={{ width: `${todayPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[#78857e]">العادات:</span>
              <span className="font-mono font-semibold text-[#1a2420] tabular-nums">{totalHabits}</span>
            </div>

            <span className="text-[#d8d4cc]">·</span>

            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-[#78857e]">أعلى سلسلة:</span>
              <span className="font-mono font-semibold text-[#1a2420] tabular-nums">{highestStreak} يوماً</span>
            </div>

            <span className="text-[#d8d4cc]">·</span>

            <div className="flex items-center gap-1.5">
              <span className="text-[#78857e]">الركائز المغطاة:</span>
              <span className="font-mono font-semibold text-[#1a2420] tabular-nums">{coveredPillarsCount} من {pillars.length}</span>
            </div>
          </div>
        </div>

        {/* Pillar Filter Tabs */}
        <div className="flex items-center gap-1 text-xs overflow-x-auto pt-2 border-t border-[#f0ede6]">
          <button
            onClick={() => setSelectedPillarFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedPillarFilter === 'all'
                ? 'bg-[#174235] text-white'
                : 'text-[#637068] hover:text-[#1a2420] hover:bg-[#f4f2ec]'
            }`}
          >
            كافة الركائز <span className="font-mono tabular-nums text-[11px]">({habits.length})</span>
          </button>
          {pillars.map((pillar) => {
            const count = habits.filter(h => h.pillar_id === pillar.id).length;
            return (
              <button
                key={pillar.id}
                onClick={() => setSelectedPillarFilter(pillar.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  selectedPillarFilter === pillar.id
                    ? 'bg-[#174235] text-white'
                    : 'text-[#637068] hover:text-[#1a2420] hover:bg-[#f4f2ec]'
                }`}
              >
                {pillar.title} <span className="font-mono tabular-nums text-[11px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Habits Weekly Matrix Table */}
      <div className="bg-white border border-[#e8e4db] rounded-2xl overflow-hidden shadow-2xs">
        
        {/* Table Header */}
        <div className="bg-[#faf9f6] border-b border-[#e8e4db] px-4 py-3 flex items-center justify-between text-xs font-medium text-[#6e7b74]">
          <div className="w-1/2 sm:w-2/5">العادة والركيزة</div>
          <div className="flex items-center gap-1.5 sm:gap-3 text-center">
            {weekDays.map((d) => (
              <div 
                key={d.isoDate} 
                className={`w-7 sm:w-9 text-center ${d.isToday ? 'text-[#174235] font-bold' : 'text-[#85928a]'}`}
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
          <div className="p-10 text-center text-xs text-[#7d8982]">
            لا توجد عادات مسجلة تحت هذا التصنيف حالياً.
          </div>
        ) : (
          <div className="divide-y divide-[#f0ede6]">
            {filteredHabits.map((habit) => {
              const pillar = pillars.find(p => p.id === habit.pillar_id);
              const isDoneToday = habit.completed_dates.includes(todayStr);

              return (
                <div 
                  key={habit.id}
                  className="px-4 py-3.5 hover:bg-[#faf9f6] transition-colors flex items-center justify-between gap-3 group"
                >
                  {/* Left: Habit Info */}
                  <div className="w-1/2 sm:w-2/5 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-medium text-[#1a2420] truncate">
                        {habit.title}
                      </h3>
                      {isDoneToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#174235]" title="أُنجزت اليوم" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#78857e] mt-0.5">
                      {pillar && <span>{pillar.title}</span>}
                      <span className="text-[#d8d4cc]">·</span>
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
                          onClick={() => onToggleHabitDate(habit.id, d.isoDate)}
                          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            isCompleted
                              ? 'bg-[#174235] text-white shadow-2xs'
                              : d.isToday
                              ? 'bg-white border-2 border-dashed border-[#174235]/40 hover:border-[#174235] text-[#85928a]'
                              : 'bg-[#f4f2ec] hover:bg-[#eae6dc] text-transparent'
                          }`}
                          title={`${habit.title} - ${d.isoDate}`}
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
                    <div className="flex items-center gap-1 text-xs font-mono tabular-nums font-semibold text-[#1a2420]">
                      <Flame className={`w-3.5 h-3.5 ${habit.current_streak > 0 ? 'text-amber-500 fill-amber-500' : 'text-[#c7c2b6]'}`} />
                      <span>{habit.current_streak}</span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                      <button
                        onClick={() => handleOpenEdit(habit)}
                        className="p-1 text-[#85928a] hover:text-[#1a2420] rounded"
                        title="تعديل"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDeleteHabit(habit.id)}
                        className="p-1 text-[#85928a] hover:text-rose-600 rounded"
                        title="حذف"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-[#e8e4db] space-y-4 animate-in fade-in text-xs">
            <div className="flex items-center justify-between border-b border-[#f0ede6] pb-3">
              <h3 className="font-semibold text-sm text-[#1a2420]">
                {editingHabit ? 'تعديل العادة' : 'إضافة عادة يومية جديدة'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#85928a] hover:text-[#1a2420] p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-3">
              <div>
                <label className="block font-medium text-[#35403a] mb-1">اسم العادة أو الممارسة:</label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="مثال: قراءة 20 صفحة يومياً، ورد الذكر..."
                  className="w-full p-2.5 bg-white border border-[#d8d4cc] rounded-xl text-xs text-[#1a2420] outline-hidden focus:border-[#174235]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#35403a] mb-1">الركيزة الحاضنة:</label>
                <CustomSelect
                  value={modalPillarId}
                  onChange={(val) => setModalPillarId(val)}
                  options={pillars.map((p) => ({ value: p.id, label: `${p.title} (${p.pillar_group})` }))}
                  className="w-full"
                  buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                  dropdownClassName="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-[#35403a] mb-1">وقت الممارسة:</label>
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
                    buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                    dropdownClassName="w-full"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#35403a] mb-1">أيام الالتزام / الأسبوع:</label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={modalTargetDays}
                    onChange={(e) => setModalTargetDays(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-[#d8d4cc] rounded-xl text-xs text-[#1a2420] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#35403a] mb-1">ملاحظة أو نية (اختياري):</label>
                <textarea
                  rows={2}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="لماذا هذه العادة مهمة لهويتك؟"
                  className="w-full p-2 bg-white border border-[#d8d4cc] rounded-xl text-xs text-[#1a2420] outline-hidden focus:border-[#174235]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f0ede6]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-[#f4f2ec] hover:bg-[#ece8de] text-[#4a554f] rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl font-medium shadow-xs cursor-pointer"
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
