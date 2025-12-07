import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Clock, Calendar, CheckCircle2, Circle, Target, Flame, TrendingUp, Timer } from "lucide-react";
import HygraphSidebar from '@/components/HygraphSidebar';

// Design system constants
const ds = {
  pageBg: 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950/20',
  headerBand: 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 dark:from-purple-700 dark:via-purple-600 dark:to-indigo-600',
  card: 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm',
  headingXl: 'text-3xl sm:text-4xl font-bold text-white',
};

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ today: {}, week: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        fetch("/api/sessions/history?limit=50"),
        fetch("/api/sessions/stats"),
      ]);

      const sessionsData = await sessionsRes.json();
      const statsData = await statsRes.json();

      if (sessionsData.success) {
        setSessions(sessionsData.sessions);
      }
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <HygraphSidebar>
    <>
      <Head>
        <title>Focus Sessions - StraturaOS</title>
      </Head>

      <div className={ds.pageBg}>
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl mx-4 sm:mx-6 mt-6 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-700 dark:via-purple-800 dark:to-purple-900 shadow-xl shadow-purple-500/10 dark:shadow-purple-900/30">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/2" />
          </div>
          
          <div className="relative max-w-6xl mx-auto px-6 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                  <Timer className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Focus Sessions</h1>
                  <p className="mt-1 text-purple-100 dark:text-purple-200">Track your productivity and focus time</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/focus')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 transition-all"
              >
                <Timer className="w-4 h-4" />
                Start Session
              </button>
            </div>
          </div>
        </div>

        {/* Stats - below hero, matching overview style */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="group relative bg-white dark:bg-[#12121a] rounded-2xl p-5 border border-gray-200/60 dark:border-white/5 hover:border-purple-300 dark:hover:border-purple-800/50 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 transition-transform duration-200 group-hover:scale-105">
                  <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                </div>
                <div className="text-right flex-1 min-w-0">
                  <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{formatDuration(stats.today.total_duration || 0)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stats.today.total_sessions || 0} sessions</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Today</p>
              </div>
            </div>

            <div className="group relative bg-white dark:bg-[#12121a] rounded-2xl p-5 border border-gray-200/60 dark:border-white/5 hover:border-purple-300 dark:hover:border-purple-800/50 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 transition-transform duration-200 group-hover:scale-105">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                </div>
                <div className="text-right flex-1 min-w-0">
                  <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{formatDuration(stats.week.total_duration || 0)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stats.week.total_sessions || 0} sessions</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">This Week</p>
              </div>
            </div>

            <div className="group relative bg-white dark:bg-[#12121a] rounded-2xl p-5 border border-gray-200/60 dark:border-white/5 hover:border-purple-300 dark:hover:border-purple-800/50 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-violet-50 dark:bg-violet-900/20 transition-transform duration-200 group-hover:scale-105">
                  <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                </div>
                <div className="text-right flex-1 min-w-0">
                  <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{formatDuration(stats.today.focus_duration || 0)}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Deep Work Today</p>
              </div>
            </div>

            <div className="group relative bg-white dark:bg-[#12121a] rounded-2xl p-5 border border-gray-200/60 dark:border-white/5 hover:border-purple-300 dark:hover:border-purple-800/50 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 transition-transform duration-200 group-hover:scale-105">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                </div>
                <div className="text-right flex-1 min-w-0">
                  <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{stats.today.completed_sessions || 0}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Completed Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className={ds.card}>
            <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Sessions</h2>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Clock className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">No sessions yet</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">Start a focus session to see it here</p>
                  <button
                    onClick={() => router.push('/focus')}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Timer className="w-4 h-4" />
                    Start Your First Session
                  </button>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {session.completed ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Circle className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              session.session_type === "focus"
                                ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                                : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            }`}
                          >
                            {session.session_type === "focus" ? "Focus" : "Break"}
                          </span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {formatDuration(session.duration)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(session.started_at)}
                        </div>
                      </div>
                    </div>

                    {session.notes && (
                      <p className="max-w-xs truncate text-sm text-slate-600 dark:text-slate-400">{session.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
    </HygraphSidebar>
  );
}
