# StraturaOS

A comprehensive academic planning and productivity platform built for students. StraturaOS helps you stay organized throughout your academic journey with smart timetables, task management, focus sessions, and grade tracking.

## Features

- 📅 **Smart Timetable** - Intelligent class scheduling with recurrence patterns
- ✅ **Task Management** - Inbox workflow with subtasks, priorities, and due dates  
- 🎯 **Focus Sessions** - Pomodoro timer with task integration and analytics
- 📊 **Grade Calculator** - Track grades and predict final scores
- 📋 **Attendance Tracking** - Monitor your class attendance
- 🌙 **Dark Mode** - Beautiful UI in light and dark themes
- 🔐 **Secure Authentication** - Rate-limited, validated, and secure

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: NextAuth.js + Custom JWT
- **Deployment**: Vercel

## Getting Started

```bash
# Clone the repository
git clone https://github.com/WaseemSyawish/straturaos.git
cd straturaos

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Environment Variables

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="StraturaOS <noreply@yourdomain.com>"
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code

## License

Private - All rights reserved.

---

Built with ❤️ by Waseem Syawish
