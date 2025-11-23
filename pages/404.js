import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function Custom404() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-purple-600 dark:text-purple-400">
            404
          </h1>
        </div>

        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <svg 
            className="w-10 h-10 text-purple-600 dark:text-purple-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-700 rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
