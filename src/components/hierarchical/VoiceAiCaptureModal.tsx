import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Inbox, Mic, MicOff, RefreshCw, Send, Sparkles, Square, X } from 'lucide-react';
import { deduplicateArabicSpeech, transcribeAudioBlob } from '../../utils/speechRecognition';
import { proposeAiCommands } from '../../features/ai/commands/api';
import type { AiCommandAction, AiCommandContextItem, AiCommandPlan } from '../../features/ai/commands/schema';

interface Props {
  isOpen: boolean;
  onClose(): void;
  context: AiCommandContextItem[];
  onApply(actions: AiCommandAction[], options: { audioBlob: Blob | null; attachAudioToJournal: boolean }): Promise<void>;
  onSaveInbox(text: string): void;
}

const entityLabels: Record<AiCommandAction['entityType'], string> = {
  pillar: 'ركيزة', vision: 'رؤية', goal: 'هدف قيمة', project: 'مشروع', task: 'مهمة', habit: 'عادة', ibadat: 'عبادة', inbox: 'الوارد', journal: 'يومية', calendar_event: 'موعد',
};
const operationLabels = { create: 'إضافة', update: 'تعديل', delete: 'حذف' } as const;
type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };

export function VoiceAiCaptureModal({ isOpen, onClose, context, onApply, onSaveInbox }: Props) {
  const [input, setInput] = useState('');
  const [plan, setPlan] = useState<AiCommandPlan | null>(null);
  const [clarification, setClarification] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [attachAudio, setAttachAudio] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const recognitionRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setInput(''); setPlan(null); setClarification(''); setError(null); setAudioBlob(null); setAttachAudio(false); setMessages([{ id: `assistant-${Date.now()}`, role: 'assistant', text: 'أهلًا بك. اكتب ما تريد فعله أو تحدث، وسأفهم مقصدك وأسألك عن أي معلومة ناقصة قبل عرض خطة التنفيذ.' }]);
    return () => { recognitionRef.current?.abort?.(); if (recorderRef.current?.state === 'recording') recorderRef.current.stop(); chunksRef.current = []; };
  }, [isOpen]);

  const stopSpeech = () => { recognitionRef.current?.stop?.(); recognitionRef.current = null; setListening(false); setInput((value) => deduplicateArabicSpeech(value)); };
  const startRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop()); setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }); chunksRef.current = [];
        if (!blob.size) return;
        setAudioBlob(blob); setBusy(true);
        try { setInput(await transcribeAudioBlob(blob)); } catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر تفريغ التسجيل.'); } finally { setBusy(false); }
      };
      recorder.start(); setRecording(true);
    } catch { setError('تعذر الوصول إلى الميكروفون. تحقق من إذن المتصفح.'); }
  };
  const startSpeech = () => {
    setError(null);
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) { void startRecorder(); return; }
    const recognition = new Recognition(); recognition.lang = 'ar-SA'; recognition.continuous = true; recognition.interimResults = true;
    let finalText = '';
    recognition.onresult = (event: any) => { let interim = ''; for (let index = event.resultIndex; index < event.results.length; index += 1) { const phrase = event.results[index][0].transcript; if (event.results[index].isFinal) finalText += ` ${phrase}`; else interim += ` ${phrase}`; } setInput(deduplicateArabicSpeech(`${finalText} ${interim}`)); };
    recognition.onerror = (event: any) => { setListening(false); if (event.error === 'not-allowed') setError('تم رفض إذن الميكروفون.'); };
    recognition.onend = () => setListening(false); recognitionRef.current = recognition; recognition.start(); setListening(true);
  };
  const analyze = async (answer?: string) => {
    const submitted = (answer || input).trim();
    if (!submitted) return;
    setMessages((previous) => [...previous, { id: `user-${Date.now()}`, role: 'user', text: submitted }]);
    setBusy(true); setError(null);
    try {
      const next = await proposeAiCommands(input, context, answer);
      setPlan(next);
      setMessages((previous) => [...previous, { id: `assistant-${Date.now()}`, role: 'assistant', text: next.needsClarification ? (next.clarificationQuestion || 'أحتاج معلومة إضافية قبل المتابعة.') : next.summary }]);
      if (!next.needsClarification) setClarification('');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر تحليل الأمر.'); }
    finally { setBusy(false); }
  };
  const saveInbox = () => { onSaveInbox(input.trim()); onClose(); };
  const apply = async () => {
    if (!plan || plan.needsClarification || !plan.actions.length) return;
    setBusy(true); setError(null);
    try { await onApply(plan.actions, { audioBlob, attachAudioToJournal: attachAudio }); onClose(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'تعذر تنفيذ الخطة. لم يُحفظ أي تغيير.'); }
    finally { setBusy(false); }
  };
  if (!isOpen) return null;
  const hasJournalCreate = plan?.actions.some((action) => action.entityType === 'journal' && action.operation === 'create');

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm" dir="rtl">
    <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-white shadow-2xl dark:bg-slate-900">
      <header className="flex items-center justify-between bg-gradient-to-l from-[#174235] to-emerald-700 p-4 text-white"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-amber-300" /><div><h2 className="font-bold">مساعد دوّنلي الذكي</h2><p className="text-[11px] text-emerald-100">تكلم أو اكتب؛ لن يتغير شيء قبل مراجعتك وتأكيدك.</p></div></div><button onClick={onClose}><X className="h-5 w-5" /></button></header>
      <div className="space-y-4 overflow-y-auto p-4 sm:p-5">{!!messages.length && <div className="space-y-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">{messages.map((message) => <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-7 ${message.role === 'user' ? 'bg-[#174235] text-white' : 'border border-emerald-100 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}>{message.text}</div></div>)}</div>}
        {error && <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        {!plan && <>
          <textarea rows={6} value={input} onChange={(event) => setInput(event.target.value)} placeholder="مثال: اكتب في يومياتي أن اليوم كان جيدًا، وأضف موعدًا غدًا الساعة الخامسة لمراجعة خطة الإنجليزية مع تذكير قبل نصف ساعة." className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800" />
          <div className="flex flex-wrap gap-2"><button type="button" disabled={busy || recording} onClick={listening ? stopSpeech : startSpeech} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white ${listening ? 'bg-rose-600' : 'bg-emerald-700'}`}>{listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}{listening ? 'إيقاف الاستماع' : 'تحدث'}</button><button type="button" disabled={busy || listening} onClick={() => recording ? recorderRef.current?.stop() : void startRecorder()} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold dark:border-slate-700 ${recording ? 'text-rose-600' : ''}`}>{recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}{recording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}</button><button disabled={busy || !input.trim()} onClick={() => void analyze()} className="mr-auto flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-50"><Sparkles className="h-4 w-4" />{busy ? 'يحلل...' : 'تحليل واقتراح'}</button></div>
        </>}

        {plan?.needsClarification && <div className="space-y-3"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30"><h3 className="font-bold text-amber-900 dark:text-amber-200">أحتاج توضيحًا قبل المتابعة</h3><p className="mt-2 text-sm">{plan.clarificationQuestion || 'حدد مقصدك أو الهدف المطلوب.'}</p></div><textarea rows={3} value={clarification} onChange={(event) => setClarification(event.target.value)} placeholder="اكتب الإجابة هنا" className="w-full rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-800" /><div className="flex flex-wrap gap-2"><button disabled={busy || !clarification.trim()} onClick={() => void analyze(clarification)} className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white"><Send className="h-4 w-4" />إرسال التوضيح</button><button onClick={saveInbox} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold dark:border-slate-700"><Inbox className="h-4 w-4" />حفظ النص في الوارد</button><button onClick={() => setPlan(null)} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm dark:border-slate-700"><RefreshCw className="h-4 w-4" />العودة للنص</button></div></div>}

        {plan && !plan.needsClarification && <div className="space-y-3"><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30"><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-emerald-900 dark:text-emerald-200">خطة التغييرات المقترحة</h3><span className="text-xs">الثقة {Math.round(plan.confidence * 100)}%</span></div><p className="mt-1 text-sm">{plan.summary}</p></div>
          <div className="space-y-2">{plan.actions.map((action, index) => <div key={action.actionId} className={`rounded-xl border p-3 ${action.operation === 'delete' ? 'border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30' : 'border-slate-200 dark:border-slate-700'}`}><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">{index + 1}</span><span className="text-xs font-bold">{operationLabels[action.operation]} {entityLabels[action.entityType]}</span><strong className="text-sm">{action.title || action.targetTitle || action.content?.slice(0, 60) || 'العنصر المحدد'}</strong></div><p className="mt-1 text-xs text-slate-500">{action.reason}</p>{action.startAt && <p className="mt-1 text-xs">{new Date(action.startAt).toLocaleString('ar-EG')}</p>}</div>)}</div>
          {!!plan.warnings.length && <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{plan.warnings.join(' — ')}</div>}
          {audioBlob && hasJournalCreate && <label className="flex items-center gap-2 rounded-xl border p-3 text-sm dark:border-slate-700"><input type="checkbox" checked={attachAudio} onChange={(event) => setAttachAudio(event.target.checked)} />إرفاق التسجيل الصوتي باليومية (اختياري)</label>}
          <p className="text-xs text-slate-500">لن ينفذ التطبيق أي تغيير إلا بعد الضغط على التأكيد. تُنفّذ الخطة كاملة أو لا يُحفظ شيء.</p>
          <div className="flex flex-wrap gap-2"><button disabled={busy || !plan.actions.length} onClick={() => void apply()} className="flex items-center gap-2 rounded-xl bg-[#174235] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Check className="h-4 w-4" />{busy ? 'جارٍ التنفيذ...' : `تأكيد وتنفيذ ${plan.actions.length} تغييرات`}</button><button onClick={() => setPlan(null)} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm dark:border-slate-700"><RefreshCw className="h-4 w-4" />تعديل الطلب</button><button onClick={saveInbox} className="mr-auto flex items-center gap-2 rounded-xl border px-4 py-2 text-sm dark:border-slate-700"><Inbox className="h-4 w-4" />بدلًا من ذلك: حفظ في الوارد</button></div>
        </div>}
      </div>
    </div>
  </div>;
}

export default VoiceAiCaptureModal;
