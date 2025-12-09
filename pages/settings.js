import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import HygraphSidebar from '@/components/HygraphSidebar';
import { useTheme } from 'next-themes';
import { 
  User, 
  Bell, 
  Palette, 
  Calendar, 
  Shield, 
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Moon,
  Sun,
  Monitor,
  Globe,
  Lock,
  Mail,
  Smartphone,
  Loader2,
  ChevronDown
} from 'lucide-react';

// Design system styles matching landing/auth pages
const ds = {
  pageBg: 'min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-[#0a0a0f] dark:via-[#0a0a0f] dark:to-[#12121a]',
  headerBand: 'relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 dark:from-purple-900/40 dark:via-purple-800/30 dark:to-indigo-900/40 border border-purple-500/20 dark:border-purple-500/10',
  card: 'bg-white/80 dark:bg-[#12121a] rounded-2xl border border-slate-200/60 dark:border-white/5 backdrop-blur-sm shadow-lg dark:shadow-xl dark:shadow-purple-500/5',
  cardHeader: 'p-6 border-b border-slate-100 dark:border-white/5',
  cardContent: 'p-6',
  headingXl: 'text-2xl sm:text-3xl font-extrabold text-white tracking-tight',
  headingLg: 'text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2',
  textMuted: 'text-sm text-slate-600 dark:text-slate-400 mt-1',
  iconBox: 'w-12 h-12 rounded-xl flex items-center justify-center',
  primaryBtn: 'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25 transition-all duration-200 disabled:opacity-50',
  secondaryBtn: 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-200',
  navItem: 'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150',
  navItemActive: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20',
  navItemInactive: 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5',
  input: 'w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all',
  toggle: 'relative w-12 h-6 rounded-full transition-colors',
  toggleOn: 'bg-purple-600',
  toggleOff: 'bg-slate-200 dark:bg-slate-700',
};

// CustomDropdown: dark-mode friendly select replacement
function CustomDropdown({ value, options, onChange, label }) {
  const selected = options.find((opt) => opt.value === value);
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 text-slate-900 dark:text-white flex justify-between items-center transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10">
          <span>{selected ? selected.label : label}</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="start" sideOffset={4} className="w-full min-w-[200px] rounded-xl shadow-xl bg-white dark:bg-[#1a1a24] py-1 border border-slate-200 dark:border-white/10 z-50">
        {options.map((opt) => (
          <DropdownMenu.Item 
            key={opt.value} 
            onSelect={() => onChange(opt.value)} 
            className={`px-4 py-2.5 cursor-pointer text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors duration-150 ${value === opt.value ? 'bg-purple-50 dark:bg-purple-500/10 font-semibold text-purple-700 dark:text-purple-300' : ''}`}
          >
            {opt.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
const DEFAULTS = {
  theme: 'system',
  weekStartsOn: 'monday',
  defaultView: 'week',
  notifications: true,
  emailNotifications: true,
  pushNotifications: false,
  language: 'en',
  timezone: 'auto',
};

function loadSettings() {
  try {
    const raw = localStorage.getItem('up:settings');
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULTS;
  }
}

function saveSettings(obj) {
  try {
    localStorage.setItem('up:settings', JSON.stringify(obj));
    return true;
  } catch (e) {
    return false;
  }
}

// Simple Card Components - Design System
const Card = ({ children, className = '' }) => (
  <div className={`${ds.card} ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className={ds.cardHeader}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`${ds.headingLg} ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children }) => (
  <p className={ds.textMuted}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`${ds.cardContent} ${className}`}>
    {children}
  </div>
);

// Simple Button Component - Design System
const Button = ({ children, onClick, variant = 'default', disabled = false, className = '', type = 'button' }) => {
  const styles = variant === 'outline' ? ds.secondaryBtn : ds.primaryBtn;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

// Simple Badge Component - Design System
const Badge = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    default: 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300',
    secondary: 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('appearance');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const { theme: currentTheme, setTheme } = useTheme();
  // eslint-disable-next-line no-unused-vars
  const [themeMounted, setThemeMounted] = useState(false);
  
  // Track when theme is ready (avoid hydration mismatch)
  useEffect(() => {
    setThemeMounted(true);
  }, []);
  
  // Use the actual theme from useTheme hook (reflects what next-themes applied)
  // For the settings UI, we compare against settings.theme to show what the USER selected
  // (not necessarily what's active, since 'system' resolves to light/dark)
  const activeTheme = settings.theme;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/users/settings');
        if (res.ok) {
          const json = await res.json();
          if (!mounted) return;
          const server = json?.settings;
          if (server) {
            setSettings({ ...DEFAULTS, ...server });
            try { localStorage.setItem('up:settings', JSON.stringify({ ...DEFAULTS, ...server })); } catch (e) {}
            // Set theme from server settings
            if (setTheme && typeof setTheme === 'function' && server.theme) {
              setTheme(server.theme);
            }
            return;
          }
        }
      } catch (e) {
        // ignore - fallback to local
      }
      const local = loadSettings();
      setSettings(local);
      // Set theme from local settings on mount
      if (setTheme && typeof setTheme === 'function' && local.theme) {
        setTheme(local.theme);
      }
    })();
    return () => { mounted = false; };
  }, [setTheme]);

  // ChangePasswordForm component scoped inside settings file
  function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [isSavingPwd, setIsSavingPwd] = useState(false);
    const [pwdError, setPwdError] = useState('');
    const [pwdSuccess, setPwdSuccess] = useState(false);

    async function submit(e) {
      e.preventDefault();
      setPwdError('');
      if (newPassword.length < 8) return setPwdError('New password must be at least 8 characters');
      if (newPassword !== confirm) return setPwdError('Password confirmation does not match');
      setIsSavingPwd(true);
      try {
        const res = await fetch('/api/users/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
        if (res.ok) {
          setPwdSuccess(true);
          setCurrentPassword(''); setNewPassword(''); setConfirm('');
          setTimeout(() => setPwdSuccess(false), 3000);
        } else {
          const json = await res.json().catch(() => ({}));
          setPwdError(json?.error || 'Failed to change password');
        }
      } catch (err) {
        setPwdError('Network error');
      }
      setIsSavingPwd(false);
    }

    return (
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={ds.input} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={ds.input} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm new password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={ds.input} />
        </div>

        {pwdError && <p className="text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">{pwdError}</p>}
        {pwdSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20">Password changed successfully</p>}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isSavingPwd}>
            {isSavingPwd ? 'Saving...' : 'Change password'}
          </Button>
          <Button variant="outline" type="button" onClick={() => { setCurrentPassword(''); setNewPassword(''); setConfirm(''); }} disabled={isSavingPwd}>Cancel</Button>
        </div>
      </form>
    );
  }

  function update(key, value) {
    setSettings((s) => {
      const newSettings = { ...s, [key]: value };
      // Persist to localStorage immediately for theme changes
      if (key === 'theme') {
        try { 
          localStorage.setItem('up:settings', JSON.stringify(newSettings));
          // Also update the next-themes storage key directly
          localStorage.setItem('up:theme', value);
        } catch (e) {
          console.warn('Failed to persist settings:', e);
        }
      }
      return newSettings;
    });
    // Immediately apply theme changes via next-themes
    if (key === 'theme' && setTheme && typeof setTheme === 'function') {
      setTheme(value);
      // Also dispatch event so _app.js can sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:settings:changed', { detail: { theme: value } }));
      }
    }
  }

  async function handleSave() {
    setError('');
    setIsSaving(true);
    try {
      const res = await fetch('/api/users/settings', { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(settings) 
      });
      if (res.ok) {
        const json = await res.json();
        const persisted = json?.settings ?? settings;
        try { localStorage.setItem('up:settings', JSON.stringify(persisted)); } catch (e) {}
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app:settings:changed', { detail: persisted }));
        setIsSaving(false);
        return;
      }
    } catch (e) {
      // ignore
    }

    const ok = saveSettings(settings);
    if (!ok) {
      setError('Failed to save settings — localStorage may be unavailable.');
      setSaved(false);
      setIsSaving(false);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app:settings:changed', { detail: settings }));
    setIsSaving(false);
  }

  async function handleDownloadData() {
    setIsDownloading(true);
    setError('');
    try {
      const res = await fetch('/api/export-data', {
        credentials: 'same-origin'
      });
      
      if (!res.ok) {
        // Get the actual error message from the API
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[settings] Export failed:', res.status, errorData);
        throw new Error(errorData.error || `Failed to export data (${res.status})`);
      }

      // Get the blob from response
      const blob = await res.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `straturaos-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to download data. Please try again.');
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch('/api/users/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword })
      });

      if (res.ok) {
        // Account deleted successfully - redirect to signin
        window.location.href = '/signin?deleted=true';
      } else {
        const json = await res.json().catch(() => ({}));
        setDeleteError(json?.error || 'Failed to delete account. Please check your password.');
      }
    } catch (err) {
      setDeleteError('Network error. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'timetable', label: 'Schedule', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
  ];

  return (
    <HygraphSidebar>
      <div className={ds.pageBg + ' p-4 sm:p-6 lg:p-8'}>
      <Head>
        <title>Settings — StraturaOS</title>
      </Head>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* ========== HERO HEADER BAND ========== */}
        <div className={ds.headerBand}>
          {/* Decorative gradient orbs */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl" />
          
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <SettingsIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className={ds.headingXl}>Settings</h1>
                <p className="text-purple-100 dark:text-purple-300/70 mt-1">
                  Manage your account preferences and application settings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {saved && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">Settings saved successfully</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300/70">Your preferences have been updated</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-red-900 dark:text-red-200">Error saving settings</p>
              <p className="text-sm text-red-700 dark:text-red-300/70">{error}</p>
            </div>
          </div>
        )}

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`flex-shrink-0 lg:w-full ${ds.navItem} ${
                          activeSection === section.id ? ds.navItemActive : ds.navItemInactive
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="whitespace-nowrap">{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center mr-1">
                      <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Appearance
                  </CardTitle>
                  <CardDescription>Customize how StraturaOS looks on your device</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'system', label: 'System', icon: Monitor },
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => update('theme', option.value)}
                            className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                              activeTheme === option.value
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                                : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/5'
                            }`}
                          >
                            <Icon className={`w-6 h-6 ${activeTheme === option.value ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400'}`} />
                            <span className={`text-sm font-medium ${activeTheme === option.value ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}`}>
                              {option.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schedule Section (formerly Calendar) */}
            {activeSection === 'timetable' && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center mr-1">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Schedule Settings
                  </CardTitle>
                  <CardDescription>Configure your schedule defaults and how views behave</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Week starts on</label>
                    <CustomDropdown
                      value={settings.weekStartsOn}
                      options={[
                        { value: 'monday', label: 'Monday' },
                        { value: 'sunday', label: 'Sunday' },
                      ]}
                      onChange={(val) => update('weekStartsOn', val)}
                      label="Select week start"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Choose which day your calendar week starts with</p>
                  </div>

                  <div className="border-t border-slate-200 dark:border-white/5 my-6" />

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Default view</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['day', 'week', 'month'].map((view) => (
                        <button
                          key={view}
                          onClick={() => update('defaultView', view)}
                          className={`px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm capitalize ${
                            settings.defaultView === view
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-slate-300 bg-white dark:bg-white/5'
                          }`}
                        >
                          {view}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center mr-1">
                      <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    Notifications
                  </CardTitle>
                  <CardDescription>Manage how you receive event reminders and alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-100">Browser Notifications</p>
                        <p className="text-sm text-blue-700 dark:text-blue-200/80 mt-1">
                          Get notified before your events start. You can set multiple reminders (1 week, 2 days, 1 day, 1 hour, morning) when creating or editing events.
                        </p>
                        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied' && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-xs text-red-700 dark:text-red-300">
                            ⚠️ Browser notifications are blocked. Enable them in your browser settings to receive reminders.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-white/5 my-6" />

                  <div className="flex items-start justify-between p-5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Enable browser notifications</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Receive browser notifications for event reminders</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications}
                        onChange={(e) => {
                          update('notifications', e.target.checked);
                          // Request permission if enabling
                          if (e.target.checked && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
                            Notification.requestPermission();
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className={`${ds.toggle} ${settings.notifications ? ds.toggleOn : ds.toggleOff} peer-focus:ring-2 peer-focus:ring-purple-500/40`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.notifications ? 'translate-x-6' : ''}`} />
                      </div>
                    </label>
                  </div>

                  <div className="border-t border-slate-200 dark:border-white/5 my-6" />

                  <div className="space-y-4">
                    <div className="flex items-start justify-between opacity-60 p-5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">Email notifications</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Get notified via email for important updates</p>
                          <Badge variant="secondary" className="mt-2 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">Coming Soon</Badge>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-not-allowed">
                        <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => update('emailNotifications', e.target.checked)} disabled className="sr-only peer" />
                        <div className={`${ds.toggle} ${ds.toggleOff} opacity-50`}>
                          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
                        </div>
                      </label>
                    </div>

                    <div className="flex items-start justify-between opacity-60 p-5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                      <div className="flex items-start gap-3">
                        <Smartphone className="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">Mobile push notifications</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Receive push notifications on mobile devices</p>
                          <Badge variant="secondary" className="mt-2 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">Coming Soon</Badge>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-not-allowed">
                        <input type="checkbox" checked={settings.pushNotifications} onChange={(e) => update('pushNotifications', e.target.checked)} disabled className="sr-only peer" />
                        <div className={`${ds.toggle} ${ds.toggleOff} opacity-50`}>
                          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
                        </div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mr-1">
                      <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    Security
                  </CardTitle>
                  <CardDescription>Manage your account security and authentication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Password Section */}
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Keep your account secure with a strong password</p>
                    <ChangePasswordForm />
                  </div>

                  <div className="border-t border-slate-200 dark:border-white/5 my-6" />

                  {/* Email Management */}
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Update your email for account recovery and notifications</p>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Change Email Address
                    </Button>
                    <Badge variant="secondary" className="mt-2 ml-2 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">Coming Soon</Badge>
                  </div>

                  <div className="border-t border-slate-200 dark:border-white/5 my-6" />

                  {/* Two-Factor Authentication */}
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-blue-900 dark:text-blue-100">Two-Factor Authentication (2FA)</p>
                        <p className="text-sm text-blue-700 dark:text-blue-200/80 mt-1">Add an extra layer of security to your account with 2FA</p>
                        <div className="mt-3 flex items-center gap-3">
                          <Button variant="outline" className="text-sm" disabled>
                            Enable 2FA
                          </Button>
                          <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">Coming Soon</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-white/5 my-6" />

                  {/* Active Sessions */}
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      Active Sessions
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Manage devices where you're currently signed in</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Current Device</p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300/70">Browser • Active now</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold">Active</Badge>
                      </div>
                      <Button variant="outline" className="w-full text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10" disabled>
                        Sign Out All Other Sessions
                      </Button>
                      <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">Coming Soon</Badge>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-white/5 my-6" />

                  {/* Account Recovery */}
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Account Recovery
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Set up recovery options in case you lose access to your account</p>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start" disabled>
                        <Mail className="w-4 h-4 mr-2" />
                        Add Recovery Email
                      </Button>
                      <Button variant="outline" className="w-full justify-start" disabled>
                        <Smartphone className="w-4 h-4 mr-2" />
                        Add Recovery Phone Number
                      </Button>
                      <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">Coming Soon</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preferences Section */}
            {activeSection === 'preferences' && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center mr-1">
                      <SettingsIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    General Preferences
                  </CardTitle>
                  <CardDescription>Additional settings for your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Data & Privacy</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Download all your data in JSON format</p>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start flex items-center gap-2"
                      onClick={handleDownloadData}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4" />
                          Download your data
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="border-t border-slate-200 dark:border-white/5 my-6" />

                  <div className="p-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                    <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">Danger Zone</h4>
                    <p className="text-sm text-red-700 dark:text-red-300/70 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    <Button 
                      variant="outline" 
                      className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-500/20 border-red-300 dark:border-red-500/30 hover:border-red-400"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (isSaving) return;
                      setSettings(loadSettings());
                      setSaved(false);
                      setError('');
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Changes
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#12121a] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-white/10">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Account</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    This action cannot be undone. All your data including events, courses, grades, and attendance records will be permanently deleted.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className={ds.input}
                    placeholder="Enter password"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleDeleteAccount();
                    }}
                  />
                </div>

                {deleteError && (
                  <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword('');
                      setDeleteError('');
                    }}
                    disabled={isDeleting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || !deletePassword}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/25 transition-all duration-200 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Account'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </HygraphSidebar>
  );
}