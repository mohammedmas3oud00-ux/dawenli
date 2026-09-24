import React, { useState, useEffect } from 'react';
import { 
  ReviewFrequency, 
  SystemReview, 
  Pillar, 
  Vision, 
  ValueGoal, 
  Project, 
  Task, 
  ReviewActionItem 
} from '../../types/hierarchical';
import { 
  generateSystemSnapshot, 
  generateAutomatedAudit 
} from '../../utils/reviewEngine';
import { 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  X, 
  Layers, 
  Star,
  Activity,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { performAiSmartReview } from '../../utils/speechRecognition';
import { toLocalDateKey } from '../../utils/date';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReview: (review: Partial<SystemReview>) => void;
  initialReview?: SystemReview | null;
  defaultFrequency?: ReviewFrequency;
  defaultFocusPillarId?: string | null;
  pillars: Pillar[];
  visions: Vision[];
  goals: ValueGoal[];
  projects: Project[];
  tasks: Task[];
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSaveReview,
  initialReview,
  defaultFrequency = 'daily',
  defaultFocusPillarId = null,
  pillars,
  visions,
  goals,
  projects,
  tasks,
}) => {
  const [frequency, setFrequency] = useState<ReviewFrequency>(defaultFrequency);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(toLocalDateKey());
  const [rating, setRating] = useState<number>(8);
  const [focusPillarId, setFocusPillarId] = useState<string>('all');

  // Manual Reflection
  const [wins, setWins] = useState('');
  const [challenges, setChallenges] = useState('');
  const [lessons, setLessons] = useState('');
  const [nextCommitments, setNextCommitments] = useState('');
  const [notes, setNotes] = useState('');

  // Smart Automated Audit State
  const [healthScore, setHealthScore] = useState<number>(80);
  const [smartSummary, setSmartSummary] = useState('');
  const [strengths, setStrengths] = useState<string[]>([]);
  const [bottlenecks, setBottlenecks] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<ReviewActionItem[]>([]);
  const [newActionTitle, setNewActionTitle] = useState('');

  const [activeTab, setActiveTab] = useState<'reflection' | 'smart_audit'>('reflection');
  const [isGeneratingAudit, setIsGeneratingAudit] = useState(false);

  // Helper default titles
  const getDefaultTitle = (freq: ReviewFrequency, d: string) => {
    const labels = {
      daily: 'مراجعة يومية',
      weekly: 'مراجعة أسبوعية',
      monthly: 'مراجعة شهرية',
      quarterly: 'مراجعة ربع سنوية',
      yearly: 'مراجعة سنوية شاملة',
    };
    return `${labels[freq]} — ${d}`;
  };

  useEffect(() => {
    if (initialReview) {
      setFrequency(initialReview.frequency);
      setTitle(initialReview.title);
      setDate(initialReview.date);
      setRating(initialReview.rating || 8);
      setFocusPillarId(initialReview.focus_pillar_id || 'all');
      setWins(initialReview.wins || '');
      setChallenges(initialReview.challenges || '');
      setLessons(initialReview.lessons || '');
      setNextCommitments(initialReview.next_commitments || '');
      setNotes(initialReview.notes || '');
      setHealthScore(initialReview.system_health_score || 80);
      setSmartSummary(initialReview.smart_summary || '');
      setStrengths(initialReview.strengths || []);
      setBottlenecks(initialReview.bottlenecks || []);
      setRecommendations(initialReview.recommendations || []);
      setActionItems(initialReview.action_items || []);
    } else {
      const todayStr = toLocalDateKey();
      setFrequency(defaultFrequency);
      setTitle(getDefaultTitle(defaultFrequency, todayStr));
      setDate(todayStr);
      setRating(8);
      setFocusPillarId(defaultFocusPillarId || 'all');
      setWins('');
      setChallenges('');
      setLessons('');
      setNextCommitments('');
      setNotes('');

      // Run automatic audit immediately for fresh draft
      runAutoAudit(defaultFrequency, defaultFocusPillarId || 'all');
    }
  }, [initialReview, isOpen, defaultFrequency, defaultFocusPillarId]);

  if (!isOpen) return null;

  // Run automated audit on the current system state
  function runAutoAudit(freq: ReviewFrequency, pillarIdFilter: string) {
    setIsGeneratingAudit(true);
    setTimeout(() => {
      const targetPillar = pillarIdFilter === 'all' ? null : pillarIdFilter;
      const audit = generateAutomatedAudit(freq, pillars, visions, goals, projects, tasks, targetPillar);
      setHealthScore(audit.system_health_score);
      setSmartSummary(audit.smart_summary);
      setStrengths(audit.strengths);
      setBottlenecks(audit.bottlenecks);
      setRecommendations(audit.recommendations);
      setActionItems(audit.suggested_actions);
      setIsGeneratingAudit(false);
    }, 250);
  }

  // Run deep strategic audit using Gemini AI
  async function runGeminiAiAudit() {
    setIsGeneratingAudit(true);
    try {
      const metrics = {
        totalPillars: pillars.length,
        totalProjects: projects.length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'done').length,
      };

      const aiResult = await performAiSmartReview(frequency, {
        wins,
        challenges,
        lessons,
        next_commitments: nextCommitments,
      }, metrics);

      if (aiResult) {
        if (aiResult.systemHealthScore) setHealthScore(aiResult.systemHealthScore);
        if (aiResult.smartSummary) setSmartSummary(aiResult.smartSummary);
        if (aiResult.strengths) setStrengths(aiResult.strengths);
        if (aiResult.bottlenecks) setBottlenecks(aiResult.bottlenecks);
        if (aiResult.recommendations) setRecommendations(aiResult.recommendations);
        if (aiResult.actionItems) {
          setActionItems(aiResult.actionItems.map((act: any, i: number) => ({
            id: `ai-act-${Date.now()}-${i}`,
            title: act.title,
            priority: act.priority || 'medium',
            project_id: projects[0]?.id,
            is_converted: false,
          })));
        }
      }
    } catch (err) {
      console.warn('AI review error, falling back to local audit', err);
      runAutoAudit(frequency, focusPillarId);
    } finally {
      setIsGeneratingAudit(false);
    }
  }

  const handleFrequencyChange = (newFreq: ReviewFrequency) => {
    setFrequency(newFreq);
    setTitle(getDefaultTitle(newFreq, date));
    runAutoAudit(newFreq, focusPillarId);
  };

  const handleAddActionItem = () => {
    if (!newActionTitle.trim()) return;
    const newItem: ReviewActionItem = {
      id: `act-${Date.now()}`,
      title: newActionTitle.trim(),
      priority: 'medium',
      project_id: projects[0]?.id,
      is_converted: false,
    };
    setActionItems([...actionItems, newItem]);
    setNewActionTitle('');
  };

  const handleRemoveActionItem = (id: string) => {
    setActionItems(actionItems.filter(item => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const targetPillar = focusPillarId === 'all' ? null : focusPillarId;
    const snapshot = generateSystemSnapshot(pillars, visions, goals, projects, tasks, targetPillar);

    onSaveReview({
      frequency,
      title: title.trim(),
      date,
      rating,
      focus_pillar_id: targetPillar,
      wins: wins.trim(),
      challenges: challenges.trim(),
      lessons: lessons.trim(),
      next_commitments: nextCommitments.trim(),
      notes: notes.trim(),
      snapshot,
      system_health_score: healthScore,
      smart_summary: smartSummary,
      strengths,
      bottlenecks,
      recommendations,
      action_items: actionItems,
    });

    onClose();
  };

  const frequencyOptions: { id: ReviewFrequency; label: string; period: string }[] = [
    { id: 'daily', label: 'يومية', period: 'سعة اليوم وما أُنجز' },
    { id: 'weekly', label: 'أسبوعية', period: 'حصيلة الأسبوع والبوصلة' },
    { id: 'monthly', label: 'شهرية', period: 'فحص أهداف القيمة' },
    { id: 'quarterly', label: 'ربع سنوية', period: 'مراجعة الرؤى والأولويات' },
    { id: 'yearly', label: 'سنوية', period: 'الغايات الكبرى والتأمل' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-[#e8e5de] dark:border-slate-800 overflow-hidden text-xs animate-in fade-in flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-b border-[#f0eee9] dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ebf4f0] text-[#174235] border border-[#cfe3d9] flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[#1a2420] dark:text-slate-100 dark:text-slate-100">
                {initialReview ? 'تعديل المراجعة' : 'مراجعة دورية شاملة'}
              </h3>
              <p className="text-[11px] text-[#6a7770] dark:text-slate-400">
                تأمل يدوي مع تشخيص تحليلي آلي مرتبط بالركائز والمشاريع والمهام
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#85918a] hover:text-[#1a2420] dark:text-slate-100 dark:hover:text-slate-100 hover:bg-[#f5f4ef] dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Frequency Tabs Selection */}
        <div className="p-3 bg-[#fbfbfa] dark:bg-slate-850 border-b border-[#f0eee9] dark:border-slate-800 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 min-w-max">
            {frequencyOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleFrequencyChange(opt.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer flex items-center gap-1.5 ${
                  frequency === opt.id
                    ? 'bg-[#174235] text-white shadow-2xs'
                    : 'text-[#56625b] dark:text-slate-300 hover:bg-[#ede9df] dark:hover:bg-slate-700'
                }`}
              >
                <span>{opt.label}</span>
                <span className="text-[10px] opacity-75 font-normal">({opt.period})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Top Parameters: Title, Date, Focus Pillar, Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#fbfbfa] dark:bg-slate-800/80 p-3.5 rounded-xl border border-[#ebe7df] dark:border-slate-700">
            <div className="sm:col-span-2">
              <label className="block font-bold text-[#35403a] dark:text-slate-300 mb-1">عنوان المراجعة: *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-[#d8d4cc] dark:border-slate-700 rounded-xl text-[#1a2420] dark:text-slate-100 dark:text-slate-100 focus:border-[#174235] font-semibold outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-[#35403a] dark:text-slate-300 mb-1">تاريخ المراجعة:</label>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-[#d8d4cc] dark:border-slate-700 rounded-xl px-3 py-2 text-[#1a2420] dark:text-slate-100 dark:text-slate-100">
                <Calendar className="w-4 h-4 text-[#8a968f]" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent w-full text-[#1a2420] dark:text-slate-100 outline-hidden font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#35403a] dark:text-slate-300 mb-1">الركيزة محل التركيز:</label>
              <CustomSelect
                value={focusPillarId}
                onChange={(val) => {
                  setFocusPillarId(val);
                  runAutoAudit(frequency, val);
                }}
                options={[
                  { value: 'all', label: 'كافة الركائز (منظومة الحياة الشاملة)' },
                  ...pillars.map(p => ({
                    value: p.id,
                    label: `${p.title} (${p.pillar_group})`
                  }))
                ]}
                prefixIcon={<Layers className="w-4 h-4 text-[#174235]" />}
                className="w-full"
                buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                dropdownClassName="w-full"
              />
            </div>

            {/* Self-Rating (1-10) */}
            <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#f0eee9] dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#35403a]">التقييم الذاتي العام للفترة:</span>
                <span className="text-[10px] text-[#78857e]">(درجة الرضا ومستوى الالتزام)</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    className={`w-7 h-7 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                      rating === num
                        ? 'bg-[#174235] text-white shadow-2xs scale-105'
                        : 'bg-white border border-[#dcd7ce] text-[#55615a] dark:text-slate-400 hover:bg-[#ede8df]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section Mode Switcher: Reflection vs. Smart Audit */}
          <div className="flex border-b border-[#e8e5de]">
            <button
              type="button"
              onClick={() => setActiveTab('reflection')}
              className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'reflection'
                  ? 'border-[#174235] text-[#174235]'
                  : 'border-transparent text-[#7d8982] dark:text-slate-400 hover:text-[#1a2420] dark:text-slate-100'
              }`}
            >
              <span>📝 التأمل والتدوين اليدوي</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('smart_audit')}
              className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'smart_audit'
                  ? 'border-[#174235] text-[#174235]'
                  : 'border-transparent text-[#7d8982] dark:text-slate-400 hover:text-[#1a2420] dark:text-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#174235]" />
              <span>التحليل الذكي التلقائي للمنظومة</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#ebf4f0] text-[#174235] font-mono">
                {healthScore}%
              </span>
            </button>
          </div>

          {/* TAB 1: MANUAL REFLECTION */}
          {activeTab === 'reflection' && (
            <div className="space-y-4">
              
              {/* Question 1: Wins */}
              <div>
                <label className="block font-bold text-[#1a2420] dark:text-slate-100 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#174235]" />
                  <span>أبرز الانتصارات والإنجازات:</span>
                </label>
                <textarea
                  rows={2}
                  value={wins}
                  onChange={(e) => setWins(e.target.value)}
                  placeholder="ما الأمور التي تمت بنجاح؟ ما المشاريع أو المهام التي أغلقتها وشعرت فيها بالفخر؟"
                  className="w-full p-2.5 bg-[#faf8f5] dark:bg-slate-800 border border-[#d8d4cc] dark:border-slate-700 rounded-xl text-[#1a2420] dark:text-slate-100 dark:text-slate-100 focus:border-[#174235] outline-hidden leading-relaxed"
                />
              </div>

              {/* Question 2: Challenges */}
              <div>
                <label className="block font-bold text-[#1a2420] dark:text-slate-100 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#b08726]" />
                  <span>المعوقات والتحديات:</span>
                </label>
                <textarea
                  rows={2}
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="ما الذي عطل وتيرتك؟ هل واجهت تشتتاً أو مهاماً تأخرت ولماذا؟"
                  className="w-full p-2.5 bg-[#faf8f5] dark:bg-slate-800 border border-[#d8d4cc] dark:border-slate-700 rounded-xl text-[#1a2420] dark:text-slate-100 dark:text-slate-100 focus:border-[#174235] outline-hidden leading-relaxed"
                />
              </div>

              {/* Question 3: Lessons Learned */}
              <div>
                <label className="block font-bold text-[#1a2420] dark:text-slate-100 mb-1 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#174235]" />
                  <span>الدروس المستفادة والتحسينات:</span>
                </label>
                <textarea
                  rows={2}
                  value={lessons}
                  onChange={(e) => setLessons(e.target.value)}
                  placeholder="ما الدرس الأساسي المستخلص من هذه الفترة لتطوير نظامك الشخصي؟"
                  className="w-full p-2.5 bg-[#faf8f5] dark:bg-slate-800 border border-[#d8d4cc] dark:border-slate-700 rounded-xl text-[#1a2420] dark:text-slate-100 dark:text-slate-100 focus:border-[#174235] outline-hidden leading-relaxed"
                />
              </div>

              {/* Question 4: Next Commitments */}
              <div>
                <label className="block font-bold text-[#1a2420] dark:text-slate-100 mb-1 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-[#174235]" />
                  <span>التزامات وأولويات الفترة القادمة:</span>
                </label>
                <textarea
                  rows={2}
                  value={nextCommitments}
                  onChange={(e) => setNextCommitments(e.target.value)}
                  placeholder="ما الأولويات الثلاث الكبرى التي ستبني عليها الفترة القادمة؟"
                  className="w-full p-2.5 bg-[#faf8f5] dark:bg-slate-800 border border-[#d8d4cc] dark:border-slate-700 rounded-xl text-[#1a2420] dark:text-slate-100 dark:text-slate-100 focus:border-[#174235] outline-hidden leading-relaxed"
                />
              </div>

              {/* General Notes */}
              <div>
                <label className="block font-semibold text-[#5c6861] mb-1">
                  ملاحظات وتأملات ملاحظات حرة:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي أفكار أو مشاعر أو تفاصيل إضافية تريد توثيقها..."
                  className="w-full p-2.5 bg-[#faf8f5] dark:bg-slate-800 border border-[#d8d4cc] dark:border-slate-700 rounded-xl text-[#1a2420] dark:text-slate-100 dark:text-slate-100 focus:border-[#174235] outline-hidden"
                />
              </div>

            </div>
          )}

          {/* TAB 2: SMART AUTOMATED AUDIT & RECOMMENDATIONS */}
          {activeTab === 'smart_audit' && (
            <div className="space-y-4">
              
              {/* Health Score Banner */}
              <div className="bg-[#ebf4f0] border border-[#cfe3d9] rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-[#174235]">
                      مؤشر صحة المنظومة والتنفيذ:
                    </span>
                    <span className="text-lg font-black font-mono text-[#174235]">
                      {healthScore}/100
                    </span>
                  </div>
                  <p className="text-[11px] text-[#426052]">
                    محسوب تلقائياً من وتيرة إنجاز المهام، ونسبة التأخير، وتوازن تقدم الركائز والمشاريع.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={runGeminiAiAudit}
                    disabled={isGeneratingAudit}
                    className="px-3 py-1.5 bg-[#174235] text-white hover:bg-[#12352a] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    title="تحليل استراتيجي عميق بالذكاء الاصطناعي"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isGeneratingAudit ? 'جاري التحليل...' : 'تشخيص Gemini الذكي'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => runAutoAudit(frequency, focusPillarId)}
                    disabled={isGeneratingAudit}
                    className="px-3 py-1.5 bg-white text-[#174235] border border-[#bcdbc9] hover:bg-[#faf9f6] rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>فحص محلي</span>
                  </button>
                </div>
              </div>

              {/* Smart Summary */}
              <div className="bg-[#faf8f4] border border-[#ece5da] rounded-xl p-3.5 text-xs text-[#362f25] leading-relaxed">
                <span className="font-bold block text-[11px] text-[#8f681a] mb-1 uppercase tracking-wide">
                  الملخص التحليلي الذكي:
                </span>
                <p className="font-medium">{smartSummary}</p>
              </div>

              {/* Strengths & Bottlenecks 2-col */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                {/* Strengths */}
                <div className="bg-white dark:bg-slate-850 border border-[#e8e5de] dark:border-slate-700/80 rounded-xl p-3.5 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#174235]">
                    <CheckCircle2 className="w-4 h-4 text-[#174235]" />
                    <span>مواطن القوة والزخم المرصودة</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-[#55615a] dark:text-slate-400">
                    {strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#174235] font-bold">✓</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottlenecks */}
                <div className="bg-white dark:bg-slate-850 border border-[#e8e5de] dark:border-slate-700/80 rounded-xl p-3.5 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#a63e26]">
                    <AlertTriangle className="w-4 h-4 text-[#a63e26]" />
                    <span>نقاط الاختناق والتأخير</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-[#55615a] dark:text-slate-400">
                    {bottlenecks.length === 0 ? (
                      <li className="text-[#78857e] italic">لا توجد اختناقات بارزة حالياً!</li>
                    ) : (
                      bottlenecks.map((bot, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#a63e26] font-bold">•</span>
                          <span>{bot}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

              </div>

              {/* Actionable Recommendations */}
              <div className="bg-white dark:bg-slate-850 border border-[#e8e5de] dark:border-slate-700/80 rounded-xl p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-[#1a2420] dark:text-slate-100">
                  <Lightbulb className="w-4 h-4 text-[#174235]" />
                  <span>توصيات إجرائية تلقائية لهذه الدورة</span>
                </div>
                <div className="space-y-1.5">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-[#faf8f5] dark:bg-slate-800 border border-[#ece8df] dark:border-slate-700 text-[11px] text-[#3e4842] flex items-start gap-2">
                      <span className="font-bold text-[#174235]">{idx + 1}.</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items Generator (Directly relatable to tasks!) */}
              <div className="bg-white dark:bg-slate-850 border border-[#e8e5de] dark:border-slate-700/80 rounded-xl p-3.5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[#1a2420] dark:text-slate-100">
                    <Activity className="w-4 h-4 text-[#174235]" />
                    <span>إجراءات تنفيذية مستخرجة</span>
                  </div>
                  <span className="text-[10px] text-[#7d8982] dark:text-slate-400">
                    يمكن تحويلها لمهام حقيقية بنقرة واحدة داخل أي مشروع
                  </span>
                </div>

                {/* Add new action item */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="أضف إجراءً عملياً سريعاً ناتجاً عن هذه المراجعة..."
                    value={newActionTitle}
                    onChange={(e) => setNewActionTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddActionItem();
                      }
                    }}
                    className="flex-1 p-2 bg-[#faf8f5] dark:bg-slate-800 border border-[#d8d4cc] dark:border-slate-700 rounded-xl text-xs text-[#1a2420] dark:text-slate-100 dark:text-slate-100 outline-hidden focus:border-[#174235] dark:focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddActionItem}
                    className="px-3 py-2 bg-[#ebf4f0] text-[#174235] border border-[#cfe3d9] hover:bg-[#d8ece2] rounded-xl font-bold transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Action Items List */}
                <div className="space-y-2">
                  {actionItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#fbfbfa] dark:bg-slate-800 border border-[#ece8df] dark:border-slate-700 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-[#174235] shrink-0" />
                        <span className="truncate font-medium text-[#1a2420] dark:text-slate-100">{item.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {projects.length > 0 && (
                          <CustomSelect
                            value={item.project_id || projects[0]?.id}
                            onChange={(val) => {
                              const updated = actionItems.map(ai => 
                                ai.id === item.id ? { ...ai, project_id: val } : ai
                              );
                              setActionItems(updated);
                            }}
                            options={projects.map(p => ({ value: p.id, label: p.title }))}
                            size="xs"
                            buttonClassName="py-0.5 px-2 text-[10px] rounded-lg max-w-[130px]"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveActionItem(item.id)}
                          className="p-1 text-[#838f87] hover:text-rose-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#f0eee9] dark:border-slate-800 shrink-0">
            <div className="text-[11px] text-[#7d8982] dark:text-slate-400">
              يتم حفظ لقطة إحصائية للمنظومة لتوثيق تطور الأداء بمرور الوقت.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#f4f2ec] dark:bg-slate-800 hover:bg-[#eae6dd] dark:hover:bg-slate-700 text-[#4a554f] dark:text-slate-300 rounded-xl font-bold cursor-pointer transition-colors border border-transparent dark:border-slate-700"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12352a] dark:hover:bg-emerald-800 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer"
              >
                حفظ المراجعة الآن
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
