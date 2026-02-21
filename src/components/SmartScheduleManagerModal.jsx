import React from 'react';
import { X } from 'lucide-react';
import SmartScheduleManager from './SmartScheduleManager';

export default function SmartScheduleManagerModal({ open, onClose, onUpdate }) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Smart Schedules</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Edit or delete schedule patterns</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <SmartScheduleManager 
              onClose={onClose}
              onUpdate={onUpdate}
            />
          </div>
        </div>
      </div>
    </>
  );
}
