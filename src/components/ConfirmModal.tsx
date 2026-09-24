import React, { useEffect } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'danger',
  onConfirm,
  onCancel,
  onClose,
}) => {
  const handleCancel = onCancel || onClose || (() => {});

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCancel]);

  if (!isOpen) return null;

  const getConfirmStyle = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'primary':
      default:
        return 'bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="bg-white dark:bg-[#16201b] text-[#1a2420] dark:text-[#e5ede8] rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-[#e8e5de] dark:border-[#223028]">
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            variant === 'danger' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' :
            variant === 'warning' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
            'bg-[#ebf4f0] dark:bg-[#1a2e24] text-[#174235] dark:text-emerald-400'
          }`}>
            {variant === 'danger' ? <Trash2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div>
            <h3 id="confirm-modal-title" className="text-sm font-bold text-[#1a2420] dark:text-white mb-1">
              {title}
            </h3>
            <p className="text-xs text-[#596a60] dark:text-[#9bb0a3] leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#f0eee9] dark:border-[#223028] text-xs">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3.5 py-2 text-[#596a60] dark:text-[#9bb0a3] hover:bg-[#f2efe8] dark:hover:bg-[#1e2c24] rounded-xl font-medium cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl font-semibold cursor-pointer shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-500 focus-visible:outline-hidden ${getConfirmStyle()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
