import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  description?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="الإشعارات الفورية"
      className="fixed bottom-16 md:bottom-6 left-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 ${
              isSuccess
                ? 'bg-white/95 text-[#1a2420] border-[#b9dbcb] shadow-emerald-950/10'
                : isWarning
                ? 'bg-white/95 text-[#1a2420] border-amber-300 shadow-amber-950/10'
                : 'bg-white/95 text-[#1a2420] border-[#d9d5cb] shadow-stone-950/10'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#174235]" />}
              {isWarning && <AlertCircle className="w-4 h-4 text-amber-600" />}
              {!isSuccess && !isWarning && <Info className="w-4 h-4 text-sky-700" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-snug">{toast.title}</p>
              {toast.description && (
                <p className="text-[11px] text-[#4d5d54] mt-0.5 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="إغلاق التنبيه"
              className="p-1 text-[#627369] hover:text-[#1a2420] rounded-lg hover:bg-[#f2efe8] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
