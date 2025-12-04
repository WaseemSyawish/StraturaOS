import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import HygraphSidebar from '@/components/HygraphSidebar';
import { User, Mail, Palette, Save, X, Camera, GraduationCap, Calendar, BookOpen, Target, Award, Loader2, Check, ChevronRight, Settings, Bell, Shield } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', avatarColor: '' });
  const [stats, setStats] = useState({ courses: 0, tasks: 0, lectures: 0, events: 0, sessions: 0, gpa: null });
  const [toast, setToast] = useState(null);

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
          
          // Fetch stats
          const [coursesRes, eventsRes] = await Promise.all([
            fetch('/api/courses').catch(() => null),
            fetch('/api/events').catch(() => null)
          ]);
          const coursesData = coursesRes?.ok ? await coursesRes.json() : { courses: [] };
          const eventsData = eventsRes?.ok ? await eventsRes.json() : { events: [] };
          
          // Get events array from response
          const eventsArray = eventsData.events || [];
          
          // Lecture/schedule types - these are NOT tasks
          const lectureTypes = ['class', 'lab', 'tutorial', 'lecture', 'seminar', 'workshop'];
          
          // Task types - actual tasks/assignments
          const taskTypes = ['assignment', 'deadline', 'project', 'quiz', 'exam', 'task'];
          
          // Count lectures (schedule items)
          const lectures = eventsArray.filter(e => lectureTypes.includes(e.type?.toLowerCase())).length;
          
          // Count actual tasks (assignments, deadlines, etc.)
          const actualTasks = eventsArray.filter(e => taskTypes.includes(e.type?.toLowerCase())).length;
          
          // Total events count = everything
          const totalEvents = eventsArray.length;
          
          setStats({
            courses: coursesData.courses?.length || 0,
            tasks: actualTasks,
            lectures,
            events: totalEvents,
            sessions: 0,
            gpa: null
          });
        }
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const am = await fetch('/api/auth/me');
      const jm = am.ok ? await am.json() : null;
      if (!jm || !jm.authenticated) {
        window.location.href = '/signin';
        return;
      }
      const res = await fetch(`/api/users/${jm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const j = await res.json();
        if (j && j.user) {
          setProfile({ name: j.user.name, email: j.user.email, avatarColor: j.user.avatarColor });
        }
        setEditing(false);
        showToast('Profile updated successfully', 'success');
      } else {
        showToast('Failed to save profile', 'error');
      }
    } catch (e) {
      showToast('Failed to save profile', 'error');
    }
    setSaving(false);
  };

  return (
    <HygraphSidebar pageName="Profile">
      <Head>
        <title>Profile — StraturaOS</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Hero Header */}
        <div className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-cyan-600/10 dark:from-purple-600/5 dark:via-indigo-600/5 dark:to-cyan-600/5"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 dark:from-purple-400/10 dark:to-indigo-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-cyan-400/20 to-purple-400/20 dark:from-cyan-400/10 dark:to-purple-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
          
          <div className="relative max-w-4xl mx-auto px-6 py-12">
            {!profile ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Avatar */}
                <div className="relative group">
                  <div 
                    className="w-32 h-32 rounded-3xl shadow-2xl flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white dark:ring-slate-800 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: profile.avatarColor || '#7c3aed' }}
                  >
                    {getInitials(profile.name)}
                  </div>
                  <button 
                    onClick={() => { setForm({ name: profile.name || '', email: profile.email || '', avatarColor: profile.avatarColor || '#7c3aed' }); setEditing(true); }}
                    className="absolute -bottom-2 -right-2 p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
                  >
                    <Camera size={16} />
                  </button>
                </div>
                
                {/* Profile Info */}
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {profile.name || 'Student'}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center md:justify-start gap-2">
                    <Mail size={16} />
                    {profile.email || 'No email set'}
                  </p>
                  
                  {/* Quick Stats */}
                  <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                      <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{stats.courses} Courses</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                      <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{stats.events} Events</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{stats.lectures} Lectures</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                      <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{stats.tasks} Tasks</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Content Cards */}
        <div className="max-w-4xl mx-auto px-6 pb-12 -mt-4">
          <div className="grid gap-6">
            {/* Profile Settings Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profile Information</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Manage your personal details</p>
                    </div>
                  </div>
                  {!editing && profile && (
                    <button
                      onClick={() => { setForm({ name: profile.name || '', email: profile.email || '', avatarColor: profile.avatarColor || '#7c3aed' }); setEditing(true); }}
                      className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {!profile ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                ) : !editing ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <User className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</p>
                        <p className="text-base font-semibold text-slate-900 dark:text-white">{profile.name || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</p>
                        <p className="text-base font-semibold text-slate-900 dark:text-white">{profile.email || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <Palette className="w-5 h-5 text-slate-400" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avatar Color</p>
                        <div className="flex items-center gap-3 mt-1">
                          <div 
                            className="w-8 h-8 rounded-lg shadow-inner border border-slate-200 dark:border-slate-600"
                            style={{ backgroundColor: profile.avatarColor || '#7c3aed' }}
                          ></div>
                          <span className="text-base font-semibold text-slate-900 dark:text-white uppercase">{profile.avatarColor || '#7c3aed'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Avatar Color
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={form.avatarColor || '#7c3aed'}
                          onChange={e => setForm(f => ({ ...f, avatarColor: e.target.value }))}
                          className="w-16 h-12 rounded-xl cursor-pointer border-0 bg-transparent"
                        />
                        <div 
                          className="flex-1 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner"
                          style={{ backgroundColor: form.avatarColor || '#7c3aed' }}
                        >
                          {getInitials(form.name)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                    <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Quick access to app settings</p>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <button 
                  onClick={() => {
                    // TODO: Open notification settings modal or navigate to settings page
                    alert('Notification settings coming soon! You can configure task reminders on the Tasks page.');
                  }}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                      <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Notifications</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Manage your notification preferences</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
                
                <a href="/focus" className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                      <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Focus Settings</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Configure focus timer and breaks</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </a>
                
                <a href="/modules" className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Modules & Courses</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Manage your academic modules</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${
            toast.type === 'success' 
              ? 'bg-emerald-500/95 border-emerald-400 text-white' 
              : 'bg-red-500/95 border-red-400 text-white'
          }`}>
            {toast.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </HygraphSidebar>
  );
}