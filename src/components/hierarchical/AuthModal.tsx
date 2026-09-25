import React, { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Key, Lock, LogIn, Mail, ShieldCheck, User, UserPlus, X } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../utils/supabaseClient';

const googleAuthEnabled = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true';

function getAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (/invalid login credentials/i.test(message)) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحين. إن كان الحساب جديدًا، أنشئه أولًا وأكّد البريد الإلكتروني.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'لم يتم تأكيد البريد الإلكتروني بعد. افتح رسالة التأكيد ثم أعد تسجيل الدخول.';
  }
  if (/email rate limit exceeded/i.test(message)) {
    return 'تم إرسال طلبات كثيرة للبريد الإلكتروني. انتظر قليلًا ثم حاول مجددًا.';
  }
  return message || 'تعذر إتمام المصادقة. حاول لاحقًا.';
}

interface AuthUser {
  id?: string;
  email: string;
  isGuest?: boolean;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
  canDismiss?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  currentUser,
  onSignOut,
  canDismiss = true,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const setMode = (mode: 'signin' | 'signup') => {
    setTab(mode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صالح.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('كلمة المرور يجب ألا تقل عن 6 أحرف.');
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg('المصادقة السحابية غير مهيأة. يمكنك المتابعة كضيف محلي فقط.');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          setSuccessMsg('تم إنشاء الحساب. افتح رسالة التأكيد في بريدك ثم سجّل الدخول.');
          setTab('signin');
          setPassword('');
          return;
        }
        if (data.user?.email) {
          onAuthSuccess({ id: data.user.id, email: data.user.email });
          onClose();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        if (!data.session || !data.user?.email) throw new Error('لم تُنشأ جلسة دخول صالحة.');
        onAuthSuccess({ id: data.user.id, email: data.user.email });
        onClose();
      }
    } catch (error) {
      setErrorMsg(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg('تسجيل Google غير متاح لأن Supabase غير مهيأ.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (error) {
      setErrorMsg(getAuthErrorMessage(error));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4" dir="rtl" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-[#e2ded5] dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#174235] to-[#205141] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center"><Lock className="w-5 h-5 text-emerald-300" /></span>
            <div><h2 id="auth-title" className="text-sm sm:text-base font-bold">دوّنلي | المصادقة</h2><p className="text-[11px] text-emerald-100">حساب سحابي موثّق أو ضيف محلي منفصل</p></div>
          </div>
          {canDismiss && <button onClick={onClose} aria-label="إغلاق نافذة المصادقة" className="p-2 rounded-lg hover:bg-white/10"><X className="w-4 h-4" /></button>}
        </div>

        {currentUser && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-between text-xs">
            <span className="min-w-0 truncate font-bold text-[#174235] dark:text-emerald-300">{currentUser.email}</span>
            {onSignOut && <button type="button" onClick={onSignOut} className="px-3 py-1.5 border border-rose-300 text-rose-700 rounded-xl">تسجيل الخروج</button>}
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs">
          <div className="flex bg-[#f4f2ed] dark:bg-slate-800 p-1 rounded-xl font-bold">
            <button type="button" onClick={() => setMode('signin')} className={`flex-1 py-2 rounded-lg ${tab === 'signin' ? 'bg-white dark:bg-slate-700 shadow-xs' : ''}`}><LogIn className="inline w-3.5 h-3.5 ml-1" />تسجيل الدخول</button>
            <button type="button" onClick={() => setMode('signup')} className={`flex-1 py-2 rounded-lg ${tab === 'signup' ? 'bg-white dark:bg-slate-700 shadow-xs' : ''}`}><UserPlus className="inline w-3.5 h-3.5 ml-1" />إنشاء حساب</button>
          </div>

          {errorMsg && <div role="alert" className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}</div>}
          {successMsg && <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{successMsg}</div>}

          {googleAuthEnabled && <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full py-2.5 px-4 border border-[#d8d4cc] dark:border-slate-700 rounded-xl font-bold disabled:opacity-50">المتابعة باستخدام Google</button>}

          <form onSubmit={handleEmailAuth} className="space-y-3">
            {tab === 'signup' && <label className="block font-bold">الاسم الكامل<input aria-label="الاسم الكامل" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full px-3 py-2 bg-[#faf8f5] dark:bg-slate-800 border rounded-xl" /><User className="hidden" /></label>}
            <label className="block font-bold">البريد الإلكتروني<div className="relative"><input aria-label="البريد الإلكتروني" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full px-3 py-2 pl-9 bg-[#faf8f5] dark:bg-slate-800 border rounded-xl" /><Mail className="w-3.5 h-3.5 absolute left-3 top-4 text-slate-400" /></div></label>
            <label className="block font-bold">كلمة المرور<div className="relative"><input aria-label="كلمة المرور" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-3 py-2 pl-9 bg-[#faf8f5] dark:bg-slate-800 border rounded-xl" /><Key className="w-3.5 h-3.5 absolute left-3 top-4 text-slate-400" /></div></label>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#174235] text-white font-bold rounded-xl disabled:opacity-50">{loading ? 'جاري التحقق...' : tab === 'signin' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</button>
          </form>

          <div className="pt-2 border-t text-center"><button type="button" onClick={() => { onAuthSuccess({ email: 'ضيف محلي', isGuest: true }); onClose(); }} className="font-bold text-[#174235] dark:text-emerald-400">المتابعة كضيف محلي <ArrowRight className="inline w-3.5 h-3.5 rotate-180" /></button></div>
          <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1"><ShieldCheck className="w-3 h-3" />لا تُخزّن كلمات المرور محليًا، وفشل الشبكة لا يمنح جلسة دخول.</p>
        </div>
      </div>
    </div>
  );
};
