import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../utils/supabaseClient';
import { 
  Lock, 
  Mail, 
  Key, 
  User, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { email: string; isGuest?: boolean }) => void;
  currentUser?: { email: string; isGuest?: boolean } | null;
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        // Local state authentication if Supabase is offline/not yet linked
        if (!email.includes('@')) {
          throw new Error('يرجى إدخال بريد إلكتروني صالح');
        }
        if (password.length < 6) {
          throw new Error('كلمة المرور يجب ألا تقل عن 6 أحرف');
        }
        setSuccessMsg(tab === 'signin' ? 'تم تسجيل الدخول بنجاح' : 'تم إنشاء الحساب بنجاح');
        setTimeout(() => {
          onAuthSuccess({ email, isGuest: false });
          onClose();
        }, 600);
        return;
      }

      if (tab === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (data.user) {
          setSuccessMsg('تم إنشاء الحساب بنجاح! تم تسجيل دخولك.');
          setTimeout(() => {
            onAuthSuccess({ email: data.user!.email || email, isGuest: false });
            onClose();
          }, 800);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          setSuccessMsg('مرحباً بك مجدداً! تم تسجيل الدخول.');
          setTimeout(() => {
            onAuthSuccess({ email: data.user!.email || email, isGuest: false });
            onClose();
          }, 600);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء المصادقة');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    if (!isSupabaseConfigured || !supabase) {
      // Mock instant Google OAuth for demo preview
      onAuthSuccess({ email: 'user@gmail.com', isGuest: false });
      onClose();
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تسجيل الدخول عبر Google');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    onAuthSuccess({ email: 'ضيف المنظومة كضيف', isGuest: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-[#e2ded5] dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#174235] to-[#205141] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">دوّنلي | تسجيل الدخول والمصادقة</h2>
              <p className="text-[11px] text-emerald-100">
                حفظ ومزامنة ركائزك وأهدافك ومشاريعك في مساحة آمنة
              </p>
            </div>
          </div>
          {canDismiss && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Current User Session Status */}
        {currentUser && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-100 dark:border-emerald-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <div>
                <span className="text-[#637269] dark:text-slate-400 block text-[10px]">الحساب النشط حالياً:</span>
                <span className="font-bold text-[#174235] dark:text-emerald-300">{currentUser.email}</span>
              </div>
            </div>
            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-rose-300 text-rose-700 dark:text-rose-400 rounded-xl font-bold hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all text-xs"
              >
                تسجيل الخروج
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Tabs */}
          <div className="flex items-center bg-[#f4f2ed] dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === 'signin'
                  ? 'bg-white dark:bg-slate-700 text-[#174235] dark:text-emerald-300 shadow-2xs'
                  : 'text-[#627369] dark:text-slate-400 hover:text-[#174235]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>تسجيل الدخول</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === 'signup'
                  ? 'bg-white dark:bg-slate-700 text-[#174235] dark:text-emerald-300 shadow-2xs'
                  : 'text-[#627369] dark:text-slate-400 hover:text-[#174235]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>حساب جديد</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 border border-[#d8d4cc] dark:border-slate-700 hover:border-[#174235] rounded-xl text-xs font-bold text-[#1a2420] dark:text-slate-100 flex items-center justify-center gap-2 shadow-2xs hover:bg-[#faf9f6] dark:hover:bg-slate-700/80 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>المتابعة باستخدام Google</span>
          </button>

          <div className="flex items-center gap-3 text-xs text-[#95a39b] dark:text-slate-500">
            <div className="flex-1 h-px bg-[#e6e2d9] dark:bg-slate-800" />
            <span>أو بالبريد الإلكتروني</span>
            <div className="flex-1 h-px bg-[#e6e2d9] dark:bg-slate-800" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {tab === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-[#55645b] dark:text-slate-400 mb-1">
                  الاسم الكامل:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="محمد مسعود"
                    className="w-full px-3 py-2 pl-9 bg-[#faf8f5] dark:bg-slate-800 border border-[#d8d4cc] dark:border-slate-700 rounded-xl text-xs text-[#1a2420] dark:text-slate-100 outline-hidden focus:border-[#174235]"
                  />
                  <User className="w-3.5 h-3.5 text-[#86968c] absolute left-3 top-3" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#55645b] dark:text-slate-400 mb-1">
                البريد الإلكتروني:
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 pl-9 bg-[#faf8f5] dark:bg-slate-800 border border-[#d8d4cc] dark:border-slate-700 rounded-xl text-xs text-[#1a2420] dark:text-slate-100 outline-hidden focus:border-[#174235]"
                />
                <Mail className="w-3.5 h-3.5 text-[#86968c] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#55645b] dark:text-slate-400 mb-1">
                كلمة المرور:
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pl-9 bg-[#faf8f5] dark:bg-slate-800 border border-[#d8d4cc] dark:border-slate-700 rounded-xl text-xs text-[#1a2420] dark:text-slate-100 outline-hidden focus:border-[#174235]"
                />
                <Key className="w-3.5 h-3.5 text-[#86968c] absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#174235] hover:bg-[#12362b] text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-4"
            >
              {loading ? (
                <span>جاري المعالجة...</span>
              ) : tab === 'signin' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول للمنظومة</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>إنشاء حسابك الشخصي</span>
                </>
              )}
            </button>
          </form>

          {/* Guest Mode fallback */}
          <div className="pt-2 border-t border-[#f0eee9] dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="text-xs font-bold text-[#174235] dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>المتابعة كضيف واستكشاف النظام محلياً</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
