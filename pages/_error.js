import React from 'react';
import Link from 'next/link';

const isDevelopment = process.env.NODE_ENV === 'development';

export default function ErrorPage({ statusCode, err }) {
  // In production, show generic error page
  if (!isDevelopment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <h1 className="text-8xl font-bold text-purple-600 dark:text-purple-400">
              {statusCode || 500}
            </h1>
          </div>
          
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            An error occurred while processing your request. Please try again later.
          </p>

          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // In development, show detailed error information
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 40, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 24, marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, color: '#991b1b', margin: '0 0 16px 0' }}>
          Error {statusCode || 500} - Development Mode
        </h1>
        <p style={{ color: '#7f1d1d', fontSize: 14 }}>
          This detailed error view is only shown in development. Production users see a generic error page.
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Error Details</h2>
        {err && err.message && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 16, marginBottom: 12 }}>
            <strong style={{ color: '#0f172a' }}>Message:</strong>
            <pre style={{ margin: '8px 0 0 0', color: '#dc2626', fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {err.message}
            </pre>
          </div>
        )}
        
        {err && err.stack && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 16 }}>
            <strong style={{ color: '#0f172a' }}>Stack Trace:</strong>
            <pre style={{ margin: '8px 0 0 0', color: '#475569', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'auto' }}>
              {err.stack}
            </pre>
          </div>
        )}
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 20 }}>
        <h3 style={{ fontSize: 16, color: '#1e40af', marginBottom: 12 }}>Common Causes:</h3>
        <ul style={{ color: '#1e3a8a', margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 8 }}>Database connection issues - check <code>DATABASE_URL</code></li>
          <li style={{ marginBottom: 8 }}>Missing environment variables</li>
          <li style={{ marginBottom: 8 }}>API route errors or missing dependencies</li>
          <li style={{ marginBottom: 8 }}>Check <code>/api/health</code> endpoint for system status</li>
        </ul>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 500;
  return { statusCode, err: isDevelopment ? err : null };
};
