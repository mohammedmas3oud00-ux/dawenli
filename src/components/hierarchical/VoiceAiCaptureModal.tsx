import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  Check, 
  FolderPlus, 
  CheckSquare, 
  ArrowRight, 
  Zap, 
  Clock, 
  Battery, 
  Layers, 
  AlertCircle,
  Play,
  Square,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { Pillar, Project, ValueGoal, Task } from '../../types/hierarchical';
import { 
  deduplicateArabicSpeech, 
  analyzeVoiceInput, 
  AiVoiceAnalysisResult,
  transcribeAudioBlob
} from '../../utils/speechRecognition';

interface VoiceAiCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  pillars: Pillar[];
  projects: Project[];
  goals: ValueGoal[];
  onCommitHierarchy: (data: {
    pillarId: string;
    goalId?: string;
    projectTitle: string;
    projectDescription?: string;
    tasks: Array<{
      title: string;
      description?: string;
      priority: 'high' | 'medium' | 'low';
      energyLevel?: 'high' | 'medium' | 'low';
      estimatedHours?: number;
    }>;
  }) => void;
  onCommitSingleTask?: (task: Partial<Task>) => void;
}

export const VoiceAiCaptureModal: React.FC<VoiceAiCaptureModalProps> = ({
  isOpen,
  onClose,
  pillars,
  projects,
  goals,
  onCommitHierarchy,
  onCommitSingleTask,
}) => {
  // Speech & Input states
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AiVoiceAnalysisResult | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Record<number, boolean>>({});
  const [selectedPillarId, setSelectedPillarId] = useState<string>(pillars[0]?.id || '');
  const [activeStep, setActiveStep] = useState<'input' | 'result'>('input');

  // Media references
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize SpeechRecognition on mount/open
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
    }
  }, []);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setInputText('');
      setAnalysisResult(null);
      setActiveStep('input');
      setSpeechError(null);
      setSelectedPillarId(pillars[0]?.id || '');
    } else {
      stopListening();
      stopAudioRecording();
    }
  }, [isOpen, pillars]);

  // Audio recording timer
  useEffect(() => {
    if (isRecordingAudio) {
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
  }, [isRecordingAudio]);

  // Web Speech API handler with proper de-duplication
  const startListening = () => {
    setSpeechError(null);
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      startAudioRecording();
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'ar-SA';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let localFinalText = '';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcriptChunk = item[0].transcript;
          if (item.isFinal) {
            localFinalText += ' ' + transcriptChunk;
          } else {
            currentInterim += ' ' + transcriptChunk;
          }
        }

        // Apply instant de-duplication to prevent the repeated stutter bug
        const combined = (localFinalText + ' ' + currentInterim).trim();
        const cleaned = deduplicateArabicSpeech(combined);
        setInputText(cleaned);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('تم رفض إذن الميكروفون في المتصفح. يمكنك الكتابة يدوياً أو تفعيل الإذن.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`تنبيه: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setSpeechError('تعذر بدء التعرف على الصوت. سنستخدم التسجيل المباشر.');
      startAudioRecording();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    // Final clean-up pass
    setInputText((prev) => deduplicateArabicSpeech(prev));
  };

  // Direct Audio Recording fallback (MediaRecorder + Gemini transcribe)
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
          setIsAnalyzing(true);
          try {
            const transcribed = await transcribeAudioBlob(audioBlob);
            if (transcribed) {
              setInputText(transcribed);
            }
          } catch (err: any) {
            setSpeechError(err.message || 'فشل تفريغ التسجيل الصوتي');
          } finally {
            setIsAnalyzing(false);
          }
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(200);
      setIsRecordingAudio(true);
    } catch (err) {
      setSpeechError('يرجى السماح بصلاحية الميكروفون للتسجيل الصوتي.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingAudio(false);
  };

  // Run Gemini Analysis on the Text
  const handleAnalyze = async () => {
    const textToAnalyze = deduplicateArabicSpeech(inputText);
    if (!textToAnalyze.trim()) return;

    setIsAnalyzing(true);
    setSpeechError(null);

    try {
      const result = await analyzeVoiceInput(textToAnalyze, {
        existingPillars: pillars.map((p) => p.title),
        existingProjects: projects.map((p) => p.title),
      });

      setAnalysisResult(result);
      // Select all tasks by default
      const initialTaskSelection: Record<number, boolean> = {};
      result.tasks.forEach((_, idx) => {
        initialTaskSelection[idx] = true;
      });
      setSelectedTasks(initialTaskSelection);

      // Match suggested pillar if possible
      if (result.suggestedPillarTitle) {
        const matchedPillar = pillars.find(
          (p) =>
            p.title.includes(result.suggestedPillarTitle) ||
            result.suggestedPillarTitle.includes(p.title)
        );
        if (matchedPillar) {
          setSelectedPillarId(matchedPillar.id);
        }
      }

      setActiveStep('result');
    } catch (err: any) {
      console.error('Error analyzing input with AI:', err);
      setSpeechError(err.message || 'حدث خطأ أثناء معالجة الفكرة بواسطة الذكاء الاصطناعي.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Commit Analyzed Hierarchy into System
  const handleSaveToSystem = () => {
    if (!analysisResult) return;

    const chosenTasks = analysisResult.tasks.filter((_, idx) => selectedTasks[idx]);

    // Check if user has an existing goal in this pillar, or we find matching
    const matchingGoal = goals.find((g) => g.pillar_id === selectedPillarId);

    onCommitHierarchy({
      pillarId: selectedPillarId || pillars[0]?.id,
      goalId: matchingGoal?.id,
      projectTitle: analysisResult.projectTitle || analysisResult.cleanedTranscription.slice(0, 40),
      projectDescription: analysisResult.projectDescription || analysisResult.summary,
      tasks: chosenTasks.map((t) => ({
        title: t.title,
        description: t.description,
        priority: t.priority || 'medium',
        energyLevel: t.energyLevel || 'medium',
        estimatedHours: t.estimatedHours || 1,
      })),
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#e2ded5] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#174235] to-[#235848] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <span>المساعد الصوتي والتحليل الذكي</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full text-center">
                  Gemini AI
                </span>
              </h2>
              <p className="text-[11px] text-emerald-100">
                تحدث بحرية بصوتك وسيقوم النظام بتنقية الصوت وتفكيكه تلقائياً لمهام ومشاريع
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Error Message */}
          {speechError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{speechError}</span>
            </div>
          )}

          {activeStep === 'input' ? (
            <div className="space-y-4">
              
              {/* Voice Interaction Hero Box */}
              <div className="bg-[#f8f7f4] border border-[#e8e4db] rounded-2xl p-5 text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  {/* Microphone Primary Button */}
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-300'
                        : 'bg-[#174235] hover:bg-[#12352a] text-white hover:scale-105'
                    }`}
                    title={isListening ? 'إيقاف الاستماع' : 'ابدأ التحدث بصوتك'}
                  >
                    {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                  </button>

                  {/* Audio Recording Fallback Button */}
                  <button
                    type="button"
                    onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                      isRecordingAudio
                        ? 'bg-rose-500 text-white animate-bounce border-rose-600'
                        : 'bg-white hover:bg-[#f2efe9] text-[#174235] border-[#d8d4cc]'
                    }`}
                    title={isRecordingAudio ? 'إيقاف التسجيل الصوتي' : 'تسجيل صوتي عالي الدقة (Gemini Transcribe)'}
                  >
                    {isRecordingAudio ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                </div>

                <div>
                  <span className="font-bold text-sm text-[#1a2420] block">
                    {isListening
                      ? '🎙️ جاري الاستماع المباشر... تحدث الآن'
                      : isRecordingAudio
                      ? `🔴 جاري تسجيل مقطع الصوت (${recordingSeconds} ثانية)...`
                      : 'اضغط وتحدث بما يخطر في بالك'}
                  </span>
                  <p className="text-[11px] text-[#6d7972] mt-1">
                    مثال: "عايز أعمل موقع إلكتروني أو نظام يخليني أقدر أعمل صور ونصوص إعلانية لشغلي"
                  </p>
                </div>
              </div>

              {/* Real-time Transcription & Editable Text Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-[#35423b] flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-[#174235]" />
                    <span>النص المنقى والمكتوب:</span>
                  </label>
                  {inputText && (
                    <button
                      type="button"
                      onClick={() => setInputText('')}
                      className="text-[11px] text-[#7d8982] hover:text-rose-600"
                    >
                      مسح النص
                    </button>
                  )}
                </div>

                <textarea
                  rows={4}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="سيظهر ما تقوله هنا بصوتك بعد تنقيته من أي تكرار أو يمكنك كتابته مباشرة..."
                  className="w-full p-3.5 bg-[#faf8f5] border border-[#d8d4cc] rounded-xl text-[#1a2420] placeholder:text-[#9aa69f] focus:bg-white focus:border-[#174235] focus:ring-1 focus:ring-[#174235]/20 outline-hidden leading-relaxed"
                />

                <div className="flex items-center justify-between mt-1 text-[11px] text-[#7a8880]">
                  <span>✨ يقوم النظام آلياً بتنقية التأتأة وتكرار الكلمات</span>
                  <button
                    type="button"
                    onClick={() => setInputText((prev) => deduplicateArabicSpeech(prev))}
                    className="hover:underline text-[#174235] font-medium flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>إعادة تنقية التكرار</span>
                  </button>
                </div>
              </div>

              {/* Sample Prompts to test */}
              <div className="bg-[#f6f5f0] p-3 rounded-xl border border-[#ece8df] space-y-1.5">
                <span className="font-semibold text-[#48554e] block text-[11px]">
                  💡 جرب نصوصاً وأفكاراً مثل:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'عايز اعمل موقع الكتروني او نظام يخليني اقدر اعمل صور ونصوص اعلانيه للشغل بتاعي',
                    'قراءة وتلخيص كتاب العادات الذرية وتطبيق عادة القراءة 20 دقيقة يومياً',
                    'تجهيز الميزانية الشهرية وتسوية الفواتير المتأخرة',
                  ].map((sample, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInputText(sample)}
                      className="text-[11px] text-right bg-white hover:bg-[#eef5f2] border border-[#dcd8cf] hover:border-[#174235] px-2.5 py-1 rounded-lg text-[#2a3530] transition-colors cursor-pointer"
                    >
                      {sample.length > 55 ? sample.slice(0, 55) + '...' : sample}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            /* STEP 2: AI DECOMPOSITION RESULTS */
            analysisResult && (
              <div className="space-y-4">
                
                {/* Synthesis Summary Banner */}
                <div className="bg-gradient-to-r from-[#ebf4f0] to-[#f4f8f6] border border-[#cbe2d7] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#174235] uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>تشخيص الذكاء الاصطناعي للفكرة</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveStep('input')}
                      className="text-[11px] text-[#174235] font-semibold hover:underline"
                    >
                      ← تعديل النص
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-[#1a2420] leading-relaxed">
                    {analysisResult.summary}
                  </p>

                  <div className="text-[11px] text-[#526058] bg-white/80 p-2 rounded-lg border border-[#dcebe3]">
                    <span className="font-bold text-[#174235]">النص الصوتي بعد التنقية: </span>
                    "{analysisResult.cleanedTranscription}"
                  </div>
                </div>

                {/* Proposed Project & Pillar Placement */}
                <div className="bg-[#fbfbfa] border border-[#e8e4db] rounded-xl p-3.5 space-y-3">
                  <h4 className="font-bold text-xs text-[#1a2420] flex items-center gap-1.5">
                    <FolderPlus className="w-4 h-4 text-[#174235]" />
                    <span>المشروع والركيزة المقترحة</span>
                  </h4>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5a6861] mb-1">
                        اسم المشروع:
                      </label>
                      <input
                        type="text"
                        value={analysisResult.projectTitle || ''}
                        onChange={(e) =>
                          setAnalysisResult({ ...analysisResult, projectTitle: e.target.value })
                        }
                        className="w-full p-2 bg-white border border-[#d8d4cc] rounded-lg text-xs font-bold text-[#1a2420] outline-hidden focus:border-[#174235]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#5a6861] mb-1">
                        إيداع تحت الركيزة الحياتية:
                      </label>
                      <select
                        value={selectedPillarId}
                        onChange={(e) => setSelectedPillarId(e.target.value)}
                        className="w-full p-2 bg-white border border-[#d8d4cc] rounded-lg text-xs font-medium text-[#1a2420] cursor-pointer outline-hidden"
                      >
                        {pillars.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.pillar_group})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Extracted Tasks Checklist */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-[#1a2420] flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-[#174235]" />
                      <span>المهام التنفيذية المستخلصة ({analysisResult.tasks.length} مهام):</span>
                    </h4>
                    <span className="text-[11px] text-[#78857e]">حدد المهام التي ترغب بإنشائها</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {analysisResult.tasks.map((task, idx) => {
                      const isChecked = selectedTasks[idx] ?? true;

                      return (
                        <div
                          key={idx}
                          onClick={() =>
                            setSelectedTasks({ ...selectedTasks, [idx]: !isChecked })
                          }
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                            isChecked
                              ? 'bg-white border-[#174235]/40 shadow-2xs'
                              : 'bg-[#f8f7f4] border-[#e2ded5] opacity-60'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                              isChecked
                                ? 'bg-[#174235] border-[#174235] text-white'
                                : 'border-[#b5bfb9] bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-[#1a2420] block leading-snug">
                              {task.title}
                            </span>
                            {task.description && (
                              <p className="text-[11px] text-[#637169] mt-0.5 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#717e77]">
                              <span className="px-1.5 py-0.5 rounded bg-[#f0ede6] font-medium">
                                أولوية: {task.priority === 'high' ? '🔴 عليا' : task.priority === 'medium' ? '🟡 متوسطة' : '🟢 عادية'}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#f0ede6] font-medium flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{task.estimatedHours} س</span>
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#f0ede6] font-medium">
                                {task.energyLevel === 'high' ? '🚀 تركيز عميق' : '⚡ طاقة معتدلة'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-[#fbfbfa] border-t border-[#ede9e1] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#5a6660] hover:bg-[#eae7df] rounded-xl cursor-pointer transition-colors"
          >
            إغلاق
          </button>

          {activeStep === 'input' ? (
            <button
              type="button"
              disabled={isAnalyzing || !inputText.trim()}
              onClick={handleAnalyze}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer ${
                isAnalyzing || !inputText.trim()
                  ? 'bg-[#a1b3aa] cursor-not-allowed'
                  : 'bg-[#174235] hover:bg-[#12352a] active:scale-95'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري التحليل والتفكيك بالذكاء الاصطناعي...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>تحليل وتفكيك الفكرة (Gemini AI)</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveToSystem}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#174235] hover:bg-[#12352a] active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>إدراج المشروع والمهام في النظام فوراً</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
