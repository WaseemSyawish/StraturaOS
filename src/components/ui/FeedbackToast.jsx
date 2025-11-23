import { motion } from 'framer-motion';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import { useEffect } from 'react';

const icons = {
  success: Check,
  error: X,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  error: 'bg-red-50 text-red-600 border-red-200',
  warning: 'bg-amber-50 text-amber-600 border-amber-200',
  info: 'bg-blue-50 text-blue-600 border-blue-200',
};

const iconBg = {
  success: 'bg-emerald-100',
  error: 'bg-red-100',
  warning: 'bg-amber-100',
  info: 'bg-blue-100',
};

export default function FeedbackToast({ type = 'success', message, duration = 3000, onClose }) {
  const Icon = icons[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-20 right-4 z-[100000] flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${colors[type]}`}
    >
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className={`p-2 rounded-full ${iconBg[type]}`}
      >
        <Icon size={16} strokeWidth={2.5} />
      </motion.div>
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="ml-2 p-1 rounded hover:bg-black/5 transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
