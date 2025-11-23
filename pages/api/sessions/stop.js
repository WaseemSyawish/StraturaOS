import prisma from "../../../lib/prisma";
import { resolveUser } from "../../../lib/resolveUser";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await resolveUser(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { session_id, elapsed_seconds, completed = true, notes } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: "Session ID required" });
    }

    // Update the focus session
    const focusSession = await prisma.focusSession.update({
      where: { id: session_id },
      data: {
        ended_at: new Date(),
        duration: elapsed_seconds, // Actual duration
        completed,
        notes: notes || null,
        updated_at: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      session: focusSession,
    });
  } catch (error) {
    console.error("Error stopping focus session:", error);
    return res.status(500).json({ error: "Failed to stop session" });
  }
}
