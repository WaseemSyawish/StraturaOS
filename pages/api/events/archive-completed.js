import prisma from '../../../lib/prisma';

// POST /api/events/archive-completed?hours=24&dry=true
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const hours = req.query && req.query.hours ? Number(req.query.hours) : 24;
    const dry = req.query && (req.query.dry === 'true' || req.query.dry === '1');
    const thresholdMs = Number.isFinite(Number(hours)) && Number(hours) > 0 ? Number(hours) * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - thresholdMs);

    // Find candidate events:
    // - any active (archived=false) event whose scheduled `date` is older than cutoff, OR
    // - any active event where completed=true and updated_at < cutoff (proxy for completion time)
    const candidates = await prisma.event.findMany({
      where: {
        archived: false,
        OR: [
          { date: { lt: cutoff } },
          { AND: [ { completed: true }, { updated_at: { lt: cutoff } } ] }
        ]
      },
      select: {
        id: true,
        title: true,
        type: true,
        course_id: true,
        date: true,
        time: true,
        description: true,
        completed: true,
        user_id: true,
        created_at: true,
        updated_at: true,
        color: true,
        end_date: true,
        template_id: true
      }
    });

    // Determine lecture-series protection: don't archive lecture events that belong
    // to a series which still has occurrences within the lecture-specific threshold.
    const ids = candidates.map(c => c.id);

    // Lecture-specific threshold: 48 hours from now (always use 48h for lecture series)
    const LECTURE_THRESHOLD_MS = 48 * 60 * 60 * 1000;
    const lectureCutoff = new Date(Date.now() - LECTURE_THRESHOLD_MS);

    // Collect template_ids for candidate lecture events
    const lectureTemplateIds = Array.from(new Set(candidates.filter(ev => (ev.type || '').toString().toLowerCase() === 'lecture' && ev.template_id).map(ev => String(ev.template_id))));
    const ongoingLectureTemplates = new Set();
    if (lectureTemplateIds.length > 0) {
      // For each template id, check if any active event with that template_id has date >= lectureCutoff
      const checks = await prisma.event.findMany({
        where: {
          archived: false,
          template_id: { in: lectureTemplateIds },
          date: { gte: lectureCutoff }
        },
        select: { template_id: true }
      });
      for (const r of checks) if (r && r.template_id) ongoingLectureTemplates.add(String(r.template_id));
    }

    // Filter out candidate lecture events that belong to ongoing templates
    const filteredCandidates = candidates.filter(ev => {
      try {
        const t = (ev.type || '').toString().toLowerCase();
        if (t === 'lecture' && ev.template_id && ongoingLectureTemplates.has(String(ev.template_id))) return false;
        return true;
      } catch (e) { return true; }
    });

    const filteredIds = filteredCandidates.map(c => c.id);

    if (dry) {
      return res.status(200).json({ preview: true, count: filteredIds.length, ids: filteredIds });
    }

    if (filteredIds.length === 0) return res.status(200).json({ preview: false, archived: 0, ids: [] });

    // Perform transactional move: create archivedEvent rows and delete originals
    const archivedIds = [];
    await prisma.$transaction(async (tx) => {
      for (const ev of filteredCandidates) {
        // If an archived copy already exists for this original_event_id, delete the active row
        const existingArchived = await tx.archivedEvent.findUnique({ where: { original_event_id: ev.id } });
        if (existingArchived) {
          try {
            await tx.event.delete({ where: { id: ev.id } });
            archivedIds.push(ev.id);
          } catch (e) {
            // ignore per-row delete failures to continue with others
            console.warn('[archive-completed] failed to delete already-archived event', ev.id, e && e.message ? e.message : e);
          }
          continue;
        }

        const data = {
          original_event_id: ev.id,
          title: ev.title || '',
          type: ev.type || 'assignment',
          course_id: ev.course_id || null,
          date: ev.date || new Date(),
          time: ev.time || null,
          description: ev.description || null,
          completed: ev.completed === true,
          user_id: ev.user_id || null,
          color: ev.color || null,
          end_date: ev.end_date || null,
          template_id: ev.template_id || null
        };

        try {
          await tx.archivedEvent.create({ data });
          await tx.event.delete({ where: { id: ev.id } });
          archivedIds.push(ev.id);
        } catch (e) {
          // If create failed due to schema differences (e.g., missing column), attempt a fallback without optional fields
          try {
            const fallback = {
              original_event_id: ev.id,
              title: ev.title || '',
              type: ev.type || 'assignment',
              course_id: ev.course_id || null,
              date: ev.date || new Date(),
              time: ev.time || null,
              description: ev.description || null,
              completed: ev.completed === true,
              user_id: ev.user_id || null
            };
            await tx.archivedEvent.create({ data: fallback });
            await tx.event.delete({ where: { id: ev.id } });
            archivedIds.push(ev.id);
          } catch (ee) {
            console.error('[archive-completed] failed to archive event', ev.id, ee && ee.message ? ee.message : ee);
            // do not throw to allow other rows to be processed
          }
        }
      }
    });

    return res.status(200).json({ preview: false, archived: archivedIds.length, ids: archivedIds });
  } catch (err) {
    console.error('[api/events/archive-completed] error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Failed to archive completed events' });
  }
}
