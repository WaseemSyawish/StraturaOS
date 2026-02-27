import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import HygraphSidebar from '@/components/HygraphSidebar';
import { User, Mail, Palette, Save, X, Camera, Calendar, BookOpen, Target, Loader2, Check, ChevronRight, Settings, Shield, GraduationCap, Clock, BarChart3, Edit3, LogOut, KeyRound, Bell, TrendingUp, Activity, Zap, CheckCircle2, Flame, Timer } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   DESIGN SYSTEM CONSTANTS — Matches other pages (no gradients)
   ───────────────────────────────────────────────────────────── */
const ds = {
  pageBg: 'min-h-screen bg-slate-50 dark:bg-[#0a0a0f]',
  card: 'bg-white/80 dark:bg-[#12121a] rounded-2xl shadow-lg dark:shadow-2xl dark:shadow-purple-500/5 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm',
  input: 'w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 transition-all text-sm',
};

const STAT_CARDS = [
  { key: 'avgGrade', label: 'Avg Grade', icon: GraduationCap, color: 'purple', suffix: '%' },
  { key: 'tasksCompleted', label: 'Completed', icon: CheckCircle2, color: 'emerald', suffix: '' },
  { key: 'focusHours', label: 'Focus', icon: Timer, color: 'blue', suffix: '' },
  { key: 'streak', label: 'Streak', icon: Flame, color: 'amber', suffix: 'd' },
];

const STAT_COLORS = {
  purple: { bg: 'bg-purple-100 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
  blue:   { bg: 'bg-blue-100 dark:bg-blue-500/10',     text: 'text-blue-600 dark:text-blue-400' },
  emerald:{ bg: 'bg-emerald-100 dark:bg-emerald-500/10',text: 'text-emerald-600 dark:text-emerald-400' },
  amber:  { bg: 'bg-amber-100 dark:bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400' },
};

const QUICK_LINKS = [
  { href: '/settings',   label: 'Settings',     desc: 'Theme, schedule, security', icon: Settings,      color: 'purple' },
  { href: '/modules',    label: 'Modules',       desc: 'Manage your courses',       icon: BookOpen,      color: 'blue' },
  { href: '/focus',      label: 'Focus Timer',   desc: 'Pomodoro & deep work',      icon: Zap,           color: 'emerald' },
  { href: '/grades',     label: 'Grades',        desc: 'Academic performance',      icon: GraduationCap, color: 'amber' },
  { href: '/attendance', label: 'Attendance',    desc: 'Session tracking',          icon: Clock,         color: 'rose' },
  { href: '/calendar',   label: 'Calendar',      desc: 'Schedule & deadlines',      icon: Calendar,      color: 'indigo' },
];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', avatarColor: '' });
  const [stats, setStats] = useState({ avgGrade: 0, tasksCompleted: 0, focusHours: '0h', streak: 0, totalTasks: 0, totalCourses: 0, upcomingDeadlines: 0 });
  const [toast, setToast] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const am = await fetch('/api/auth/me');
        const jm = am.ok ? await am.json() : null;
        if (jm && jm.authenticated && jm.id) {
          const res = await fetch(`/api/users/${jm.id}`);
          if (!mounted) return;
          if (res.ok) setProfile(await res.json());
          
          const [gradesRes, tasksRes, focusRes] = await Promise.all([
            fetch('/api/grades').catch(() => null),
            fetch('/api/tasks').catch(() => null),
            fetch('/api/focus/stats?period=30days').catch(() => null)
          ]);
          const gradesData = gradesRes?.ok ? await gradesRes.json() : { success: false };
          const tasksData = tasksRes?.ok ? await tasksRes.json() : { tasks: [] };
          const focusData = focusRes?.ok ? await focusRes.json() : { stats: null };

          // Compute average grade across courses
          let avgGrade = 0;
          const courses = gradesData.success ? (gradesData.data || []) : [];
          const coursesWithGrades = courses.filter(c => c.assessments?.length > 0);
          if (coursesWithGrades.length > 0) {
            const coursePercentages = coursesWithGrades.map(c => {
              const totalWeight = c.assessments.reduce((s, a) => s + (a.weight || 0), 0);
              let weighted = 0;
              c.assessments.forEach(a => {
                const items = a.items || [];
                if (items.length === 0) return;
                const catAvg = items.reduce((s, i) => s + ((i.score || 0) / (i.maxScore || 100) * 100), 0) / items.length;
                weighted += (catAvg * (a.weight || 0)) / 100;
              });
              return totalWeight > 0 ? (weighted / totalWeight) * 100 : 0;
            }).filter(p => p > 0);
            avgGrade = coursePercentages.length > 0 ? Math.round(coursePercentages.reduce((a, b) => a + b, 0) / coursePercentages.length) : 0;
          }

          // Tasks stats
          const allTasks = tasksData.tasks || [];
          const completedTasks = allTasks.filter(t => t.completed);
          const now = new Date();
          const upcomingDeadlines = allTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) > now && new Date(t.dueDate) < new Date(now.getTime() + 7 * 86400000)).length;

          // Focus stats
          const focusStats = focusData.stats || {};
          const focusFormatted = focusStats.totalFocusTime?.formatted || '0h 0m';
          const streak = focusStats.currentStreak || 0;

          if (mounted) {
            setStats({
              avgGrade,
              tasksCompleted: completedTasks.length,
              focusHours: focusFormatted,
              streak,
              totalTasks: allTasks.length,
              totalCourses: courses.length,
              upcomingDeadlines,
            });
          }
        }
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('File size must be less than 5MB', 'error'); return; }
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) { showToast('Please upload a JPEG, PNG, GIF, or WebP image', 'error'); return; }

    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await fetch('/api/users/avatar', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.avatarUrl) {
        setProfile(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
        showToast('Avatar updated successfully');
      } else {
        showToast(data.error || 'Failed to upload avatar', 'error');
      }
    } catch {
      showToast('Failed to upload avatar', 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const am = await fetch('/api/auth/me');
      const jm = am.ok ? await am.json() : null;
      if (!jm || !jm.authenticated) { window.location.href = '/signin'; return; }
      const res = await fetch(`/api/users/${jm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const j = await res.json();
        if (j?.user) setProfile(prev => ({ ...prev, name: j.user.name, email: j.user.email, avatarColor: j.user.avatarColor }));
        setEditing(false);
        showToast('Profile updated successfully');
      } else {
        showToast('Failed to save profile', 'error');
      }
    } catch {
      showToast('Failed to save profile', 'error');
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/local-signout', { method: 'POST' });
      window.location.href = '/signin';
    } catch {
      window.location.href = '/signin';
    }
  };

  /* ─── Member Since helper ─── */
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <HygraphSidebar pageName="Profile">
      <Head>
        <title>Profile — StraturaOS</title>
      </Head>
      
      <div className={`${ds.pageBg} p-4 sm:p-6 lg:p-8`}>
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* ─────────── Hero / Identity Card ─────────── */}
          <div className={`${ds.card} overflow-hidden`}>
            {/* Solid purple banner */}
            <div className="h-28 sm:h-36 bg-purple-600 dark:bg-purple-900/50 relative">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-purple-400/10 rounded-full blur-2xl" />
              </div>
            </div>

            <div className="relative px-6 pb-6">
              {/* Avatar — overlaps the banner */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-14 sm:-mt-16">
                <div className="relative group flex-shrink-0">
                  {profile?.avatarUrl ? (
                    <div 
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl shadow-xl overflow-hidden ring-4 ring-white dark:ring-[#12121a] transition-transform duration-300 group-hover:scale-[1.03]"
                    >
                      <img src={profile.avatarUrl} alt={profile.name || 'User'} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div 
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl shadow-xl flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white dark:ring-[#12121a] transition-transform duration-300 group-hover:scale-[1.03]"
                      style={{ backgroundColor: profile?.avatarColor || '#7c3aed' }}
                    >
                      {getInitials(profile?.name)}
                    </div>
                  )}

                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleAvatarUpload} className="hidden" />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 p-2 bg-white dark:bg-[#1a1a24] rounded-xl shadow-lg border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all disabled:opacity-50"
                  >
                    {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  </button>
                </div>

                {/* Name + Email + Actions */}
                <div className="flex-1 text-center sm:text-left pt-2 sm:pt-0 sm:pb-1 min-w-0">
                  {!profile ? (
                    <div className="flex items-center justify-center sm:justify-start py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                        {profile.name || 'Student'}
                      </h1>
                      <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 text-sm mt-0.5">
                        <Mail size={13} />
                        {profile.email || 'No email set'}
                      </p>
                      {memberSince && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          Member since {memberSince}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Top-right action buttons (desktop) */}
                {profile && (
                  <div className="hidden sm:flex items-center gap-2 pb-1">
                    <button
                      onClick={() => { setForm({ name: profile.name || '', email: profile.email || '', avatarColor: profile.avatarColor || '#7c3aed' }); setEditing(true); }}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-xl transition-colors border border-purple-200/60 dark:border-purple-500/20"
                    >
                      <Edit3 size={14} />
                      Edit Profile
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-colors border border-slate-200/60 dark:border-slate-700/60"
                    >
                      <LogOut size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile action row */}
              {profile && (
                <div className="sm:hidden flex gap-2 mt-4">
                  <button
                    onClick={() => { setForm({ name: profile.name || '', email: profile.email || '', avatarColor: profile.avatarColor || '#7c3aed' }); setEditing(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 rounded-xl transition-colors"
                  >
                    <Edit3 size={14} />
                    Edit Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              )}

              {/* Stats Row */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STAT_CARDS.map(({ key, label, icon: Icon, color, suffix }) => (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-100 dark:border-slate-800/60">
                    <div className={`w-9 h-9 rounded-lg ${STAT_COLORS[color].bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${STAT_COLORS[color].text}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{stats[key]}{suffix}</p>
                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─────────── Main Content Grid ─────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ─── Left Column (2 cols) ─── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Profile Information / Edit Form */}
              <div className={`${ds.card} overflow-hidden`}>
                <div className="p-5 sm:p-6 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account details</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-5 sm:p-6">
                  {!profile ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                      <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                      <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    </div>
                  ) : !editing ? (
                    <div className="space-y-3">
                      {[
                        { icon: User, label: 'Full Name', value: profile.name || 'Not set' },
                        { icon: Mail, label: 'Email Address', value: profile.email || 'Not set' },
                      ].map(({ icon: Ic, label, value }) => (
                        <div key={label} className="flex items-center gap-4 p-4 bg-slate-50/80 dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-slate-800/60">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                            <Ic className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 truncate">{value}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Avatar Color */}
                      <div className="flex items-center gap-4 p-4 bg-slate-50/80 dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-slate-800/60">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Palette className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avatar Color</p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="w-7 h-7 rounded-lg shadow-sm flex-shrink-0" style={{ backgroundColor: profile.avatarColor || '#7c3aed' }} />
                            <span className="text-sm font-semibold text-slate-900 dark:text-white uppercase font-mono">{profile.avatarColor || '#7c3aed'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                          <User size={13} className="text-slate-400" />
                          Full Name
                        </label>
                        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={ds.input} placeholder="Enter your full name" autoFocus />
                      </div>
                      
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                          <Mail size={13} className="text-slate-400" />
                          Email Address
                        </label>
                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={ds.input} placeholder="Enter your email" />
                      </div>
                      
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                          <Palette size={13} className="text-slate-400" />
                          Avatar Color
                        </label>
                        <div className="flex items-center gap-4">
                          <input type="color" value={form.avatarColor || '#7c3aed'} onChange={e => setForm(f => ({ ...f, avatarColor: e.target.value }))} className="w-14 h-11 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700/60 bg-transparent" />
                          <div className="flex-1 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: form.avatarColor || '#7c3aed' }}>
                            {getInitials(form.name)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="h-px bg-slate-200/60 dark:bg-slate-800/60 my-2" />
                      
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setEditing(false)} className="flex-1 h-11 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors">
                          Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 h-11 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
                          {saving ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving...</>) : (<><Save className="w-4 h-4" />Save Changes</>)}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Account & Security Card */}
              <div className={`${ds.card} overflow-hidden`}>
                <div className="p-5 sm:p-6 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account & Security</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Manage your security preferences</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 sm:p-6 space-y-3">
                  <a href="/settings" className="flex items-center gap-4 p-4 bg-slate-50/80 dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-white/[0.05] transition-colors group cursor-pointer">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                      <KeyRound className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Change Password</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Update your account password</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                  <a href="/settings" className="flex items-center gap-4 p-4 bg-slate-50/80 dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-white/[0.05] transition-colors group cursor-pointer">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Notification Preferences</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Reminders & alert settings</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                  <button onClick={handleSignOut} className="w-full flex items-center gap-4 p-4 bg-red-50/60 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-500/10 hover:bg-red-100/80 dark:hover:bg-red-500/10 transition-colors group text-left">
                    <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <LogOut className="w-4 h-4 text-red-500 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">Sign Out</p>
                      <p className="text-xs text-red-400 dark:text-red-500/70">Log out of your account</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Right Column (1 col) ─── */}
            <div className="space-y-6">
              {/* Quick Links */}
              <div className={`${ds.card} overflow-hidden`}>
                <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Quick Links</h2>
                  </div>
                </div>
                <div className="p-2">
                  {QUICK_LINKS.map(({ href, label, desc, icon: Icon, color }) => {
                    const c = STAT_COLORS[color] || STAT_COLORS.purple;
                    const roseOverride = color === 'rose'
                      ? { bg: 'bg-rose-100 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400' }
                      : color === 'indigo'
                      ? { bg: 'bg-indigo-100 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' }
                      : c;
                    const cc = roseOverride;
                    return (
                      <a key={href} href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group">
                        <div className={`w-9 h-9 rounded-lg ${cc.bg} flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${cc.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Academic Summary Mini-Card */}
              <div className={`${ds.card} overflow-hidden`}>
                <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Academic Summary</h2>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><GraduationCap size={14} className="text-purple-500" /> Average Grade</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.avgGrade > 0 ? `${stats.avgGrade}%` : '—'}</span>
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-800/60" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><BookOpen size={14} className="text-blue-500" /> Courses</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.totalCourses}</span>
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-800/60" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Tasks Done</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.tasksCompleted}{stats.totalTasks > 0 ? <span className="text-slate-400 font-normal"> / {stats.totalTasks}</span> : ''}</span>
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-800/60" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><Timer size={14} className="text-blue-500" /> Focus (30d)</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.focusHours}</span>
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-800/60" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><Flame size={14} className="text-amber-500" /> Study Streak</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.streak > 0 ? `${stats.streak} day${stats.streak !== 1 ? 's' : ''}` : '—'}</span>
                  </div>
                  {stats.upcomingDeadlines > 0 && (
                    <>
                      <div className="h-px bg-slate-100 dark:bg-slate-800/60" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2"><Clock size={14} /> Due This Week</span>
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{stats.upcomingDeadlines}</span>
                      </div>
                    </>
                  )}
                  <a href="/grades" className="block mt-3 text-center text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
                    View grades & analytics →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-sm border ${
              toast.type === 'success' 
                ? 'bg-emerald-500/95 border-emerald-400/50 text-white' 
                : 'bg-red-500/95 border-red-400/50 text-white'
            }`}
            style={{ animation: 'popIn 160ms cubic-bezier(.2,.9,.25,1)' }}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          <style>{`@keyframes popIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
        </div>
      )}
    </HygraphSidebar>
  );
}