const fs = require('fs');
const path = require('path');

const dataFile = path.join(process.cwd(), 'data', 'attendance.json');

function ensureFile() {
  const dir = path.dirname(dataFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({ sessions: [] }, null, 2));
}

function read() {
  ensureFile();
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function write(obj) {
  fs.writeFileSync(dataFile, JSON.stringify(obj, null, 2));
}

module.exports = {
  list({ courseId, userId } = {}) {
    const obj = read();
    return obj.sessions.filter(s => s.course_id === courseId && s.user_id === userId).sort((a,b) => new Date(a.date) - new Date(b.date));
  },
  create(payload) {
    const obj = read();
    const id = String(Date.now()) + Math.floor(Math.random() * 1000);
    const now = new Date().toISOString();
    const status = payload.status?.toUpperCase() || 'PRESENT';
    const derivePoints = (st) => {
      switch ((st || '').toUpperCase()) {
        case 'PRESENT': return 2;
        case 'EXCUSED': return 1;
        case 'LATE': return 1;
        case 'ABSENT': return 0;
        case 'HOLIDAY': return null;
        default: return 0;
      }
    };
    const session = {
      id,
      date: (new Date(payload.date)).toISOString(),
      status,
      points: (payload.points !== undefined) ? payload.points : derivePoints(status),
      notes: payload.notes || null,
      user_id: payload.userId,
      course_id: payload.courseId,
      created_at: now,
      updated_at: now
    };
    obj.sessions.push(session);
    write(obj);
    return session;
  },
  find(id) {
    const obj = read();
    return obj.sessions.find(s => s.id === id);
  },
  update(id, payload) {
    const obj = read();
    const idx = obj.sessions.findIndex(s => s.id === id);
    if (idx === -1) return null;
    const existing = obj.sessions[idx];
    const status = payload.status ? payload.status.toUpperCase() : existing.status;
    const derivePoints = (st) => {
      switch ((st || '').toUpperCase()) {
        case 'PRESENT': return 2;
        case 'EXCUSED': return 1;
        case 'LATE': return 1;
        case 'ABSENT': return 0;
        case 'HOLIDAY': return null;
        default: return 0;
      }
    };
    const updated = {
      ...existing,
      date: payload.date ? (new Date(payload.date)).toISOString() : existing.date,
      status,
      points: payload.points !== undefined ? payload.points : (payload.status !== undefined ? derivePoints(status) : existing.points),
      notes: payload.notes !== undefined ? payload.notes : existing.notes,
      updated_at: new Date().toISOString()
    };
    obj.sessions[idx] = updated;
    write(obj);
    return updated;
  },
  delete(id) {
    const obj = read();
    const idx = obj.sessions.findIndex(s => s.id === id);
    if (idx === -1) return null;
    const [deleted] = obj.sessions.splice(idx, 1);
    write(obj);
    return deleted;
  }
};
