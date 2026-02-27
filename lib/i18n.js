/**
 * i18n — Simple internationalization framework
 *
 * Supports English (en) and Arabic (ar) with RTL detection.
 * Uses a flat key lookup with nested dot notation support.
 *
 * Usage:
 *   import { useI18n } from '../lib/i18n';
 *   const { t, locale, dir, setLocale } = useI18n();
 *   t('tasks.addTask')  → "Add task" (en) or "إضافة مهمة" (ar)
 */

import { useState, useCallback, useEffect, createContext, useContext, useMemo } from 'react';

// Locale metadata
export const LOCALES = {
  en: { label: 'English', dir: 'ltr', flag: '🇺🇸' },
  ar: { label: 'العربية', dir: 'rtl', flag: '🇮🇶' },
};

export const DEFAULT_LOCALE = 'en';
export const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

// Cache loaded translations
const translationCache = {};

/**
 * Load translations for a locale (client-side)
 */
async function loadTranslations(locale) {
  if (translationCache[locale]) return translationCache[locale];

  try {
    const res = await fetch(`/locales/${locale}.json`);
    if (!res.ok) throw new Error(`Failed to load locale: ${locale}`);
    const data = await res.json();
    translationCache[locale] = flattenObj(data);
    return translationCache[locale];
  } catch (err) {
    console.warn(`[i18n] Could not load locale "${locale}", falling back to "${DEFAULT_LOCALE}"`, err);
    if (locale !== DEFAULT_LOCALE) return loadTranslations(DEFAULT_LOCALE);
    return {};
  }
}

/**
 * Flatten nested object into dot-notation keys
 * { tasks: { add: "Add" } } → { "tasks.add": "Add" }
 */
function flattenObj(obj, prefix = '') {
  const result = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObj(obj[key], fullKey));
    } else {
      result[fullKey] = obj[key];
    }
  }
  return result;
}

/**
 * Interpolate variables: "Hello {{name}}" + { name: "Ali" } → "Hello Ali"
 */
function interpolate(template, vars = {}) {
  if (!template || typeof template !== 'string') return template || '';
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`;
  });
}

/**
 * Detect user's preferred locale
 */
export function detectLocale(userLocale) {
  // 1. Explicit user preference from DB
  if (userLocale && LOCALES[userLocale]) return userLocale;

  // 2. LocalStorage preference
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('stratura_locale');
    if (stored && LOCALES[stored]) return stored;
  }

  // 3. Browser language
  if (typeof navigator !== 'undefined') {
    const lang = (navigator.language || '').split('-')[0];
    if (LOCALES[lang]) return lang;
  }

  return DEFAULT_LOCALE;
}

/**
 * Check if locale is RTL
 */
export function isRTL(locale) {
  return RTL_LOCALES.includes(locale);
}

/**
 * Get text direction for locale
 */
export function getDir(locale) {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

// ─── React Context ─────────────────────────────────────────

const I18nContext = createContext(null);

export function I18nProvider({ children, initialLocale, userLocale }) {
  const [locale, setLocaleState] = useState(() => detectLocale(userLocale || initialLocale));
  const [translations, setTranslations] = useState({});
  const [ready, setReady] = useState(false);

  // Load translations when locale changes
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    loadTranslations(locale).then((t) => {
      if (!cancelled) {
        setTranslations(t);
        setReady(true);
      }
    });
    return () => { cancelled = true; };
  }, [locale]);

  // Apply dir attribute to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = getDir(locale);
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((newLocale) => {
    if (!LOCALES[newLocale]) return;
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stratura_locale', newLocale);
    }
  }, []);

  const t = useCallback((key, vars) => {
    const value = translations[key];
    if (value === undefined) {
      // Development warning for missing keys
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[i18n] Missing key: "${key}" for locale "${locale}"`);
      }
      // Fallback: return key's last segment as readable text
      return key.split('.').pop().replace(/([A-Z])/g, ' $1').trim();
    }
    return vars ? interpolate(value, vars) : value;
  }, [translations, locale]);

  const dir = useMemo(() => getDir(locale), [locale]);
  const rtl = useMemo(() => isRTL(locale), [locale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
    dir,
    rtl,
    ready,
    locales: LOCALES,
  }), [locale, setLocale, t, dir, rtl, ready]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to use i18n in components
 */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback for components outside provider
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key) => key.split('.').pop(),
      dir: 'ltr',
      rtl: false,
      ready: true,
      locales: LOCALES,
    };
  }
  return ctx;
}

/**
 * RTL-aware style helper
 * Converts margin-left → margin-right for RTL, etc.
 */
export function rtlStyle(rtl, styles) {
  if (!rtl) return styles;

  const swapMap = {
    marginLeft: 'marginRight',
    marginRight: 'marginLeft',
    paddingLeft: 'paddingRight',
    paddingRight: 'paddingLeft',
    left: 'right',
    right: 'left',
    borderLeft: 'borderRight',
    borderRight: 'borderLeft',
    borderTopLeftRadius: 'borderTopRightRadius',
    borderTopRightRadius: 'borderTopLeftRadius',
    borderBottomLeftRadius: 'borderBottomRightRadius',
    borderBottomRightRadius: 'borderBottomLeftRadius',
    textAlign: undefined, // handled separately
  };

  const result = {};
  for (const [key, value] of Object.entries(styles)) {
    if (key === 'textAlign') {
      result.textAlign = value === 'left' ? 'right' : value === 'right' ? 'left' : value;
    } else if (swapMap[key]) {
      result[swapMap[key]] = value;
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Date formatting helper with locale support
 */
export function formatDate(date, locale = DEFAULT_LOCALE, options = {}) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const defaults = { year: 'numeric', month: 'short', day: 'numeric' };
  return d.toLocaleDateString(locale === 'ar' ? 'ar-IQ' : 'en-US', { ...defaults, ...options });
}

/**
 * Relative time formatting: "2 hours ago", "in 3 days"
 */
export function formatRelativeTime(date, locale = DEFAULT_LOCALE) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
    const rtf = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar-IQ' : 'en', { numeric: 'auto' });
    if (Math.abs(diffDay) >= 1) return rtf.format(diffDay, 'day');
    if (Math.abs(diffHour) >= 1) return rtf.format(diffHour, 'hour');
    if (Math.abs(diffMin) >= 1) return rtf.format(diffMin, 'minute');
    return rtf.format(diffSec, 'second');
  }

  // Fallback
  const abs = Math.abs(diffDay);
  if (abs === 0) return locale === 'ar' ? 'اليوم' : 'Today';
  if (abs === 1) return diffDay > 0
    ? (locale === 'ar' ? 'غداً' : 'Tomorrow')
    : (locale === 'ar' ? 'أمس' : 'Yesterday');
  return `${abs} ${locale === 'ar' ? 'أيام' : 'days'} ${diffDay > 0 ? (locale === 'ar' ? 'قادمة' : 'from now') : (locale === 'ar' ? 'مضت' : 'ago')}`;
}
