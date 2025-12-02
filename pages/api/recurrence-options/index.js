import fs from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

export default function handler(req, res) {
  try {
    const file = path.join(process.cwd(), 'data', 'recurrence-options.json');
    if (!fs.existsSync(file)) return res.status(404).json({ success: false, error: 'Options file not found' });
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    return res.status(200).json({ success: true, options: parsed });
  } catch (err) {
    if (isDev) console.error('GET /api/recurrence-options error', err);
    return res.status(500).json({ success: false, error: 'Failed to load recurrence options' });
  }
}
