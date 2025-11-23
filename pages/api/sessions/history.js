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

    const { limit = 50, offset = 0, from_date, to_date } = req.query;

    const where = {
      user_id: userId,
    };

    // Add date filters if provided
    if (from_date || to_date) {
      where.started_at = {};
      if (from_date) where.started_at.gte = new Date(from_date);
      if (to_date) where.started_at.lte = new Date(to_date);
    }

    // Get focus sessions with pagination
    const sessions = await prisma.focusSession.findMany({
      where,
      orderBy: { started_at: "desc" },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.focusSession.count({ where });

    return res.status(200).json({
      success: true,
      sessions,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Error fetching focus sessions:", error);
    return res.status(500).json({ error: "Failed to fetch sessions" });
  }
}
