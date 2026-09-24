import React from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
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
}) => {
  if (!isOpen) return null;

  const getConfirmStyle = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'primary':
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg p-5 max-w-sm w-full shadow-2xl border border-slate-200">
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-full shrink-0 ${
            variant === 'danger' ? 'bg-rose-50 text-rose-600' :
            variant === 'warning' ? 'bg-amber-50 text-amber-600' :
            'bg-indigo-50 text-indigo-600'
          }`}>
            {variant === 'danger' ? <Trash2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md font-medium cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded-md font-semibold cursor-pointer shadow-xs ${getConfirmStyle()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
