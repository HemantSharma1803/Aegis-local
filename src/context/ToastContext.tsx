import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  showToast: (title: string, type?: 'success' | 'error' | 'info' | 'warning', description?: string) => void;
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toastData: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { ...toastData, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toastData.duration || 4000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const showToast = useCallback(
    (title: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', description?: string) => {
      addToast({ type, title, description });
    },
    [addToast]
  );

  const toast = {
    success: (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
    info: (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
    warning: (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, showToast, toast }}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((t) => {
            const iconMap = {
              success: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
              error: <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />,
              info: <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />,
              warning: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />,
            };

            const borderMap = {
              success: 'border-emerald-800/50 bg-zinc-900/95',
              error: 'border-red-800/50 bg-zinc-900/95',
              info: 'border-sky-800/50 bg-zinc-900/95',
              warning: 'border-amber-800/50 bg-zinc-900/95',
            };

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-xl backdrop-blur-md ${borderMap[t.type]}`}
              >
                <div className="mt-0.5">{iconMap[t.type]}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-zinc-100 leading-tight">
                    {t.title}
                  </h4>
                  {t.description && (
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
