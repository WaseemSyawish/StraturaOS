// src/components/Layout.js
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useRouter } from 'next/router';

// Simple error boundary to catch render errors in pages during client navigation.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] page render error', error, info);
  }
  reset() {
    this.setState({ hasError: false, error: null });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-lg font-semibold text-red-700">An error occurred rendering this page</h2>
          <pre className="mt-3 p-3 bg-white border rounded text-sm text-red-700 max-h-60 overflow-auto">{String(this.state.error && this.state.error.stack ? this.state.error.stack : this.state.error)}</pre>
          <div className="mt-3">
            <button onClick={() => this.reset()} className="px-3 py-1 rounded bg-slate-200">Try again</button>
            <button onClick={() => window.location.reload()} className="ml-2 px-3 py-1 rounded bg-red-100">Hard reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Layout = ({ children }) => {
  // start collapsed by default to give the main content more horizontal space
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // Handle hydration to prevent layout shift
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Call hooks unconditionally at top-level
  const router = useRouter();

  // Developer logging: track route change events so we can verify navigation
  useEffect(() => {
    try {
      console.log('[Layout] render, asPath=', router.asPath);
      const onStart = (url) => console.log('[Layout] routeChangeStart ->', url);
      const onComplete = (url) => console.log('[Layout] routeChangeComplete ->', url);
      const onError = (err, url) => {
        try {
          console.error('[Layout] routeChangeError ->', err, url);
        } catch (e) { console.error('[Layout] routeChangeError logging failed', e); }
      };
      if (router && router.events) {
        router.events.on('routeChangeStart', onStart);
        router.events.on('routeChangeComplete', onComplete);
        router.events.on('routeChangeError', onError);
      }
      return () => {
        if (router && router.events) {
          router.events.off('routeChangeStart', onStart);
          router.events.off('routeChangeComplete', onComplete);
          router.events.off('routeChangeError', onError);
        }
      };
    } catch (e) { /* ignore logging errors */ }
  }, [router]);

  // Fallback: if a client-side navigation appears stuck, listen for router events
  // and force a full-page navigation after a short grace period. This preserves
  // the prior safety net while removing the on-screen debug indicator UI.
  useEffect(() => {
    if (!router || !router.events) return;
    let t = null;
    const onStart = (url) => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        try {
          console.warn('[Layout] navigation appears stuck, forcing full reload to', url);
          window.location.href = url;
        } catch (e) {
          console.error('[Layout] failed to force reload', e);
        }
      }, 2500);
    };
    const onFinish = () => { if (t) { clearTimeout(t); t = null; } };

    router.events.on('routeChangeStart', onStart);
    router.events.on('routeChangeComplete', onFinish);
    router.events.on('routeChangeError', onFinish);

    return () => {
      if (t) clearTimeout(t);
      router.events.off('routeChangeStart', onStart);
      router.events.off('routeChangeComplete', onFinish);
      router.events.off('routeChangeError', onFinish);
    };
  }, [router]);

  // Global error hooks to capture unhandled exceptions/rejections
  useEffect(() => {
    function onWindowError(msg, url, lineNo, colNo, error) {
      try { console.error('[window.onerror]', { msg, url, lineNo, colNo, error }); } catch (e) {}
    }
    function onUnhandledRejection(e) {
      try { console.error('[unhandledrejection]', e); } catch (err) {}
    }
    window.addEventListener && window.addEventListener('error', onWindowError);
    window.addEventListener && window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener && window.removeEventListener('error', onWindowError);
      window.removeEventListener && window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  // Prevent rendering until mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  const publicPaths = ['/', '/landing', '/signin', '/signup', '/signout'];
  const isPublic = publicPaths.includes(router.pathname);

  // Sidebar rendered in-flow so it naturally takes up space and the main content
  // sits beside it; this avoids the large empty left gutter and preserves
  // the expected application layout for users.
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="flex">
        {/* Sidebar - keep it in the flow so it contributes to layout width */}
        {!isPublic && (
          <div className="flex-shrink-0">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Use router.asPath as a key so client-side route changes reliably remount
              the page content. Some users observed the URL updating while the
              previous page content (Overview) remained visible — forcing a
              remount fixes that symptom by ensuring React replaces the tree.
              This is a lightweight, low-risk remediation while we investigate
              the root cause further. */}
          <div key={router.asPath} className={`flex-1 flex flex-col overflow-hidden`}>
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;