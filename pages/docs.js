import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { BookOpen, Code, Database, Rocket, Settings, AlertCircle, Home, ChevronRight, Search, Download } from 'lucide-react';

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    { id: 'overview', name: 'Overview', icon: BookOpen },
    { id: 'getting-started', name: 'Getting Started', icon: Rocket },
    { id: 'features', name: 'Core Features', icon: Settings },
    { id: 'architecture', name: 'Architecture', icon: Code },
    { id: 'database', name: 'Database Schema', icon: Database },
    { id: 'api', name: 'API Reference', icon: Code },
    { id: 'deployment', name: 'Deployment', icon: Rocket },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: AlertCircle },
  ];

  return (
    <>
      <Head>
        <title>Documentation — University Planner</title>
        <meta name="description" content="Complete documentation for University Planner - Academic management system" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Header */}
        <header className="border-b border-purple-100/50 bg-gradient-to-b from-white to-purple-50/30 sticky top-0 z-40 backdrop-blur-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/80">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center shadow-sm dark:from-purple-500/20 dark:to-purple-600/20">
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Documentation</h1>
            </div>
            <Link 
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 font-medium text-sm"
            >
              <Home className="w-4 h-4" />
              Back to App
            </Link>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search docs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Navigation */}
                <nav className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 ${
                          activeSection === section.id
                            ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{section.name}</span>
                        {activeSection === section.id && (
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* Quick Links */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                  <h3 className="font-semibold mb-2 text-sm">Quick Actions</h3>
                  <div className="space-y-2">
                    <a 
                      href="https://github.com/WaseemSyawish/university-planner" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors"
                    >
                      <Code className="w-4 h-4" />
                      View on GitHub
                    </a>
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = '/DOCUMENTATION.md';
                        link.download = 'University-Planner-Docs.md';
                        link.click();
                      }}
                      className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors w-full"
                    >
                      <Download className="w-4 h-4" />
                      Download Docs
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3">
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-8">
                {activeSection === 'overview' && <OverviewSection />}
                {activeSection === 'getting-started' && <GettingStartedSection />}
                {activeSection === 'features' && <FeaturesSection />}
                {activeSection === 'architecture' && <ArchitectureSection />}
                {activeSection === 'database' && <DatabaseSection />}
                {activeSection === 'api' && <APISection />}
                {activeSection === 'deployment' && <DeploymentSection />}
                {activeSection === 'troubleshooting' && <TroubleshootingSection />}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

function OverviewSection() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Overview</h2>
      <p className="text-slate-600 dark:text-slate-300 text-lg mb-6">
        <strong>University Planner</strong> is a comprehensive academic management system designed specifically for university students. 
        It provides an all-in-one platform to manage courses, track grades, schedule events, monitor attendance, and organize academic life efficiently.
      </p>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Key Capabilities</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FeatureCard icon="📚" title="Course Management" description="Organize modules with credits, instructors, and semesters" />
        <FeatureCard icon="📊" title="Grade Tracking" description="Monitor academic performance with detailed grading categories" />
        <FeatureCard icon="📅" title="Smart Scheduling" description="Automated timetable generation with recurring events" />
        <FeatureCard icon="✅" title="Attendance Monitoring" description="Track class attendance with point systems" />
        <FeatureCard icon="📆" title="Calendar Integration" description="Unified view of assignments, exams, and events" />
        <FeatureCard icon="🌙" title="Dark Mode" description="Full theme support with automatic system detection" />
        <FeatureCard icon="🔐" title="Secure Authentication" description="User accounts with NextAuth.js" />
        <FeatureCard icon="🌍" title="Holiday Integration" description="Automatic holiday detection for Iraq and Kurdistan regions" />
      </div>

      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-6 mt-8">
        <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">Getting Started</h4>
        <p className="text-blue-800 dark:text-blue-200 mb-4">
          Ready to set up University Planner? Check out our comprehensive getting started guide.
        </p>
        <Link 
          href="/docs#getting-started"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
        >
          Get Started
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function GettingStartedSection() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Getting Started</h2>
      
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">Prerequisites</h4>
        <ul className="text-amber-800 dark:text-amber-200 text-sm space-y-1 mb-0">
          <li>Node.js 18.x or higher</li>
          <li>PostgreSQL database</li>
          <li>npm or yarn package manager</li>
        </ul>
      </div>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Installation Steps</h3>
      
      <div className="space-y-6">
        <Step number="1" title="Clone the repository">
          <CodeBlock language="bash">
            {`git clone https://github.com/WaseemSyawish/university-planner.git
cd university-planner`}
          </CodeBlock>
        </Step>

        <Step number="2" title="Install dependencies">
          <CodeBlock language="bash">npm install</CodeBlock>
        </Step>

        <Step number="3" title="Configure environment variables">
          <p className="text-slate-600 dark:text-slate-300 mb-3">Create a <code className="text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">.env</code> file in the root directory:</p>
          <CodeBlock language="env">
{`# Database
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:port/database?sslmode=require"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Email (for password reset)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourdomain.com"`}
          </CodeBlock>
        </Step>

        <Step number="4" title="Set up the database">
          <CodeBlock language="bash">
{`# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy`}
          </CodeBlock>
        </Step>

        <Step number="5" title="Start the development server">
          <CodeBlock language="bash">npm run dev</CodeBlock>
        </Step>

        <Step number="6" title="Access the application">
          <p className="text-slate-600 dark:text-slate-300">
            Open <a href="http://localhost:3000" className="text-purple-600 dark:text-purple-400 hover:underline">http://localhost:3000</a> in your browser.
          </p>
        </Step>
      </div>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: 'Course Management',
      location: '/modules',
      description: 'Comprehensive course organization with metadata, semester assignment, and color-coded visual organization.',
      operations: ['Add new courses', 'Edit course details', 'Assign courses to semesters', 'Archive completed courses', 'Configure semester settings']
    },
    {
      title: 'Grade Tracking',
      location: '/grades',
      description: 'Detailed academic performance monitoring with grading categories, automatic GPA calculation, and statistics dashboard.',
      operations: ['Add grading categories', 'Track individual assignments', 'View real-time GPA', 'Monitor semester performance', 'Export grade reports']
    },
    {
      title: 'Smart Timetable',
      location: '/timetable',
      description: 'Automated weekly schedule generation with recurring events, conflict detection, and multiple view modes.',
      operations: ['Create schedules with wizard', 'Manage recurring events', 'Track locations', 'Edit event series', 'Export to calendar']
    },
    {
      title: 'Calendar & Events',
      location: '/calendar',
      description: 'Unified calendar view combining assignments, exams, course schedules, and regional holidays.',
      operations: ['Create custom events', 'Track deadlines', 'View holidays', 'Mark as complete', 'Archive old events']
    },
    {
      title: 'Attendance Tracking',
      location: '/attendance',
      description: 'Comprehensive attendance monitoring with point system, statistics, and visual progress indicators.',
      operations: ['Log attendance', 'Track points', 'View statistics', 'Generate reports', 'Bulk operations']
    }
  ];

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Core Features</h2>
      
      <div className="space-y-8">
        {features.map((feature, index) => (
          <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white">{feature.title}</h3>
              <Link 
                href={feature.location}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                View
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-4">{feature.description}</p>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Key Operations:</h4>
              <ul className="space-y-1">
                {feature.operations.map((op, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                    <span>{op}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchitectureSection() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">System Architecture</h2>
      
      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Technology Stack</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <TechCard title="Frontend" items={['Next.js 14.2.18', 'React 18.3.1', 'Tailwind CSS', 'Lucide Icons', 'mina-scheduler']} />
        <TechCard title="Backend" items={['Next.js API Routes', 'PostgreSQL', 'Prisma ORM', 'NextAuth.js', 'bcryptjs']} />
        <TechCard title="Infrastructure" items={['Vercel', 'Railway/Neon', 'Resend Email', 'Git/GitHub']} />
      </div>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Application Structure</h3>
      <CodeBlock language="text">
{`university-planner/
├── pages/              # Next.js pages and API routes
│   ├── api/            # Backend API endpoints
│   ├── dashboard.js    # Main dashboard
│   ├── calendar.js     # Calendar view
│   ├── timetable.js    # Weekly timetable
│   ├── modules.js      # Course manager
│   ├── grades.js       # Grade tracking
│   └── attendance.js   # Attendance tracker
├── src/
│   ├── components/     # React components
│   ├── providers/      # Context providers
│   └── utils/          # Utility functions
├── prisma/
│   └── schema.prisma   # Database schema
└── public/             # Static assets`}
      </CodeBlock>
    </div>
  );
}

function DatabaseSection() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Database Schema</h2>
      
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        University Planner uses PostgreSQL with Prisma ORM for type-safe database access.
      </p>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Core Tables</h3>
      
      <div className="space-y-6">
        <TableInfo 
          name="users" 
          description="User authentication and profile data"
          columns={['id (UUID)', 'email (VARCHAR)', 'password_hash (VARCHAR)', 'name (VARCHAR)', 'settings (JSON)', 'created_at', 'updated_at']}
        />
        <TableInfo 
          name="courses" 
          description="Academic course information"
          columns={['id (UUID)', 'name (VARCHAR)', 'code (VARCHAR)', 'credits (INT)', 'color (VARCHAR)', 'semester (VARCHAR)', 'instructor (VARCHAR)', 'user_id (UUID FK)', 'created_at', 'updated_at']}
        />
        <TableInfo 
          name="assessments" 
          description="Grading categories and items"
          columns={['id (UUID)', 'name (VARCHAR)', 'type (VARCHAR)', 'weight (FLOAT)', 'items (JSON)', 'course_id (UUID FK)', 'user_id (UUID)', 'created_at', 'updated_at']}
        />
        <TableInfo 
          name="events" 
          description="Calendar events and assignments"
          columns={['id (UUID)', 'title (VARCHAR)', 'type (VARCHAR)', 'date (TIMESTAMP)', 'time (VARCHAR)', 'location (VARCHAR)', 'course_id (UUID FK)', 'completed (BOOLEAN)', 'user_id (UUID FK)', 'created_at', 'updated_at']}
        />
        <TableInfo 
          name="semester_settings" 
          description="Academic semester configurations"
          columns={['id (UUID)', 'name (VARCHAR)', 'start_date (TIMESTAMP)', 'end_date (TIMESTAMP)', 'is_active (BOOLEAN)', 'user_id (UUID FK)', 'created_at', 'updated_at']}
        />
        <TableInfo 
          name="attendance_sessions" 
          description="Class attendance records"
          columns={['id (UUID)', 'date (TIMESTAMP)', 'status (ENUM)', 'points (INT)', 'notes (TEXT)', 'user_id (UUID FK)', 'course_id (UUID FK)', 'created_at', 'updated_at']}
        />
      </div>
    </div>
  );
}

function APISection() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">API Reference</h2>
      
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        All API endpoints follow RESTful conventions and require authentication.
      </p>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Authentication</h3>
      <div className="space-y-4">
        <APIEndpoint method="POST" path="/api/auth/signup" description="Create new user account" />
        <APIEndpoint method="POST" path="/api/auth/signin" description="Authenticate user" />
        <APIEndpoint method="GET" path="/api/auth/me" description="Get current user" />
      </div>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Courses</h3>
      <div className="space-y-4">
        <APIEndpoint method="GET" path="/api/courses" description="Get all courses" />
        <APIEndpoint method="POST" path="/api/courses" description="Create new course" />
        <APIEndpoint method="PUT" path="/api/courses/:id" description="Update course" />
        <APIEndpoint method="DELETE" path="/api/courses/:id" description="Delete course" />
      </div>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Events</h3>
      <div className="space-y-4">
        <APIEndpoint method="GET" path="/api/events" description="Get all events (with date filters)" />
        <APIEndpoint method="POST" path="/api/events" description="Create new event" />
        <APIEndpoint method="PUT" path="/api/events/:id" description="Update event" />
        <APIEndpoint method="DELETE" path="/api/events/:id" description="Delete event (supports bulk delete)" />
      </div>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Grades</h3>
      <div className="space-y-4">
        <APIEndpoint method="GET" path="/api/grades" description="Get grades for all courses" />
        <APIEndpoint method="PUT" path="/api/grades" description="Update grades/assessments" />
      </div>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Attendance</h3>
      <div className="space-y-4">
        <APIEndpoint method="GET" path="/api/attendance" description="Get attendance records" />
        <APIEndpoint method="POST" path="/api/attendance" description="Log attendance session" />
      </div>
    </div>
  );
}

function DeploymentSection() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Deployment Guide</h2>
      
      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Vercel Deployment (Recommended)</h3>
      
      <div className="space-y-6">
        <Step number="1" title="Prepare repository">
          <CodeBlock language="bash">
{`git add .
git commit -m "Ready for deployment"
git push origin main`}
          </CodeBlock>
        </Step>

        <Step number="2" title="Connect to Vercel">
          <ul className="text-slate-600 dark:text-slate-300 space-y-2">
            <li>Go to <a href="https://vercel.com" className="text-purple-600 dark:text-purple-400 hover:underline">vercel.com</a></li>
            <li>Import your GitHub repository</li>
            <li>Select the university-planner project</li>
          </ul>
        </Step>

        <Step number="3" title="Configure environment variables">
          <p className="text-slate-600 dark:text-slate-300 mb-3">Add these variables in Vercel dashboard:</p>
          <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
            <li><code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">DATABASE_URL</code></li>
            <li><code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">DIRECT_URL</code></li>
            <li><code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">NEXTAUTH_SECRET</code></li>
            <li><code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">NEXTAUTH_URL</code> (production URL)</li>
            <li><code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">RESEND_API_KEY</code></li>
            <li><code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">FROM_EMAIL</code></li>
          </ul>
        </Step>

        <Step number="4" title="Deploy">
          <p className="text-slate-600 dark:text-slate-300">
            Vercel will automatically deploy on push to main branch.
          </p>
        </Step>

        <Step number="5" title="Run database migrations">
          <CodeBlock language="bash">npx prisma migrate deploy</CodeBlock>
        </Step>
      </div>

      <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg p-6 mt-8">
        <h4 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">Post-Deployment Checklist</h4>
        <ul className="text-green-800 dark:text-green-200 space-y-2">
          <li>✓ Verify database connection</li>
          <li>✓ Test user authentication</li>
          <li>✓ Check API endpoints</li>
          <li>✓ Validate theme switching</li>
          <li>✓ Test core features</li>
          <li>✓ Monitor error logs</li>
        </ul>
      </div>
    </div>
  );
}

function TroubleshootingSection() {
  const issues = [
    {
      title: 'Database Connection Failed',
      problem: 'Cannot connect to PostgreSQL database',
      solutions: [
        'Verify DATABASE_URL is correct',
        'Check database is running and accessible',
        'Verify SSL mode (?sslmode=require)',
        'Test connection with npx prisma db push'
      ]
    },
    {
      title: 'Authentication Not Working',
      problem: 'Cannot sign in or session expires immediately',
      solutions: [
        'Verify NEXTAUTH_SECRET is set',
        'Check NEXTAUTH_URL matches your domain',
        'Clear browser cookies',
        'Verify password hashing works'
      ]
    },
    {
      title: 'Grades Not Saving',
      problem: 'Grading categories disappear on refresh',
      solutions: [
        'Verify assessments table exists',
        'Run migrations: npx prisma migrate deploy',
        'Check API logs for errors',
        'Verify course_id is valid UUID'
      ]
    },
    {
      title: 'Events Not Appearing',
      problem: 'Created events don\'t show in calendar',
      solutions: [
        'Check date format (ISO 8601)',
        'Verify user_id matches authenticated user',
        'Clear browser cache',
        'Check API response for errors'
      ]
    }
  ];

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Troubleshooting</h2>
      
      <div className="space-y-6">
        {issues.map((issue, index) => (
          <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">{issue.title}</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
              <strong>Problem:</strong> {issue.problem}
            </p>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Solutions:</h4>
              <ul className="space-y-2">
                {issue.solutions.map((solution, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                    <span>{solution}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-6 mt-8">
        <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">Debug Mode</h4>
        <p className="text-blue-800 dark:text-blue-200 mb-3">
          Enable debug logging by adding to your .env file:
        </p>
        <CodeBlock language="env">
{`DEBUG=true
NODE_ENV=development`}
        </CodeBlock>
      </div>
    </div>
  );
}

// Helper Components
function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="font-semibold text-slate-800 dark:text-white mb-1">{title}</h4>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}

function Step({ number, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-slate-800 dark:text-white mb-2">{title}</h4>
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ children, language = 'text' }) {
  return (
    <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
      <pre className="text-sm text-slate-100 font-mono">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function TechCard({ title, items }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
      <h4 className="font-semibold text-slate-800 dark:text-white mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TableInfo({ name, description, columns }) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
      <h4 className="font-mono font-semibold text-purple-600 dark:text-purple-400 mb-2">{name}</h4>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{description}</p>
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded p-3">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Columns:</p>
        <div className="flex flex-wrap gap-2">
          {columns.map((col, i) => (
            <span key={i} className="text-xs bg-white dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 font-mono text-slate-700 dark:text-slate-300">
              {col}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function APIEndpoint({ method, path, description }) {
  const methodColors = {
    GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    POST: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <span className={`px-2 py-1 rounded text-xs font-mono font-semibold ${methodColors[method]}`}>
        {method}
      </span>
      <div className="flex-1">
        <code className="text-sm font-mono text-slate-800 dark:text-slate-200">{path}</code>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{description}</p>
      </div>
    </div>
  );
}
