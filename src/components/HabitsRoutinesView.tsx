import React, { useState } from 'react';
import { 
  Plus, 
  Flame, 
  CheckCircle2, 
  Calendar, 
  Trash2, 
  Sun, 
  Moon, 
  Clock, 
  Sparkles,
  TrendingUp 
} from 'lucide-react';
import { Habit, Pillar } from '../types';

interface HabitsRoutinesViewProps {
  habits: Habit[];
  pillars: Pillar[];
  onToggleHabitDay: (habitId: string, dateStr: string) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'streak' | 'history'>) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitsRoutinesView: React.FC<HabitsRoutinesViewProps> = ({
  habits,
  pillars,
  onToggleHabitDay,
  onAddHabit,
  onDeleteHabit,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Habit['category']>('Spiritual');
  const [newPillarId, setNewPillarId] = useState(pillars[0]?.id || '');
  const [newTimeOfDay, setNewTimeOfDay] = useState<Habit['timeOfDay']>('morning');
  const [newTargetDays, setNewTargetDays] = useState(7);

  // Generate last 7 days for the weekly matrix
  const days: { label: string; dateStr: string; isToday: boolean }[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('ar-EG', { weekday: 'short' });
    days.push({
      label: dayName,
      dateStr,
      isToday: i === 0,
    });
  }

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddHabit({
      title: newTitle.trim(),
      category: newCategory,
      pillarId: newPillarId,
      timeOfDay: newTimeOfDay,
      frequency: newTargetDays >= 7 ? 'daily' : 'weekdays',
      targetDaysPerWeek: newTargetDays,
    });

    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-purple-900/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <span>🔄</span>
              <span>Habits & Routines · العادات والروتينات</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              صياغة الهوية عبر تكرار العادات
            </h1>
            
            <p className="text-sm text-purple-200 max-w-xl leading-relaxed">
              «نحن ما نفعله بانتظام؛ فالتميز ليس عملاً منفرداً بل عادة». راقب استمراريتك ومصفوفة التزامك اليومية.
            </p>
          </div>

          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عادة جديدة</span>
          </button>
        </div>
      </div>

      {/* New Habit Form Modal / Accordion */}
      {isAdding && (
        <form onSubmit={handleCreateHabit} className="bg-white border border-purple-200 rounded-xl p-5 shadow-sm space-y-4 text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm text-slate-900">إضافة عادة جديدة للروتين</h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">اسم العادة:</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: قراءة 20 دقيقة، تمارين إطالة، مشي 8000 خطوة..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">الركيزة المرتبطة:</label>
              <select
                value={newPillarId}
                onChange={(e) => setNewPillarId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 cursor-pointer"
              >
                {pillars.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">وقت الروتين:</label>
              <select
                value={newTimeOfDay}
                onChange={(e) => setNewTimeOfDay(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 cursor-pointer"
              >
                <option value="morning">🌅 روتين الصباح</option>
                <option value="afternoon">☀️ وسط اليوم / العمل</option>
                <option value="evening">🌙 روتين المساء</option>
                <option value="anytime">⚡ في أي وقت</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">الهدف الأسبوعي (أيام):</label>
              <input
                type="number"
                min={1}
                max={7}
                value={newTargetDays}
                onChange={(e) => setNewTargetDays(parseInt(e.target.value) || 7)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 cursor-pointer"
            >
              حفظ العادة
            </button>
          </div>
        </form>
      )}

      {/* Habits Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>مصفوفة الالتزام الأسبوعية</span>
            </h2>
            <p className="text-[11px] text-slate-500">انقر على الخانة لتسجيل الإنجاز لكل يوم</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 min-w-[200px]">العادة والركيزة</th>
                <th className="py-3 px-3 w-24 text-center">الاستمرارية</th>
                {days.map((d) => (
                  <th key={d.dateStr} className={`py-3 px-2 text-center w-12 ${d.isToday ? 'bg-indigo-50/70 text-indigo-900 font-bold' : ''}`}>
                    <span className="block text-[11px]">{d.label}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">{d.dateStr.slice(8)}</span>
                  </th>
                ))}
                <th className="py-3 px-3 w-12 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {habits.map((habit) => {
                const pillar = pillars.find((p) => p.id === habit.pillarId);
                return (
                  <tr key={habit.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Habit name & pillar */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{habit.title}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                        <span className="text-indigo-600 font-medium">{pillar?.title || 'عام'}</span>
                        <span>·</span>
                        <span>
                          {habit.timeOfDay === 'morning' ? '🌅 صباحاً' : habit.timeOfDay === 'evening' ? '🌙 مساءً' : '⚡ في أي وقت'}
                        </span>
                      </div>
                    </td>

                    {/* Streak badge */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold text-[11px]">
                        <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{habit.streak} يوم</span>
                      </div>
                    </td>

                    {/* 7 Day Matrix Checkboxes */}
                    {days.map((d) => {
                      const isCompleted = !!habit.history[d.dateStr];
                      return (
                        <td 
                          key={d.dateStr} 
                          className={`py-3 px-2 text-center ${d.isToday ? 'bg-indigo-50/30' : ''}`}
                        >
                          <button
                            onClick={() => onToggleHabitDay(habit.id, d.dateStr)}
                            className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs transition-all mx-auto cursor-pointer ${
                              isCompleted
                                ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                            }`}
                          >
                            {isCompleted ? '✓' : '·'}
                          </button>
                        </td>
                      );
                    })}

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => onDeleteHabit(habit.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="حذف العادة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
