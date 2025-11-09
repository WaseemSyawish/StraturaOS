const sqlite3 = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../prisma/dev.db');

try {
  const db = sqlite3(dbPath, { readonly: true });
  
  console.log('📊 SQLite Database Contents:\n');
  
  // Check Users
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`👤 Users: ${users.count}`);
  
  // Check Courses
  const courses = db.prepare('SELECT COUNT(*) as count FROM courses').get();
  console.log(`📚 Courses: ${courses.count}`);
  
  // Check Events
  const events = db.prepare('SELECT COUNT(*) as count FROM events').get();
  console.log(`📅 Events: ${events.count}`);
  
  // Check Attendance
  const attendance = db.prepare('SELECT COUNT(*) as count FROM attendance_sessions').get();
  console.log(`✅ Attendance Sessions: ${attendance.count}`);
  
  // Check Assessments (might not exist)
  try {
    const assessments = db.prepare('SELECT COUNT(*) as count FROM assessments').get();
    console.log(`📝 Assessments: ${assessments.count}`);
  } catch (e) {
    console.log(`📝 Assessments: 0 (table doesn't exist)`);
  }
  
  console.log('\n');
  
  // Show some sample data
  if (courses.count > 0) {
    console.log('Sample Courses:');
    const sampleCourses = db.prepare('SELECT name, code, semester FROM courses LIMIT 5').all();
    sampleCourses.forEach(c => console.log(`  - ${c.name} (${c.code}) - ${c.semester}`));
    console.log('');
  }
  
  if (events.count > 0) {
    console.log('Sample Events:');
    const sampleEvents = db.prepare('SELECT title, type, date FROM events LIMIT 5').all();
    sampleEvents.forEach(e => console.log(`  - ${e.title} (${e.type}) - ${e.date}`));
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Error reading SQLite database:', error.message);
  process.exit(1);
}
