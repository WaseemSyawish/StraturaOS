import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import HygraphSidebar from '@/components/HygraphSidebar';
// CustomDropdown: dark-mode friendly select replacement
function CustomDropdown({ value, options, onChange, label }) {
  const selected = options.find((opt) => opt.value === value);
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
  <button className="max-w-xs w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex justify-between items-center transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-purple-50 dark:focus:bg-purple-900 shadow-none border border-transparent">
          <span>{selected ? selected.label : label}</span>
          <svg className="w-4 h-4 ml-2 text-gray-400 dark:text-gray-300" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeWidth="2" d="M6 8l4 4 4-4"/></svg>
        </button>
      </DropdownMenu.Trigger>
  <DropdownMenu.Content align="start" sideOffset={4} className="w-full rounded-lg shadow-md bg-white dark:bg-gray-800 py-1 border border-transparent z-50">
        {options.map((opt) => (
          <DropdownMenu.Item key={opt.value} onSelect={() => onChange(opt.value)} className={`px-3 py-2 cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 rounded ${value === opt.value ? 'bg-purple-50 dark:bg-purple-900 font-semibold' : ''}`}>
            {opt.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
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
  Smartphone
  , Loader2
} from 'lucide-react';

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

// Simple Card Components
const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="p-6 border-b border-gray-100 dark:border-gray-700">
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children }) => (
  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
    {children}
  </p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

// Simple Button Component
const Button = ({ children, onClick, variant = 'default', disabled = false, className = '' }) => {
  const baseStyles = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantStyles = {
    default: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
    outline: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// Simple Badge Component
const Badge = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-700',
    secondary: 'bg-gray-100 text-gray-700',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}>
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
  const { theme: currentTheme, setTheme } = useTheme();
  
  // Use the actual theme from useTheme hook, not from settings state
  const activeTheme = currentTheme || settings.theme;

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
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Confirm new password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
        </div>

        {pwdError && <p className="text-sm text-red-600">{pwdError}</p>}
        {pwdSuccess && <p className="text-sm text-green-600">Password changed successfully</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSavingPwd} className="inline-flex items-center">
            {isSavingPwd ? 'Saving...' : 'Change password'}
          </Button>
          <Button variant="outline" type="button" onClick={() => { setCurrentPassword(''); setNewPassword(''); setConfirm(''); }} disabled={isSavingPwd}>Cancel</Button>
        </div>
      </form>
    );
  }

  function update(key, value) {
    setSettings((s) => ({ ...s, [key]: value }));
    // Immediately apply theme changes
    if (key === 'theme' && setTheme && typeof setTheme === 'function') {
      setTheme(value);
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
      a.download = `university-planner-export-${new Date().toISOString().split('T')[0]}.json`;
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-transparent dark:bg-gray-900 p-3 sm:p-6">
      <Head>
        <title>Settings — University Planner</title>
      </Head>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Manage your account preferences and application settings</p>
        </div>

        {/* Status Messages */}
        {saved && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="font-medium text-green-900 dark:text-green-200">Settings saved successfully</p>
              <p className="text-sm text-green-700 dark:text-green-200">Your preferences have been updated</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-800 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-300" />
            </div>
            <div>
              <p className="font-medium text-red-900 dark:text-red-200">Error saving settings</p>
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`flex-shrink-0 lg:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                          activeSection === section.id
                            ? 'bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-800'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-purple-50 dark:focus:bg-purple-900'
                        }`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
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
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Appearance
                  </CardTitle>
                  <CardDescription>Customize how University Planner looks on your device</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
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
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                              activeTheme === option.value
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Icon className={`w-6 h-6 ${activeTheme === option.value ? 'text-purple-600' : 'text-gray-600'}`} />
                            <span className={`text-sm font-medium ${activeTheme === option.value ? 'text-purple-700' : 'text-gray-700'}`}>
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
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Schedule Settings
                  </CardTitle>
                  <CardDescription>Configure your schedule defaults and how views behave</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Week starts on</label>
                    <CustomDropdown
                      value={settings.weekStartsOn}
                      options={[
                        { value: 'monday', label: 'Monday' },
                        { value: 'sunday', label: 'Sunday' },
                      ]}
                      onChange={(val) => update('weekStartsOn', val)}
                      label="Select week start"
                    />
                    <p className="text-xs text-gray-500 mt-2">Choose which day your calendar week starts with</p>
                  </div>

                  <div className="border-t border-gray-200 my-6" />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default view</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['day', 'week', 'month'].map((view) => (
                        <button
                          key={view}
                          onClick={() => update('defaultView', view)}
                          className={`px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm capitalize ${
                            settings.defaultView === view
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
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
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Manage how you receive event reminders and alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-100">Browser Notifications</p>
                        <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                          Get notified before your events start. You can set multiple reminders (1 week, 2 days, 1 day, 1 hour, morning) when creating or editing events.
                        </p>
                        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied' && (
                          <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-200">
                            ⚠️ Browser notifications are blocked. Enable them in your browser settings to receive reminders.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-6" />

                  <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Enable browser notifications</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Receive browser notifications for event reminders</p>
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
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-6" />

                  <div className="space-y-4">
                    <div className="flex items-start justify-between opacity-60">
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Email notifications</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Get notified via email for important updates</p>
                          <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-800 text-xs">Coming Soon</Badge>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) => update('emailNotifications', e.target.checked)}
                          disabled
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-purple-400 opacity-50"></div>
                      </label>
                    </div>

                    <div className="flex items-start justify-between opacity-60">
                      <div className="flex items-start gap-3">
                        <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Mobile push notifications</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Receive push notifications on mobile devices</p>
                          <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-800 text-xs">Coming Soon</Badge>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={settings.pushNotifications}
                          onChange={(e) => update('pushNotifications', e.target.checked)}
                          disabled
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-purple-400 opacity-50"></div>
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
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security
                  </CardTitle>
                  <CardDescription>Manage your account security and authentication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Password Section */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">Keep your account secure with a strong password</p>
                    <ChangePasswordForm />
                  </div>

                  <div className="border-t border-gray-200 my-6" />

                  {/* Email Management */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">Update your email for account recovery and notifications</p>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Change Email Address
                    </Button>
                    <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-800">Coming Soon</Badge>
                  </div>

                  <div className="border-t border-gray-200 my-6" />

                  {/* Two-Factor Authentication */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-blue-900">Two-Factor Authentication (2FA)</p>
                        <p className="text-sm text-blue-700 mt-1">Add an extra layer of security to your account with 2FA</p>
                        <div className="mt-3 flex items-center gap-3">
                          <Button variant="outline" className="text-sm" disabled>
                            Enable 2FA
                          </Button>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 my-6" />

                  {/* Active Sessions */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      Active Sessions
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">Manage devices where you're currently signed in</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-900">Current Device</p>
                            <p className="text-xs text-green-700">Browser • Active now</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 font-semibold">Active</Badge>
                      </div>
                      <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" disabled>
                        Sign Out All Other Sessions
                      </Button>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 my-6" />

                  {/* Account Recovery */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Account Recovery
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">Set up recovery options in case you lose access to your account</p>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start" disabled>
                        <Mail className="w-4 h-4 mr-2" />
                        Add Recovery Email
                      </Button>
                      <Button variant="outline" className="w-full justify-start" disabled>
                        <Smartphone className="w-4 h-4 mr-2" />
                        Add Recovery Phone Number
                      </Button>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preferences Section */}
            {activeSection === 'preferences' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" />
                    General Preferences
                  </CardTitle>
                  <CardDescription>Additional settings for your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Data & Privacy</h4>
                    <p className="text-sm text-gray-600 mb-4">Download all your data in JSON format</p>
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

                  <div className="border-t border-gray-200 my-6" />

                  <div>
                    <h4 className="font-medium text-red-900 mb-2">Danger Zone</h4>
                    <p className="text-sm text-gray-600 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    <Button 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400"
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
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (isSaving) return;
                      setSettings(loadSettings());
                      setSaved(false);
                      setError('');
                    }}
                    className=""
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Changes
                  </Button>
                  <Button
                    onClick={handleSave}
                    className=""
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Delete Account</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    This action cannot be undone. All your data including events, courses, grades, and attendance records will be permanently deleted.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter password"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleDeleteAccount();
                    }}
                  />
                </div>

                {deleteError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
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
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || !deletePassword}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Account'
                    )}
                  </Button>
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