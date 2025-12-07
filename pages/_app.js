// pages/_app.js

// eslint-disable-next-line no-unused-vars
import Head from 'next/head'
import { useRouter } from 'next/router'
import '../src/App.css'
import '../src/index.css'
import '../src/styles/typography.css'
import '../src/styles/calendar-theme.css'
import '../src/styles/dark-input-fix.css'
import Layout from '../src/components/Layout'
// eslint-disable-next-line no-unused-vars
import * as NextUI from '@nextui-org/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { NextUIProvider as NextUISystemProvider } from '@nextui-org/system'
import React, { useEffect, useState, useRef } from 'react'
import ModalProvider from '@/providers/modal-context'
import { ToastProvider } from '@/providers/toast-provider'
import { ConfirmProvider } from '@/providers/confirm-provider'
import { SessionProvider } from 'next-auth/react'

// Pages that should always use light mode (unauthenticated/public pages)
const LIGHT_MODE_ONLY_PAGES = ['/', '/landing', '/signin', '/signup', '/signout', '/forgot-password', '/reset-password', '/docs'];

// Pages where transitions should apply (only auth/landing pages)
const TRANSITION_PAGES = ['/', '/landing', '/signin', '/signup', '/signout', '/forgot-password', '/reset-password'];

// Page transition wrapper - only applies transitions between auth/landing pages
function PageTransition({ children }) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const transitionRef = useRef(null);
  const lastPathRef = useRef(router.asPath);

  // Check if a path is a transition page
  const isTransitionPage = (path) => {
    const cleanPath = path.split('?')[0];
    return TRANSITION_PAGES.includes(cleanPath);
  };

  useEffect(() => {
    const handleStart = (url) => {
      if (url !== router.asPath) {
        const fromPath = lastPathRef.current;
        const toPath = url.split('?')[0];
        
        // Only transition if BOTH from and to are auth/landing pages
        if (isTransitionPage(fromPath) && isTransitionPage(toPath)) {
          setIsTransitioning(true);
        }
      }
    };

    const handleComplete = (url) => {
      const fromPath = lastPathRef.current;
      const toPath = url.split('?')[0];
      lastPathRef.current = url;
      
      // Only delay for auth/landing page transitions, update immediately for app pages
      if (isTransitionPage(fromPath) && isTransitionPage(toPath)) {
        setTimeout(() => {
          setDisplayChildren(children);
          setIsTransitioning(false);
        }, 150);
      } else {
        // Immediate update for app pages - no delay
        setDisplayChildren(children);
        setIsTransitioning(false);
      }
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router, children]);

  // Update children when not transitioning
  useEffect(() => {
    if (!isTransitioning) {
      setDisplayChildren(children);
    }
  }, [children, isTransitioning]);

  return (
    <div
      ref={transitionRef}
      className={`${
        isTransitioning ? 'transition-all duration-300 ease-out opacity-0 scale-[0.99]' : ''
      }`}
    >
      {displayChildren}
    </div>
  );
}

function NavEnhancer() {
  useEffect(() => {
    function onDocClick(e) {
      const a = e.target.closest && e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      // Smooth scroll for same-page anchors
      if (href.startsWith('#')) {
        const id = href.slice(1);
        const el = document.getElementById(id);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // close mobile menu if open
        const toggle = document.getElementById('nav-toggle');
        if (toggle) toggle.checked = false;
        return;
      }
      // Close mobile menu when a nav link is clicked (non-anchor)
      if (a.closest && a.closest('.nav-right')) {
        const toggle = document.getElementById('nav-toggle');
        if (toggle) toggle.checked = false;
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        const toggle = document.getElementById('nav-toggle');
        if (toggle) toggle.checked = false;
      }
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  return null;
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  // Track and apply theme for global CSS vars and NextUI provider
  // eslint-disable-next-line no-unused-vars
  const [activeTheme, setActiveTheme] = useState('light');

  // Check if current page should force light mode
  const isLightModeOnlyPage = LIGHT_MODE_ONLY_PAGES.includes(router.pathname);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyTheme = (theme) => {
      const root = document.documentElement;
      root.classList.remove('dark');
      if (theme === 'dark') {
        root.classList.add('dark');
        setActiveTheme('dark');
      } else if (theme === 'system') {
        try {
          const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            root.classList.add('dark');
            setActiveTheme('dark');
          } else setActiveTheme('light');
        } catch (e) {
          setActiveTheme('light');
        }
      } else {
        setActiveTheme('light');
      }
    };

    const loadAndApply = () => {
      // Force light mode on unauthenticated pages
      if (isLightModeOnlyPage) {
        return applyTheme('light');
      }
      try {
        const raw = localStorage.getItem('up:settings');
        if (!raw) return applyTheme('system');
        const parsed = JSON.parse(raw);
        applyTheme(parsed?.theme || 'system');
      } catch (e) {
        applyTheme('system');
      }
    };

    loadAndApply();

    const onSettings = (e) => {
      // Don't apply theme changes on light-mode-only pages
      if (isLightModeOnlyPage) return;
      const detail = e?.detail || {};
      if (detail.theme) applyTheme(detail.theme);
    };

    window.addEventListener('app:settings:changed', onSettings);

    const mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const onPref = () => {
      // Don't apply system preference on light-mode-only pages
      if (isLightModeOnlyPage) return;
      try {
        const raw = localStorage.getItem('up:settings');
        const parsed = raw ? JSON.parse(raw) : {};
        if (!parsed || parsed.theme === 'system') {
          applyTheme('system');
        }
      } catch (e) {
        // ignore
      }
    };
    if (mql) {
      if (mql.addEventListener) mql.addEventListener('change', onPref);
      else mql.addListener(onPref);
    }

    return () => {
      window.removeEventListener('app:settings:changed', onSettings);
      if (mql) {
        if (mql.removeEventListener) mql.removeEventListener('change', onPref);
        else mql.removeListener(onPref);
      }
    };
  }, [isLightModeOnlyPage]);

  const content = (
    <>
      {/* stylesheet moved to pages/_document.js */}
      <Layout>
        <NavEnhancer />
        <PageTransition>
          <Component {...pageProps} />
        </PageTransition>
      </Layout>
    </>
  );

  // We'll use next-themes to toggle the `class` on <html> (so our CSS
  // variables in src/index.css take effect). Wrap the app in NextThemesProvider
  // then use the system NextUI provider for consistent portals/navigation.
  // Note: NextUI theming can be handled either via its `createTheme` helper
  // or via CSS variables; here we prefer CSS variables already defined in
  // src/index.css and rely on next-themes to toggle the html.dark class.
  return (
    <SessionProvider session={pageProps.session}>
      <NextThemesProvider attribute="class" defaultTheme="system">
        <NextUISystemProvider navigate={undefined}>
          <ToastProvider>
            <ConfirmProvider>
              <ModalProvider>
                {content}
              </ModalProvider>
            </ConfirmProvider>
          </ToastProvider>
        </NextUISystemProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
}