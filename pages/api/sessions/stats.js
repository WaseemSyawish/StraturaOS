import { PrismaClient } from "@prisma/client";
import { resolveUser } from "../../../lib/resolveUser";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await resolveUser(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

    // Today's sessions
    const todaySessions = await prisma.focusSession.findMany({
      where: {
        user_id: userId,
        started_at: { gte: todayStart },
      },
    });

    // This week's sessions
    const weekSessions = await prisma.focusSession.findMany({
      where: {
        user_id: userId,
        started_at: { gte: weekStart },
      },
    });

    // Calculate stats
    const todayDuration = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const weekDuration = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const todayCompleted = todaySessions.filter((s) => s.completed).length;
    const weekCompleted = weekSessions.filter((s) => s.completed).length;

    return res.status(200).json({
      success: true,
      stats: {
        today: {
          total_sessions: todaySessions.length,
          completed_sessions: todayCompleted,
          total_duration: todayDuration, // in seconds
          focus_duration: todaySessions
            .filter((s) => s.session_type === "focus")
            .reduce((sum, s) => sum + (s.duration || 0), 0),
        },
        week: {
          total_sessions: weekSessions.length,
          completed_sessions: weekCompleted,
          total_duration: weekDuration, // in seconds
          focus_duration: weekSessions
            .filter((s) => s.session_type === "focus")
            .reduce((sum, s) => sum + (s.duration || 0), 0),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching focus stats:", error);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
}
