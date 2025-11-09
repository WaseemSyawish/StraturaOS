const fs = require('fs');
const path = require('path');

const filesToFix = [
  'pages/api/auth/me.js',
  'pages/api/auth/register.js',
  'pages/api/auth/local-signin.js',
  'pages/api/auth/[...nextauth].js',
  'pages/api/events/index.js',
  'pages/api/events/[id].js',
  'pages/api/events/[id]/toggle.js',
  'pages/api/events/archive-completed.js',
  'pages/api/event-templates/[id]/materialize.js',
  'pages/api/timetables/index.js',
  'pages/api/timetable/bulk-create.js',
  'pages/api/grades.js',
  'pages/api/attendance.js',
  'pages/api/users/settings.js',
  'pages/api/users/change-password.js',
  'pages/api/legacy/events.js',
  'pages/api/debug/events-enddates.js'
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Replace require statements with import
  if (content.includes("const prisma = require(")) {
    content = content.replace(/const prisma = require\('(.+?)'\);?/g, "import prisma from '$1';");
    changed = true;
  }
  
  if (content.includes("const { resolveUser } = require(")) {
    content = content.replace(/const { resolveUser } = require\('(.+?)'\);?/g, "import { resolveUser } from '$1';");
    changed = true;
  }
  
  if (content.includes("const bcrypt = require(")) {
    content = content.replace(/const bcrypt = require\('bcryptjs'\);?/g, "import bcrypt from 'bcryptjs';");
    changed = true;
  }
  
  if (content.includes("const jwt = require(")) {
    content = content.replace(/const jwt = require\('jsonwebtoken'\);?/g, "import jwt from 'jsonwebtoken';");
    changed = true;
  }
  
  // These Node.js built-ins need to stay as require
  // fs, path, etc. are fine with require in Next.js API routes
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`⏭️  No changes needed: ${file}`);
  }
});

console.log('\n✅ Done!');
