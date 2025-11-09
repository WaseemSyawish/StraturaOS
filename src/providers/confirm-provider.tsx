"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

type ConfirmType = 'info' | 'warning' | 'danger' | 'success';

interface ConfirmOptions {
  title: string;
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmContextType {
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  showAlert: (title: string, message: string, type?: ConfirmType) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);
  const [isAlert, setIsAlert] = useState(false);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState(options);
      setResolvePromise(() => resolve);
      setIsAlert(false);
    });
  }, []);

  const showAlert = useCallback((title: string, message: string, type: ConfirmType = 'info'): Promise<void> => {
    return new Promise((resolve) => {
      setConfirmState({ title, message, type });
      setResolvePromise(() => () => resolve());
      setIsAlert(true);
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (confirmState?.onConfirm) {
      await confirmState.onConfirm();
    }
    if (resolvePromise) resolvePromise(true);
    setConfirmState(null);
    setResolvePromise(null);
  }, [confirmState, resolvePromise]);

  const handleCancel = useCallback(() => {
    if (confirmState?.onCancel) {
      confirmState.onCancel();
    }
    if (resolvePromise) resolvePromise(false);
    setConfirmState(null);
    setResolvePromise(null);
  }, [confirmState, resolvePromise]);

  const getIcon = (type: ConfirmType = 'info') => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />;
      default:
        return <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getColors = (type: ConfirmType = 'info') => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800/50',
          button: 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-200 dark:border-amber-800/50',
          button: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700',
        };
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800/50',
          button: 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700',
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800/50',
          button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700',
        };
    }
  };

  if (!confirmState) return <>{children}</>;

  const colors = getColors(confirmState.type);

  return (
    <ConfirmContext.Provider value={{ showConfirm, showAlert }}>
      {children}

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-150">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
          onClick={isAlert ? handleConfirm : handleCancel}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-150">
          {/* Header with Icon */}
          <div className={`flex items-start gap-4 p-6 rounded-t-xl border-b ${colors.bg} ${colors.border}`}>
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(confirmState.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {confirmState.title}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {confirmState.message}
              </p>
            </div>
          </div>

          {/* Footer with Actions */}
          <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            {!isAlert && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
              >
                {confirmState.cancelText || 'Cancel'}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${colors.button}`}
            >
              {confirmState.confirmText || (isAlert ? 'OK' : 'Confirm')}
            </button>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoom-in-95 {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-in {
          animation-fill-mode: both;
        }
        .fade-in {
          animation: fade-in 0.15s ease-out;
        }
        .zoom-in-95 {
          animation: zoom-in-95 0.15s ease-out;
        }
      `}</style>
    </ConfirmContext.Provider>
  );
}
