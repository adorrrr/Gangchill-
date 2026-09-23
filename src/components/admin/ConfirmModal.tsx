import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'success';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'হ্যাঁ, নিশ্চিত করুন',
  cancelLabel = 'বাতিল',
  variant = 'primary',
  loading = false,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  const confirmBtnStyles = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white'
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-4 sm:p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center shrink-0 border ${
              variant === 'danger'
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : variant === 'success'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-bold font-serifBangla text-base sm:text-lg text-slate-900 leading-snug">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
          {message}
        </p>

        <div className="pt-2 flex items-center justify-end gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer ${confirmBtnStyles[variant]}`}
          >
            {loading ? 'প্রক্রিয়াধীন...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
