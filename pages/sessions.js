import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Clock, Calendar, CheckCircle2, Circle } from "lucide-react";
import HygraphSidebar from '@/components/HygraphSidebar';

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <HygraphSidebar>
    <>
      <Head>
        <title>Focus Sessions - University Planner</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/30">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="mb-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back
            </button>
            <h1 className="text-4xl font-bold text-slate-900">Focus Sessions</h1>
            <p className="mt-2 text-slate-600">Track your productivity and focus time</p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500">Today</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {formatDuration(stats.today.total_duration || 0)}
              </p>
              <p className="mt-1 text-sm text-slate-600">{stats.today.total_sessions || 0} sessions</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500">This Week</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {formatDuration(stats.week.total_duration || 0)}
              </p>
              <p className="mt-1 text-sm text-slate-600">{stats.week.total_sessions || 0} sessions</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500">Focus Time (Today)</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">
                {formatDuration(stats.today.focus_duration || 0)}
              </p>
              <p className="mt-1 text-sm text-slate-600">Deep work</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500">Completed</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {stats.today.completed_sessions || 0}
              </p>
              <p className="mt-1 text-sm text-slate-600">Sessions finished</p>
            </div>
          </div>

          {/* Sessions List */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Sessions</h2>
            </div>

            <div className="divide-y divide-slate-100">
              {sessions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Clock className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-4 text-sm text-slate-600">No sessions yet</p>
                  <p className="mt-1 text-xs text-slate-500">Start a focus session to see it here</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {session.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              session.session_type === "focus"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {session.session_type === "focus" ? "Focus" : "Break"}
                          </span>
                          <span className="text-sm font-medium text-slate-900">
                            {formatDuration(session.duration)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(session.started_at)}
                        </div>
                      </div>
                    </div>

                    {session.notes && (
                      <p className="max-w-xs truncate text-sm text-slate-600">{session.notes}</p>
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
