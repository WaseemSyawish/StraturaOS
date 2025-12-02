import prisma from '../../../../lib/prisma';

const isDev = process.env.NODE_ENV === 'development';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const updated = await prisma.event.update({ where: { id }, data: { completed: !event.completed } });
    // Normalize response so clients see consistent local dates
    const normalize = (ev) => {
      try {
        const dt = (ev && ev.date) ? new Date(String(ev.date)) : null;
        const dateStr = dt && !isNaN(dt.getTime()) ? `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}` : ev.date;
        const out = { ...ev, date: dateStr };
        if (!out.startDate && out.date) {
          const parts = String(out.date).split('-').map(Number);
          out.startDate = new Date(parts[0], (parts[1]||1)-1, parts[2]||1, 12, 0, 0).toISOString();
        }
        if (out.end_date && !out.endDate) {
          const ed = new Date(String(out.end_date)); if (!isNaN(ed.getTime())) out.endDate = ed.toISOString();
        }
        return out;
      } catch (e) { return ev; }
    };
    return res.status(200).json({ success: true, event: normalize(updated) });
  } catch (err) {
    if (isDev) console.error(err);
    return res.status(500).json({ error: 'Failed to toggle event' });
  }
}
