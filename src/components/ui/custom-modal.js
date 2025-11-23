"use client";
import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useModal } from '@/providers/modal-context'
import { X, MoreVertical, Clock, Star } from 'lucide-react'

export default function CustomModal({ title, children, headerActions, showMinimalHeader = false }) {
  const { setClose } = useModal();

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [setClose]);

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[99999] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute inset-0 bg-black/40 dark:bg-white/5 backdrop-blur-md"
          onMouseDown={() => setClose()}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ 
            duration: 0.3, 
            ease: [0.16, 1, 0.3, 1]
          }}
          className="relative w-full max-w-lg rounded-xl shadow-2xl overflow-hidden max-h-[95vh] bg-white dark:bg-slate-900 mx-4 z-[100000]"
          onMouseDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
        {showMinimalHeader ? (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <button
              aria-label="Close"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setClose()}
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-1">
              <button
                aria-label="Set reminder"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Clock size={18} />
              </button>
              <button
                aria-label="Add to favorites"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Star size={18} />
              </button>
              {headerActions}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
            <button
              aria-label="Close"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setClose()}
            >
              <X size={18} />
            </button>
          </div>
        )}

          <div className="text-slate-700 dark:text-slate-300 px-6 pb-6 overflow-y-auto max-h-[calc(95vh-5rem)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">{children}</div>

          {/* modal footer intentionally omitted — modal content should render its own actions */}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}

