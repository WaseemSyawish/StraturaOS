import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Notification({ type = 'info', message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClose && onClose(), 5000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  const config = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
      textColor: 'text-green-800 dark:text-green-200',
      closeColor: 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
      textColor: 'text-red-800 dark:text-red-200',
      closeColor: 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      textColor: 'text-blue-800 dark:text-blue-200',
      closeColor: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200'
    }
  };

  const style = config[type] || config.info;

  return (
    <div 
      className={`${style.bg} ${style.border} border rounded-xl shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-top-5 duration-300`}
      role="status" 
      aria-live="polite"
    >
      <div className="flex-shrink-0 mt-0.5">
        {style.icon}
      </div>
      <div className={`flex-1 ${style.textColor} text-sm font-medium`}>
        {message}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${style.closeColor} transition-colors p-1 rounded-lg hover:bg-white/50 dark:hover:bg-black/20`}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
