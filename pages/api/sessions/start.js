import prisma from "../../../lib/prisma";
import { resolveUser } from "../../../lib/resolveUser";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await resolveUser(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { session_type = "focus", task_id, duration = 1500 } = req.body;

    // Create new focus session
    const focusSession = await prisma.focusSession.create({
      data: {
        user_id: userId,
        task_id: task_id || null,
        session_type,
        duration, // Expected duration in seconds
        started_at: new Date(),
        completed: false,
      },
    });

    return res.status(200).json({
      success: true,
      session: focusSession,
    });
  } catch (error) {
    console.error("Error starting focus session:", error);
    return res.status(500).json({ error: "Failed to start session" });
  }
}
