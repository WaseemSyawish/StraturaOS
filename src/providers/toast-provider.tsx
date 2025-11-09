"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, Undo2, CheckCircle2, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'undo';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onUndo?: () => void;
  undoData?: any;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, options?: { duration?: number; onUndo?: () => void; undoData?: any }) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    options?: { duration?: number; onUndo?: () => void; undoData?: any }
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const duration = options?.duration ?? (type === 'undo' ? 8000 : 5000);

    const newToast: Toast = {
      id,
      message,
      type,
      duration,
      onUndo: options?.onUndo,
      undoData: options?.undoData,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const handleUndo = useCallback((toast: Toast) => {
    if (toast.onUndo) {
      toast.onUndo();
      hideToast(toast.id);
    }
  }, [hideToast]);

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'undo':
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50';
      case 'undo':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800/50';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Toast Container - Fixed at bottom right */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto min-w-[320px] max-w-md rounded-lg border shadow-lg
              transform transition-all duration-300 ease-out
              animate-in slide-in-from-right-full
              ${getToastStyles(toast.type)}
            `}
          >
            <div className="flex items-center gap-3 p-3.5">
              {/* Icon */}
              <div className="flex-shrink-0">
                {getToastIcon(toast.type)}
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {toast.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {toast.type === 'undo' && toast.onUndo && (
                  <button
                    onClick={() => handleUndo(toast)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      <Undo2 className="w-3.5 h-3.5" />
                      Undo
                    </span>
                  </button>
                )}
                
                <button
                  onClick={() => hideToast(toast.id)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes slide-in-from-right-full {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-in {
          animation: slide-in-from-right-full 0.3s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  );
}
