"use client";
import React from 'react'
import { createPortal } from 'react-dom'
import { useModal } from '@/providers/modal-context'
import { X } from 'lucide-react'

export default function CustomModal({ title, children }) {
  const { setClose } = useModal();

  if (typeof window === 'undefined') return null

  return createPortal(
  <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div
        // Use a theme-aware overlay. Use onMouseDown so clicks that begin
        // inside the panel won't accidentally close the modal due to timing
        // differences between mousedown/click handlers in some browsers.
        className="absolute inset-0 bg-black/40 dark:bg-white/5 backdrop-blur-md"
        onMouseDown={() => setClose()}
      />

  <div
    // Prevent pointer events on the overlay from reaching the panel and
    // ensure the panel itself receives pointer events. Stop propagation on
    // mouse down so child interactive elements remain responsive.
    className="relative w-full max-w-lg cozy rounded-md shadow-2xl ring-1 ring-white/6 overflow-hidden max-h-[95vh] bg-white dark:bg-slate-900 dark:ring-white/6 mx-4 z-[100000]"
    onMouseDown={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
  >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-xl font-semibold leading-tight text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            aria-label="Close"
            className="ml-4 p-2 rounded-full text-slate-500 hover:bg-white/6 dark:text-slate-300 dark:hover:bg-white/6"
            onClick={() => setClose()}
          >
            <X size={16} />
          </button>
        </div>

        {/* no separator here - content should sit directly under title like Mina */}

        <div className="text-slate-700 dark:text-slate-300 px-5 overflow-y-auto max-h-[calc(95vh-5rem)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">{children}</div>

        {/* modal footer intentionally omitted — modal content should render its own actions */}
      </div>
    </div>,
    document.body
  )
}

