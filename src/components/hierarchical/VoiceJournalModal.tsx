import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  Check, 
  Loader2, 
  Calendar, 
  Heart, 
  Trophy, 
  CheckSquare, 
  Tag, 
  Volume2, 
  AlertCircle,
  RotateCcw,
  Sparkle
} from 'lucide-react';
import { JournalEntry, MoodType, EnergyLevel, Project } from '../../types/hierarchical';
import { analyzeVoiceJournal, AiJournalAnalysis } from '../../services/aiService';

interface VoiceJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveJournal: (
    entry: Partial<JournalEntry>,
    createTasks?: { title: string; priority?: 'high' | 'medium' | 'low'; estimated_hours?: number; projectId?: string }[]
  ) => void;
  projects: Project[];
}

const MOOD_CONFIG: Record<MoodType, { label: string; icon: string; color: string; border: string; bg: string }> = {
  great: { label: 'رائع ومتحمس', icon: '🌟', color: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  good: { label: 'جيد ومنتج', icon: '😊', color: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  calm: { label: 'هادئ ومطمئن', icon: '🧘', color: 'text-teal-700 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-700', bg: 'bg-teal-50 dark:bg-teal-950/40' },
  neutral: { label: 'عادي وطبيعي', icon: '😐', color: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700', bg: 'bg-slate-50 dark:bg-slate-900/40' },
  tired: { label: 'مجهد وبحاجة لراحة', icon: '🌧️', color: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700', bg: 'bg-blue-50 dark:bg-blue-950/40' },
  stressed: { label: 'مضغوط ومشتت', icon: '⚡', color: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-700', bg: 'bg-rose-50 dark:bg-rose-950/40' },
};

export const VoiceJournalModal: React.FC<VoiceJournalModalProps> = ({
  isOpen,
  onClose,
  onSaveJournal,
  projects,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [rawText, setRawText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // AI analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiJournalAnalysis | null>(null);

  // Extracted tasks selection
  const [selectedTasksIndices, setSelectedTasksIndices] = useState<number[]>([]);
  const [targetProjectId, setTargetProjectId] = useState<string>(projects[0]?.id || '');

  // Speech Recognition ref
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Timer while recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Clean close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isRecording) stopRecording();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRecording]);

  const startRecording = () => {
    setSpeechError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setSpeechError('المتصفح الحالي لا يدعم التعرف الصوتي المباشر، يمكنك الكتابة في المربع.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const combined = (final + (interim ? ' ' + interim : '')).trim();
        if (combined) {
          setRawText((prev) => {
            // If already had text and started fresh, append gracefully
            return combined;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('يرجى السماح للتطبيق باستخدام الميكروفون لتسجيل اليوميات.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`تنبيه في التسجيل الصوتي (${event.error})`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('تعذر تفعيل الميكروفون، يمكنك كتابة اليوميات يدوياً.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsRecording(false);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Run AI Analysis
  const handleAnalyzeWithAi = async () => {
    if (!rawText.trim()) {
      setSpeechError('يرجى التحدث أو كتابة اليوميات أولاً لتحليلها بالذكاء الاصطناعي.');
      return;
    }

    if (isRecording) {
      stopRecording();
    }

    setIsAnalyzing(true);
    setSpeechError(null);

    try {
      const result = await analyzeVoiceJournal(rawText.trim(), selectedDate);
      setAiAnalysis(result);
      // Select all extracted tasks by default
      if (result.extracted_tasks && result.extracted_tasks.length > 0) {
        setSelectedTasksIndices(result.extracted_tasks.map((_, i) => i));
      }
    } catch (err: any) {
      console.error('AI journal analysis failed:', err);
      setSpeechError('تعذر تحليل اليوميات بواسطة الذكاء الاصطناعي، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleTaskSelection = (idx: number) => {
    setSelectedTasksIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Save Journal Entry
  const handleSave = () => {
    const finalTitle = aiAnalysis?.title || rawText.slice(0, 40) + '...';
    const finalContent = aiAnalysis?.formatted_content || rawText;

    const entryData: Partial<JournalEntry> = {
      date: selectedDate,
      title: finalTitle,
      content: finalContent,
      mood: aiAnalysis?.mood || 'good',
      energy_level: aiAnalysis?.energy_level || 'medium',
      gratitude: aiAnalysis?.gratitude || [],
      wins: aiAnalysis?.wins || [],
      ai_summary: aiAnalysis?.title ? `مذكرات يوم: ${selectedDate}` : undefined,
      ai_insights: aiAnalysis?.ai_insights,
      extracted_tasks: aiAnalysis?.extracted_tasks || [],
      voice_recorded: true,
      tags: aiAnalysis?.suggested_tags || ['يوميات', 'صوتي'],
      created_at: new Date().toISOString(),
    };

    // Prepare selected tasks for creation
    let tasksToCreate: any[] = [];
    if (aiAnalysis?.extracted_tasks && selectedTasksIndices.length > 0) {
      tasksToCreate = selectedTasksIndices.map((idx) => {
        const t = aiAnalysis.extracted_tasks[idx];
        return {
          title: t.title,
          priority: t.priority || 'medium',
          estimated_hours: t.estimated_hours || 1,
          projectId: targetProjectId || projects[0]?.id,
        };
      });
    }

    onSaveJournal(entryData, tasksToCreate);
    onClose();
    // Reset state
    setRawText('');
    setAiAnalysis(null);
    setSelectedTasksIndices([]);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-journal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="bg-white dark:bg-[#15221b] border border-[#d6ded9] dark:border-[#25392d] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl transition-all my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-linear-to-r from-[#174235] to-[#205747] dark:from-[#11241a] dark:to-[#173827] px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 id="voice-journal-title" className="text-base font-black flex items-center gap-2">
                <span>يومياتي وتأملاتي الصوتية (Voice Journal)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  ذكاء اصطناعي
                </span>
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                تحدث بحرية باللغة العربية، وسيقوم الذكاء الاصطناعي بتنظيم يومياتك واستخراج المهام ونقاط الامتنان.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isRecording) stopRecording();
              onClose();
            }}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Date & Mode Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f0ede6] dark:border-[#24372c] text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#65756b] dark:text-[#8ea095] font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
                <span>تاريخ اليوميات:</span>
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1 bg-white dark:bg-[#192620] border border-[#d6dfd9] dark:border-[#283d31] rounded-lg text-xs font-semibold text-[#1a2420] dark:text-white"
              />
            </div>

            <div className="text-xs text-[#718278] dark:text-[#8ea095]">
              اللغة المدعومة: <span className="font-bold text-[#174235] dark:text-emerald-400">العربية (الفصحى واللهجات)</span>
            </div>
          </div>

          {/* Voice Recording Center */}
          <div className="bg-[#faf9f6] dark:bg-[#121c17] border border-[#e8e4db] dark:border-[#23352b] rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
            
            {/* Animated Recording Wave Rings */}
            {isRecording && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                <div className="w-32 h-32 rounded-full bg-rose-500/10 animate-ping duration-1000" />
                <div className="w-48 h-48 rounded-full bg-rose-500/5 animate-pulse duration-700" />
              </div>
            )}

            {/* Mic Big Button */}
            <button
              type="button"
              onClick={handleToggleRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-md cursor-pointer relative z-10 ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-700 scale-105 ring-4 ring-rose-300 dark:ring-rose-900/50'
                  : 'bg-[#174235] dark:bg-emerald-600 hover:bg-[#12362b] dark:hover:bg-emerald-700 hover:scale-105'
              }`}
              title={isRecording ? 'إيقاف التسجيل' : 'بدء التحدث والتسجيل الصوتي'}
            >
              {isRecording ? (
                <MicOff className="w-7 h-7 animate-pulse" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>

            {/* Status & Timer */}
            <div className="relative z-10 space-y-0.5">
              {isRecording ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    جاري الاستماع والتسجيل... ({formatTimer(recordingSeconds)})
                  </span>
                </div>
              ) : (
                <span className="text-xs font-bold text-[#45524a] dark:text-[#b4c4ba]">
                  انقر على الميكروفون وتحدث عن يومك وإنجازاتك ومشاعرك
                </span>
              )}
              <p className="text-[11px] text-[#78857e] dark:text-[#8ea095]">
                {isRecording ? 'تحدث بتلقائية، وعند الانتهاء انقر على الميكروفون مجدداً' : 'يمكنك التحدث أو تعديل النص يدوياً في الأسفل'}
              </p>
            </div>
          </div>

          {/* Speech Error Warning */}
          {speechError && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{speechError}</span>
            </div>
          )}

          {/* Transcript / Input Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="journal-raw-text" className="font-bold text-[#1a2420] dark:text-white">
                النص الصوتي المباشر أو المكتوب:
              </label>
              {rawText && (
                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    setAiAnalysis(null);
                  }}
                  className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>مسح النص</span>
                </button>
              )}
            </div>
            <textarea
              id="journal-raw-text"
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="تحدث أو اكتب هنا: مثلاً: اليوم كان يوم ممتاز، خلصت تقرير المبيعات وحسيت برضا كبير، بس محتاج بكرة أكلم المورد، وممتن لوجود أصدقائي جنبي..."
              className="w-full p-3 bg-white dark:bg-[#16211b] border border-[#d6dfd9] dark:border-[#283d31] rounded-xl text-xs text-[#1a2420] dark:text-white focus:ring-2 focus:ring-[#174235] dark:focus:ring-emerald-500 focus:outline-hidden leading-relaxed resize-none"
            />
          </div>

          {/* AI Trigger Action */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={isAnalyzing || !rawText.trim()}
              onClick={handleAnalyzeWithAi}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isAnalyzing || !rawText.trim()
                  ? 'opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-500'
                  : 'bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحليل واستخراج الأفكار بواسطة الذكاء الاصطناعي...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>تحليل بالذكاء الاصطناعي وتلخيص اليوميات (AI Analyze)</span>
                </>
              )}
            </button>
          </div>

          {/* AI Analysis Structured Result Card */}
          {aiAnalysis && (
            <div className="bg-[#f5f9f6] dark:bg-[#16261e] border border-[#bcd9c7] dark:border-[#264734] rounded-2xl p-4.5 space-y-4 animate-in fade-in duration-300">
              
              {/* Header with Title and Mood */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#cfe2d7] dark:border-[#254231]">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    العنوان الملهم المقترح
                  </span>
                  <h3 className="text-sm font-black text-[#174235] dark:text-white">
                    {aiAnalysis.title}
                  </h3>
                </div>

                {/* Mood Badge */}
                {aiAnalysis.mood && MOOD_CONFIG[aiAnalysis.mood] && (
                  <div className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 self-start sm:self-auto ${MOOD_CONFIG[aiAnalysis.mood].bg} ${MOOD_CONFIG[aiAnalysis.mood].border} ${MOOD_CONFIG[aiAnalysis.mood].color}`}>
                    <span>{MOOD_CONFIG[aiAnalysis.mood].icon}</span>
                    <span>{MOOD_CONFIG[aiAnalysis.mood].label}</span>
                  </div>
                )}
              </div>

              {/* Formatted Content Preview */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#55695e] dark:text-[#9bb0a3]">
                  المذكرات المصاغة بأسلوب أدبي مرتب:
                </span>
                <div className="p-3 bg-white dark:bg-[#121c17] border border-[#d6ded9] dark:border-[#203227] rounded-xl text-xs text-[#202c25] dark:text-[#e2ece6] leading-relaxed whitespace-pre-line">
                  {aiAnalysis.formatted_content}
                </div>
              </div>

              {/* Gratitude & Wins 2-column strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Gratitude */}
                {aiAnalysis.gratitude && aiAnalysis.gratitude.length > 0 && (
                  <div className="p-3 bg-white dark:bg-[#121c17] border border-[#d6ded9] dark:border-[#203227] rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      <span>نقاط الامتنان وتقدير النعم:</span>
                    </div>
                    <ul className="space-y-1 text-xs text-[#425048] dark:text-[#c4d4cb]">
                      {aiAnalysis.gratitude.map((g, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold">·</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Wins */}
                {aiAnalysis.wins && aiAnalysis.wins.length > 0 && (
                  <div className="p-3 bg-white dark:bg-[#121c17] border border-[#d6ded9] dark:border-[#203227] rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>إنجازات وانتصارات اليوم:</span>
                    </div>
                    <ul className="space-y-1 text-xs text-[#425048] dark:text-[#c4d4cb]">
                      {aiAnalysis.wins.map((w, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">·</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Extracted Tasks (Can be directly converted to Tasks!) */}
              {aiAnalysis.extracted_tasks && aiAnalysis.extracted_tasks.length > 0 && (
                <div className="p-3.5 bg-white dark:bg-[#121c17] border border-[#d6ded9] dark:border-[#203227] rounded-xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#174235] dark:text-emerald-400">
                      <CheckSquare className="w-4 h-4" />
                      <span>مهام والتزامات مستخلصة من كلامك (حدد ما تود إضافته لقائمتك):</span>
                    </div>

                    {/* Project Selector for created tasks */}
                    {projects.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[#6d7c73] dark:text-[#8ea095]">لصالح مشروع:</span>
                        <select
                          value={targetProjectId}
                          onChange={(e) => setTargetProjectId(e.target.value)}
                          className="px-2 py-1 bg-[#f4f2ed] dark:bg-[#192620] border border-[#d6dfd9] dark:border-[#283d31] rounded-lg text-xs font-semibold text-[#1a2420] dark:text-white"
                        >
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {aiAnalysis.extracted_tasks.map((task, idx) => {
                      const isSelected = selectedTasksIndices.includes(idx);
                      return (
                        <label
                          key={idx}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#ebf4ef] dark:bg-[#192d22] border-[#b0d4bf] dark:border-[#284f37]'
                              : 'bg-[#faf9f6] dark:bg-[#16211a] border-[#e8e5de] dark:border-[#25372d] opacity-70'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleTaskSelection(idx)}
                              className="w-4 h-4 text-[#174235] dark:text-emerald-500 rounded cursor-pointer accent-[#174235]"
                            />
                            <span className="font-bold text-[#1a2420] dark:text-white">
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="font-mono text-[#78857e] dark:text-[#8ea095]">
                              {task.estimated_hours || 1} س
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                task.priority === 'high'
                                  ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                                  : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {task.priority === 'high' ? 'عالية' : 'معتدلة'}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI Wisdom & Insight */}
              {aiAnalysis.ai_insights && (
                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-2.5">
                  <Sparkle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-900 dark:text-emerald-200 italic leading-relaxed">
                    «{aiAnalysis.ai_insights}»
                  </p>
                </div>
              )}

              {/* Tags */}
              {aiAnalysis.suggested_tags && aiAnalysis.suggested_tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <Tag className="w-3 h-3 text-[#78857e] dark:text-[#8ea095]" />
                  <span className="text-[#78857e] dark:text-[#8ea095]">الوسوم:</span>
                  {aiAnalysis.suggested_tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-white dark:bg-[#16211a] border border-[#d6dfd9] dark:border-[#283d31] rounded-md text-[11px] font-semibold text-[#174235] dark:text-emerald-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#faf9f6] dark:bg-[#131d18] border-t border-[#e8e4db] dark:border-[#25392d] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (isRecording) stopRecording();
              onClose();
            }}
            className="px-4 py-2 bg-white dark:bg-[#1a2620] hover:bg-[#edeae2] dark:hover:bg-[#22332a] text-[#55645b] dark:text-[#9bb0a3] border border-[#d8d4cc] dark:border-[#2c3d33] rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            disabled={!rawText.trim()}
            onClick={handleSave}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              !rawText.trim()
                ? 'opacity-50 cursor-not-allowed bg-slate-300 dark:bg-slate-800 text-slate-500'
                : 'bg-[#174235] dark:bg-emerald-600 hover:bg-[#12362b] dark:hover:bg-emerald-700 text-white'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>حفظ اليوميات في دوّنلي</span>
            {selectedTasksIndices.length > 0 && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono">
                +{selectedTasksIndices.length} مهام
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
