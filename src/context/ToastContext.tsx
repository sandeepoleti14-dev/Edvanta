import React, { createContext, useCallback, useContext, useState } from 'react';
import { Award, CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info' | 'xp';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-20 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-[var(--shadow-float)] text-sm edvanta-xp-pop ${
              toast.variant === 'xp'
                ? 'border-[#F6B94A]/50 bg-[#FFFDF7] dark:bg-[#231F18] text-[#14172B] dark:text-[#F4F6FF]'
                : 'border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] text-[#14172B] dark:text-[#F4F6FF]'
            }`}
          >
            {toast.variant === 'success' && (
              <CheckCircle2 className="h-4 w-4 text-[#27C991] mt-0.5 shrink-0" />
            )}
            {toast.variant === 'error' && (
              <AlertCircle className="h-4 w-4 text-[#E5484D] dark:text-[#F87171] mt-0.5 shrink-0" />
            )}
            {toast.variant === 'info' && (
              <Info className="h-4 w-4 text-[#477BFF] mt-0.5 shrink-0" />
            )}
            {toast.variant === 'xp' && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#F6B94A]/20 text-[#D98B14] dark:text-[#F6B94A] shrink-0">
                <Award className="h-3.5 w-3.5" />
              </span>
            )}
            <p className="flex-1 leading-snug flex items-center gap-1.5">
              <span>{toast.message}</span>
              {toast.variant === 'xp' && (
                <Sparkles className="h-3.5 w-3.5 text-[#F6B94A] shrink-0" aria-hidden="true" />
              )}
            </p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="text-[#6E7696] hover:text-[#14172B] dark:hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
