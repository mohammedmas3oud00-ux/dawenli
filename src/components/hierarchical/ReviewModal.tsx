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
  Activity,
  Lightbulb,
  ArrowRight,
  Bot,
  Loader2
} from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { generateAiCoachReview, AiCoachInsight } from '../../services/aiService';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReview: (review: Partial<SystemReview>) => void;
  initialReview?: SystemReview | null;
  defaultFrequency?: ReviewFrequency;
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
  pillars,
  visions,
  goals,
  projects,
  tasks,
}) => {
  const [frequency, setFrequency] = useState<ReviewFrequency>(defaultFrequency);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
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
  const [aiCoachLoading, setAiCoachLoading] = useState(false);
  const [aiCoachInsight, setAiCoachInsight] = useState<AiCoachInsight | null>(null);

  const handleConsultAiCoach = async () => {
    setAiCoachLoading(true);
    try {
      const insight = await generateAiCoachReview(
        {
          completedTasks: tasks.filter(t => t.status === 'done').length,
          totalTasks: tasks.length,
          activeProjects: projects.filter(p => p.status === 'in_progress').length,
          overallTaskProgress: Math.round(
            (tasks.filter(t => t.status === 'done').length / Math.max(1, tasks.length)) * 100
          ),
          totalLoggedHours: tasks.reduce((sum, t) => sum + ((t as any).logged_hours || (t as any).estimated_hours || 1), 0),
        },
        pillars.map(p => p.title)
      );
      setAiCoachInsight(insight);
    } catch (err) {
      console.error(err);
    } finally {
      setAiCoachLoading(false);
    }
  };

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      const todayStr = new Date().toISOString().split('T')[0];
      setFrequency(defaultFrequency);
      setTitle(getDefaultTitle(defaultFrequency, todayStr));
      setDate(todayStr);
      setRating(8);
      setFocusPillarId('all');
      setWins('');
      setChallenges('');
      setLessons('');
      setNextCommitments('');
      setNotes('');

      // Run automatic audit immediately for fresh draft
      runAutoAudit(defaultFrequency, 'all');
    }
  }, [initialReview, isOpen, defaultFrequency]);

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
    { id: 'monthly', label: 'شهرية', period: 'فحص الأهداف' },
    { id: 'quarterly', label: 'ربع سنوية', period: 'مراجعة الرؤى' },
    { id: 'yearly', label: 'سنوية', period: 'الغايات الكبرى' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-[#16201b] rounded-2xl max-w-2xl w-full shadow-2xl border border-[#e8e5de] dark:border-[#26372d] overflow-hidden text-xs flex flex-col my-auto max-h-[92vh] transition-colors">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1b2620] border-b border-[#f0eee9] dark:border-[#223028] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#264434] flex items-center justify-center font-bold" aria-hidden="true">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 id="review-modal-title" className="font-bold text-sm text-[#1a2420] dark:text-white">
                {initialReview ? 'تعديل المراجعة' : 'مراجعة دورية للمنظومة'}
              </h3>
              <p className="text-[11px] text-[#6a7770] dark:text-[#9bb0a3]">
                تأمل ذاتي مع تشخيص تحليلي آلي لمستوى الإنجاز
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-1.5 rounded-lg text-[#85918a] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white hover:bg-[#f5f4ef] dark:hover:bg-[#22332a] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Frequency Tabs Selection */}
        <div className="p-3 bg-[#fbfbfa] dark:bg-[#121c17] border-b border-[#f0eee9] dark:border-[#223028] overflow-x-auto shrink-0 scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {frequencyOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleFrequencyChange(opt.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden ${
                  frequency === opt.id
                    ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-2xs'
                    : 'text-[#56625b] dark:text-[#9bb0a3] hover:bg-[#ede9df] dark:hover:bg-[#1a2620]'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#fbfbfa] dark:bg-[#192620] p-3.5 rounded-xl border border-[#ebe7df] dark:border-[#24372d]">
            <div className="sm:col-span-2">
              <label className="block font-bold text-[#35403a] dark:text-[#c4d6cb] mb-1">عنوان المراجعة: *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 font-semibold outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-[#35403a] dark:text-[#c4d6cb] mb-1">تاريخ المراجعة:</label>
              <div className="flex items-center gap-2 bg-white dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl px-3 py-2">
                <Calendar className="w-4 h-4 text-[#8a968f]" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent w-full text-[#1a2420] dark:text-white outline-hidden font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#35403a] dark:text-[#c4d6cb] mb-1">مجال التركيز:</label>
              <CustomSelect
                value={focusPillarId}
                onChange={(val) => {
                  setFocusPillarId(val);
                  runAutoAudit(frequency, val);
                }}
                options={[
                  { value: 'all', label: 'كافة مجالات الحياة' },
                  ...pillars.map(p => ({
                    value: p.id,
                    label: `${p.title} (${p.pillar_group})`
                  }))
                ]}
                prefixIcon={<Layers className="w-4 h-4 text-[#174235] dark:text-emerald-400" />}
                className="w-full"
                buttonClassName="w-full rounded-xl py-2 px-3 text-xs"
                dropdownClassName="w-full"
              />
            </div>

            {/* Self-Rating (1-10) */}
            <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#f0eee9] dark:border-[#26372d]">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#35403a] dark:text-[#c4d6cb]">التقييم الذاتي للفترة:</span>
                <span className="text-[10px] text-[#78857e] dark:text-[#9bb0a3]">(درجة الرضا والالتزام)</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    className={`w-7 h-7 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                      rating === num
                        ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-2xs scale-105'
                        : 'bg-white dark:bg-[#121c17] border border-[#dcd7ce] dark:border-[#283d31] text-[#55615a] dark:text-[#9bb0a3] hover:bg-[#ede8df] dark:hover:bg-[#1e2a22]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section Mode Switcher: Reflection vs. Smart Audit */}
          <div className="flex border-b border-[#e8e5de] dark:border-[#26372d]">
            <button
              type="button"
              onClick={() => setActiveTab('reflection')}
              className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'reflection'
                  ? 'border-[#174235] dark:border-emerald-500 text-[#174235] dark:text-emerald-400'
                  : 'border-transparent text-[#7d8982] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white'
              }`}
            >
              <span>📝 التأمل والتدوين</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('smart_audit')}
              className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'smart_audit'
                  ? 'border-[#174235] dark:border-emerald-500 text-[#174235] dark:text-emerald-400'
                  : 'border-transparent text-[#7d8982] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
              <span>التحليل الذكي التلقائي</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 font-mono">
                {healthScore}%
              </span>
            </button>
          </div>

          {/* TAB 1: MANUAL REFLECTION */}
          {activeTab === 'reflection' && (
            <div className="space-y-4">
              
              {/* Question 1: Wins */}
              <div>
                <label className="block font-bold text-[#1a2420] dark:text-white mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
                  <span>أبرز الإنجازات والانتصارات (Wins):</span>
                </label>
                <textarea
                  rows={2}
                  value={wins}
                  onChange={(e) => setWins(e.target.value)}
                  placeholder="ما الأمور التي تمت بنجاح وشعرت فيها بالفخر؟"
                  className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 outline-hidden leading-relaxed"
                />
              </div>

              {/* Question 2: Challenges */}
              <div>
                <label className="block font-bold text-[#1a2420] dark:text-white mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>المعوقات والتحديات (Bottlenecks):</span>
                </label>
                <textarea
                  rows={2}
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="ما الذي عطل وتيرتك؟ هل واجهت تشتتاً أو مهاماً تأخرت ولماذا؟"
                  className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 outline-hidden leading-relaxed"
                />
              </div>

              {/* Question 3: Lessons Learned */}
              <div>
                <label className="block font-bold text-[#1a2420] dark:text-white mb-1 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
                  <span>الدروس المستفادة (Lessons):</span>
                </label>
                <textarea
                  rows={2}
                  value={lessons}
                  onChange={(e) => setLessons(e.target.value)}
                  placeholder="ما الدرس الأساسي لتطوير نظامك وإنتاجيتك؟"
                  className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 outline-hidden leading-relaxed"
                />
              </div>

              {/* Question 4: Next Commitments */}
              <div>
                <label className="block font-bold text-[#1a2420] dark:text-white mb-1 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
                  <span>أولويات الفترة القادمة (Commitments):</span>
                </label>
                <textarea
                  rows={2}
                  value={nextCommitments}
                  onChange={(e) => setNextCommitments(e.target.value)}
                  placeholder="ما الأولويات الثلاث الكبرى للفترة القادمة؟"
                  className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 outline-hidden leading-relaxed"
                />
              </div>

              {/* General Notes */}
              <div>
                <label className="block font-semibold text-[#5c6861] dark:text-[#9bb0a3] mb-1">
                  ملاحظات حرة (Notes):
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي أفكار أو تفاصيل إضافية تريد توثيقها..."
                  className="w-full p-2.5 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-[#1a2420] dark:text-white focus:border-[#174235] dark:focus:border-emerald-500 outline-hidden"
                />
              </div>

            </div>
          )}

          {/* TAB 2: SMART AUTOMATED AUDIT & RECOMMENDATIONS */}
          {activeTab === 'smart_audit' && (
            <div className="space-y-4">
              
              {/* Health Score Banner */}
              <div className="bg-[#ebf4f0] dark:bg-[#192820] border border-[#cfe3d9] dark:border-[#243d2f] rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#174235] dark:text-emerald-400">
                      مؤشر صحة المنظومة والتنفيذ:
                    </span>
                    <span className="text-lg font-bold font-mono text-[#174235] dark:text-emerald-400">
                      {healthScore}/100
                    </span>
                  </div>
                  <p className="text-[11px] text-[#426052] dark:text-[#9bb0a3]">
                    محسوب تلقائياً من وتيرة إنجاز المهام، ومعدل التأخير، وتوازن تقدم المشاريع.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => runAutoAudit(frequency, focusPillarId)}
                  disabled={isGeneratingAudit}
                  className="px-3 py-1.5 bg-white dark:bg-[#121c17] text-[#174235] dark:text-emerald-400 border border-[#bcdbc9] dark:border-[#264434] hover:bg-[#faf9f6] dark:hover:bg-[#1b2620] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingAudit ? 'جاري الفحص...' : 'إعادة الفحص'}</span>
                </button>
              </div>

              {/* Smart Summary */}
              <div className="bg-[#faf8f4] dark:bg-[#1b251f] border border-[#ece5da] dark:border-[#28382e] rounded-xl p-3.5 text-xs text-[#362f25] dark:text-[#d7e4dc] leading-relaxed">
                <span className="font-bold block text-[11px] text-[#8f681a] dark:text-amber-400 mb-1 uppercase tracking-wide">
                  الملخص التحليلي التلقائي:
                </span>
                <p className="font-medium">{smartSummary}</p>
              </div>

              {/* AI Coach Review (Gemini 3.8 Flash) */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-[#14231b] dark:to-[#172c22] border border-emerald-200 dark:border-[#264434] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span className="font-bold text-xs text-[#174235] dark:text-emerald-300">
                      المستشار الاستراتيجي الذكي (Gemini AI Coach)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleConsultAiCoach}
                    disabled={aiCoachLoading}
                    className="px-3 py-1.5 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12362b] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {aiCoachLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري التحليل...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                        <span>{aiCoachInsight ? 'تحديث الاستشارة الذكية' : 'استشارة الموجه الذكي'}</span>
                      </>
                    )}
                  </button>
                </div>

                {aiCoachInsight ? (
                  <div className="space-y-2.5 pt-1">
                    <p className="text-xs text-[#24332a] dark:text-[#d6e5dc] leading-relaxed font-medium bg-white/70 dark:bg-black/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                      "{aiCoachInsight.coach_advice}"
                    </p>
                    {aiCoachInsight.action_recommendations?.length > 0 && (
                      <div className="text-[11px] text-[#3d4f43] dark:text-[#b4c9be] space-y-1">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                          توصيات مقترحة للأسبوع المقبل:
                        </span>
                        {aiCoachInsight.action_recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#617167] dark:text-[#9bb0a3]">
                    انقر على "استشارة الموجه الذكي" لتحليل إنجازك الأسبوعي وساعات العمل المسجلة ونسب تقدم المشاريع وتقديم نصائح وتوجيهات مصممة خصيصاً لك.
                  </p>
                )}
              </div>

              {/* Strengths & Bottlenecks 2-col */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                {/* Strengths */}
                <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-xl p-3.5 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#174235] dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
                    <span>مواطن القوة والزخم</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-[#55615a] dark:text-[#a0b3a7]">
                    {strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#174235] dark:text-emerald-400 font-bold">✓</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottlenecks */}
                <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-xl p-3.5 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>نقاط الاختناق والتأخير</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-[#55615a] dark:text-[#a0b3a7]">
                    {bottlenecks.length === 0 ? (
                      <li className="text-[#78857e] dark:text-[#7a8a81] italic">لا توجد اختناقات حالياً!</li>
                    ) : (
                      bottlenecks.map((bot, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{bot}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

              </div>

              {/* Actionable Recommendations */}
              <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-xl p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-[#1a2420] dark:text-white">
                  <Lightbulb className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
                  <span>توصيات مقترحة</span>
                </div>
                <div className="space-y-1.5">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-[#faf8f5] dark:bg-[#18231c] border border-[#ece8df] dark:border-[#233328] text-[11px] text-[#3e4842] dark:text-[#c4d6cb] flex items-start gap-2">
                      <span className="font-bold text-[#174235] dark:text-emerald-400">{idx + 1}.</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items Generator */}
              <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-xl p-3.5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[#1a2420] dark:text-white">
                    <Activity className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
                    <span>إجراءات تنفيذية مستخرجة (Action Items)</span>
                  </div>
                  <span className="text-[10px] text-[#7d8982] dark:text-[#8ea095]">
                    يمكن تحويلها لمهام داخل المشاريع
                  </span>
                </div>

                {/* Add new action item */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="أضف إجراءً عملياً سريعاً ناتجاً عن المراجعة..."
                    value={newActionTitle}
                    onChange={(e) => setNewActionTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddActionItem();
                      }
                    }}
                    className="flex-1 p-2 bg-[#faf8f5] dark:bg-[#121c17] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-xs text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddActionItem}
                    className="px-3 py-2 bg-[#ebf4f0] dark:bg-[#182b21] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#264434] hover:bg-[#d8ece2] dark:hover:bg-[#1f362a] rounded-xl font-bold transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Action Items List */}
                <div className="space-y-2">
                  {actionItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#fbfbfa] dark:bg-[#16211a] border border-[#ece8df] dark:border-[#24372c] text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-[#174235] dark:bg-emerald-400 shrink-0" />
                        <span className="truncate font-medium text-[#1a2420] dark:text-[#dbe6df]">{item.title}</span>
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
                          aria-label="حذف الإجراء"
                          className="p-1 text-[#838f87] dark:text-[#8ea095] hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer"
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
          <div className="flex items-center justify-between pt-4 border-t border-[#f0eee9] dark:border-[#223028] shrink-0">
            <div className="text-[11px] text-[#7d8982] dark:text-[#8ea095]">
              يتم حفظ لقطة إحصائية للمنظومة لتوثيق تطور الأداء.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#f4f2ec] dark:bg-[#1a2620] hover:bg-[#eae6dd] dark:hover:bg-[#22332a] text-[#4a554f] dark:text-[#c4d6cb] rounded-xl font-bold cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden"
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
