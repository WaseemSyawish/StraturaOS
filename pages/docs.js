import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { BookOpen, GraduationCap, Calendar, CheckSquare, BookMarked, ClipboardList, Home, ChevronRight, Search, BarChart3, Clock, MapPin, Award, Users } from 'lucide-react';

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    { id: 'overview', name: 'Overview', icon: BookOpen },
    { id: 'getting-started', name: 'Getting Started', icon: GraduationCap },
    { id: 'courses', name: 'Managing Courses', icon: BookMarked },
    { id: 'grades', name: 'Tracking Grades', icon: BarChart3 },
    { id: 'timetable', name: 'Creating Schedules', icon: Clock },
    { id: 'calendar', name: 'Using Calendar', icon: Calendar },
    { id: 'attendance', name: 'Attendance Tracking', icon: CheckSquare },
    { id: 'tips', name: 'Tips & Best Practices', icon: Award },
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
                        data-section={section.id}
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
                  <h3 className="font-semibold mb-2 text-sm">Need Help?</h3>
                  <div className="space-y-2">
                    <Link 
                      href="/dashboard"
                      className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors"
                    >
                      <Home className="w-4 h-4" />
                      Go to Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3">
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-8">
                {activeSection === 'overview' && <OverviewSection />}
                {activeSection === 'getting-started' && <GettingStartedSection />}
                {activeSection === 'courses' && <CoursesSection />}
                {activeSection === 'grades' && <GradesSection />}
                {activeSection === 'timetable' && <TimetableSection />}
                {activeSection === 'calendar' && <CalendarSection />}
                {activeSection === 'attendance' && <AttendanceSection />}
                {activeSection === 'tips' && <TipsSection />}
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
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Welcome to University Planner</h2>
      <p className="text-slate-600 dark:text-slate-300 text-lg mb-6">
        <strong>University Planner</strong> helps you stay organized throughout your academic journey. 
        Manage your courses, track grades, schedule events, and monitor attendance all in one place.
      </p>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">What Can You Do?</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FeatureCard 
          icon={<BookMarked className="w-6 h-6 text-purple-600 dark:text-purple-400" />} 
          title="Organize Courses" 
          description="Keep track of all your modules, credits, and instructors" 
        />
        <FeatureCard 
          icon={<BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />} 
          title="Monitor Grades" 
          description="Track your academic performance and calculate GPA automatically" 
        />
        <FeatureCard 
          icon={<Clock className="w-6 h-6 text-green-600 dark:text-green-400" />} 
          title="Smart Scheduling" 
          description="Create weekly timetables with automatic recurring events" 
        />
        <FeatureCard 
          icon={<CheckSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />} 
          title="Track Attendance" 
          description="Monitor class attendance with an easy point system" 
        />
        <FeatureCard 
          icon={<Calendar className="w-6 h-6 text-pink-600 dark:text-pink-400" />} 
          title="Unified Calendar" 
          description="View all assignments, exams, and events in one place" 
        />
        <FeatureCard 
          icon={<Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />} 
          title="Holiday Integration" 
          description="Automatic detection of holidays for Iraq and Kurdistan" 
        />
      </div>

      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-6 mt-8">
        <div className="flex items-start gap-3">
          <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">New to University Planner?</h4>
            <p className="text-blue-800 dark:text-blue-200 mb-4">
              Start by creating your account, then set up your first semester and add your courses. The guide will walk you through everything!
            </p>
            <button 
              onClick={() => document.querySelector('[data-section="getting-started"]')?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GettingStartedSection() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Getting Started</h2>
      
      <p className="text-slate-600 dark:text-slate-300 text-lg mb-8">
        Follow these simple steps to get started with University Planner and organize your academic life.
      </p>

      <div className="space-y-6">
        <Step 
          number="1" 
          title="Create Your Account"
          icon={<Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
        >
          <p className="text-slate-600 dark:text-slate-300 mb-3">
            Click the <strong>Sign Up</strong> button on the homepage and create your account with your email and password.
          </p>
          <div className="bg-blue-50 dark:bg-blue-500/10 border-l-4 border-blue-500 p-3 text-sm text-blue-800 dark:text-blue-200">
            <strong>Tip:</strong> Use a strong password to keep your academic data secure.
          </div>
        </Step>

        <Step 
          number="2" 
          title="Set Up Your First Semester"
          icon={<Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
        >
          <p className="text-slate-600 dark:text-slate-300 mb-3">
            Go to <Link href="/modules" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Modules</Link> and click <strong>"Configure Semesters"</strong> to add your current semester with start and end dates.
          </p>
        </Step>

        <Step 
          number="3" 
          title="Add Your Courses"
          icon={<BookMarked className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
        >
          <p className="text-slate-600 dark:text-slate-300 mb-3">
            Click <strong>"Add Course"</strong> to create entries for each module you're taking. Include:
          </p>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>Course name and code</li>
            <li>Credits</li>
            <li>Instructor name</li>
            <li>Pick a color for easy identification</li>
          </ul>
        </Step>

        <Step 
          number="4" 
          title="Create Your Timetable"
          icon={<Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
        >
          <p className="text-slate-600 dark:text-slate-300 mb-3">
            Visit <Link href="/timetable-setup" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Smart Schedule Creator</Link> and use the wizard to generate your weekly class schedule. 
            The system will automatically create recurring events for each class.
          </p>
        </Step>

        <Step 
          number="5" 
          title="Set Up Grade Tracking"
          icon={<BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
        >
          <p className="text-slate-600 dark:text-slate-300 mb-3">
            Head to <Link href="/grades" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Grades</Link> and add grading categories 
            (like Assignments, Midterm, Final) for each course to start tracking your performance.
          </p>
        </Step>

        <Step 
          number="6" 
          title="Start Using the Platform"
          icon={<Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
        >
          <p className="text-slate-600 dark:text-slate-300">
            You're all set! Check your <Link href="/dashboard" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Dashboard</Link> for 
            an overview, use the <Link href="/calendar" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Calendar</Link> to track deadlines, 
            and log <Link href="/attendance" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Attendance</Link> for your classes.
          </p>
        </Step>
      </div>

      <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg p-6 mt-8">
        <div className="flex items-start gap-3">
          <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">Quick Start Checklist</h4>
            <ul className="text-green-800 dark:text-green-200 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span>✓</span> Create account and sign in
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span> Configure your semester dates
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span> Add all your courses
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span> Generate weekly timetable
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span> Set up grading categories
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span> Explore the dashboard
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoursesSection() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Managing Courses</h2>
      
      <p className="text-slate-600 dark:text-slate-300 text-lg mb-8">
        Learn how to organize your academic courses and semesters effectively.
      </p>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Adding a Course</h3>
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <ol className="space-y-3 text-slate-600 dark:text-slate-300">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
            <span>Navigate to the <Link href="/modules" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Modules</Link> page</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
            <span>Click the <strong>"Add Course"</strong> button</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
            <span>Fill in course details (name, code, credits, instructor)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
            <span>Pick a color to identify the course visually</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-sm font-semibold">5</span>
            <span>Assign to a semester (optional)</span>
          </li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Managing Semesters</h3>
      <p className="text-slate-600 dark:text-slate-300 mb-4">
        Semesters help you organize courses by academic term. Click <strong>"Configure Semesters"</strong> to:
      </p>
      <ul className="space-y-2 text-slate-600 dark:text-slate-300 list-disc list-inside mb-6">
        <li>Add new semesters with start and end dates</li>
        <li>Mark a semester as active (shows first in lists)</li>
        <li>Edit or archive old semesters</li>
      </ul>

      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-1">Pro Tip</h4>
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              Use color coding consistently - for example, use blue for all computer science courses, green for math, etc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GradesSection() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Tracking Grades</h2>
      
      <p className="text-slate-600 dark:text-slate-300 text-lg mb-8">
        Monitor your academic performance with detailed grade tracking and automatic GPA calculation.
      </p>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Setting Up Grading Categories</h3>
      <p className="text-slate-600 dark:text-slate-300 mb-4">
        For each course, you can create grading categories (Assignments, Quizzes, Midterm, Final, etc.):
      </p>
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <ol className="space-y-3 text-slate-600 dark:text-slate-300">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
            <span>Go to <Link href="/grades" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Grades</Link></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
            <span>Select a course</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
            <span>Click <strong>"Add Category"</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
            <span>Enter category name and weight (percentage of final grade)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">5</span>
            <span>Add individual items (assignments, quizzes) with scores</span>
          </li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Understanding Your GPA</h3>
      <p className="text-slate-600 dark:text-slate-300 mb-4">
        The system automatically calculates your:
      </p>
      <ul className="space-y-2 text-slate-600 dark:text-slate-300 list-disc list-inside">
        <li><strong>Course Grade:</strong> Weighted average of all categories</li>
        <li><strong>Semester GPA:</strong> Average of all courses in active semester</li>
        <li><strong>Overall GPA:</strong> Cumulative GPA across all semesters</li>
      </ul>

      <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg p-6 mt-6">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Grading Scale</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-green-800 dark:text-green-200">
              <div>A: 90-100%</div>
              <div>B: 80-89%</div>
              <div>C: 70-79%</div>
              <div>D: 60-69%</div>
              <div>F: Below 60%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimetableSection() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Creating Schedules</h2>
      
      <p className="text-slate-600 dark:text-slate-300 text-lg mb-8">
        Use the Smart Schedule Creator to generate your weekly class timetable automatically.
      </p>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Using the Smart Schedule Creator</h3>
      <p className="text-slate-600 dark:text-slate-300 mb-4">
        The wizard makes it easy to create recurring weekly events:
      </p>
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <ol className="space-y-3 text-slate-600 dark:text-slate-300">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
            <span>Visit <Link href="/timetable-setup" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Smart Schedule Creator</Link></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
            <span>Select a course from your list</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
            <span>Choose the day(s) of the week the class meets</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
            <span>Set start and end times</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">5</span>
            <span>Add location (classroom, building)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">6</span>
            <span>Click <strong>"Generate Schedule"</strong> - done!</span>
          </li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Viewing Your Timetable</h3>
      <p className="text-slate-600 dark:text-slate-300 mb-4">
        Check your weekly schedule at <Link href="/timetable" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Timetable</Link>. You can:
      </p>
      <ul className="space-y-2 text-slate-600 dark:text-slate-300 list-disc list-inside">
        <li>View by day or week</li>
        <li>See location for each class</li>
        <li>Edit individual events if needed</li>
        <li>Delete entire event series</li>
      </ul>

      <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-1">Smart Features</h4>
            <p className="text-purple-800 dark:text-purple-200 text-sm">
              The system automatically creates events for the entire semester and respects holidays. No manual copying needed!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarSection() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Using the Calendar</h2>
      
      <p className="text-slate-600 dark:text-slate-300 text-lg mb-8">
        Your unified view of all assignments, exams, course schedules, and holidays.
      </p>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Adding Events</h3>
      <p className="text-slate-600 dark:text-slate-300 mb-4">
        Create custom events for assignments, exams, or personal reminders:
      </p>
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <ol className="space-y-3 text-slate-600 dark:text-slate-300">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
            <span>Click on any date in the <Link href="/calendar" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Calendar</Link></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
            <span>Choose event type (Assignment, Exam, Meeting, etc.)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
            <span>Enter title and details</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
            <span>Link to a course (optional)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center text-sm font-semibold">5</span>
            <span>Set time and location</span>
          </li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Event Types</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">📝 Assignment</h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">Homework, projects, papers</p>
        </div>
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">📊 Exam</h4>
          <p className="text-sm text-red-800 dark:text-red-200">Midterms, finals, quizzes</p>
        </div>
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">👥 Meeting</h4>
          <p className="text-sm text-green-800 dark:text-green-200">Office hours, group meetings</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">⭐ Other</h4>
          <p className="text-sm text-purple-800 dark:text-purple-200">Personal reminders, deadlines</p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-1">Holiday Integration</h4>
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              National and regional holidays for Iraq and Kurdistan are automatically displayed in your calendar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendanceSection() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Attendance Tracking</h2>
      
      <p className="text-slate-600 dark:text-slate-300 text-lg mb-8">
        Keep track of your class attendance with an easy point-based system.
      </p>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Logging Attendance</h3>
      <p className="text-slate-600 dark:text-slate-300 mb-4">
        After each class:
      </p>
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <ol className="space-y-3 text-slate-600 dark:text-slate-300">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
            <span>Go to <Link href="/attendance" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Attendance</Link></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
            <span>Select the course</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
            <span>Mark your status: Present, Absent, or Late</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
            <span>Add notes if needed (optional)</span>
          </li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Point System</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">+1</div>
          <div className="text-sm font-semibold text-green-900 dark:text-green-300">Present</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">+0.5</div>
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-300">Late</div>
        </div>
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">0</div>
          <div className="text-sm font-semibold text-red-900 dark:text-red-300">Absent</div>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-8 mb-4">Viewing Statistics</h3>
      <p className="text-slate-600 dark:text-slate-300 mb-4">
        The attendance page shows:
      </p>
      <ul className="space-y-2 text-slate-600 dark:text-slate-300 list-disc list-inside">
        <li>Total points earned per course</li>
        <li>Attendance percentage</li>
        <li>Number of absences</li>
        <li>Visual progress indicators</li>
      </ul>

      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-3">
          <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Stay on Track</h4>
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              Most universities require at least 75% attendance. Use this feature to ensure you meet requirements!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TipsSection() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Tips & Best Practices</h2>
      
      <p className="text-slate-600 dark:text-slate-300 text-lg mb-8">
        Get the most out of University Planner with these helpful tips.
      </p>

      <div className="space-y-6">
        <TipCard
          icon={<BookMarked className="w-6 h-6" />}
          title="Start of Semester"
          color="purple"
          tips={[
            'Set up your semester dates first',
            'Add all courses immediately',
            'Generate your timetable early',
            'Set up grading categories while fresh',
          ]}
        />

        <TipCard
          icon={<Calendar className="w-6 h-6" />}
          title="Stay Organized"
          color="blue"
          tips={[
            'Add assignments to calendar as soon as announced',
            'Check dashboard daily for upcoming deadlines',
            'Use consistent color coding for courses',
            'Review your timetable weekly',
          ]}
        />

        <TipCard
          icon={<BarChart3 className="w-6 h-6" />}
          title="Grade Management"
          color="green"
          tips={[
            'Update grades immediately after receiving them',
            'Set realistic grade goals for each course',
            'Check GPA regularly to stay on track',
            'Use grade weights from your syllabus',
          ]}
        />

        <TipCard
          icon={<CheckSquare className="w-6 h-6" />}
          title="Attendance Tips"
          color="orange"
          tips={[
            'Log attendance right after class',
            'Aim for 100% attendance when possible',
            'Monitor courses with low attendance early',
            'Add notes for excused absences',
          ]}
        />

        <TipCard
          icon={<Award className="w-6 h-6" />}
          title="Success Strategies"
          color="amber"
          tips={[
            'Use dark mode for late-night study sessions',
            'Export important deadlines to external calendar',
            'Archive old semesters to keep data clean',
            'Back up important grade data regularly',
          ]}
        />
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-500/10 dark:to-blue-500/10 border border-purple-200 dark:border-purple-500/30 rounded-xl p-6 mt-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-2">Need More Help?</h3>
            <p className="text-purple-800 dark:text-purple-200 mb-4">
              If you're experiencing issues or have questions, explore the other sections in this documentation or check your dashboard for quick tips.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
      <div className="mb-3">{icon}</div>
      <h4 className="font-semibold text-slate-800 dark:text-white mb-1">{title}</h4>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}

function Step({ number, title, icon, children }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          {icon && <div className="text-purple-600 dark:text-purple-400">{icon}</div>}
          <h4 className="font-semibold text-slate-800 dark:text-white">{title}</h4>
        </div>
        {children}
      </div>
    </div>
  );
}

function TipCard({ icon, title, color, tips }) {
  const colorClasses = {
    purple: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400',
    blue: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400',
  };

  const textColorClasses = {
    purple: 'text-purple-900 dark:text-purple-300',
    blue: 'text-blue-900 dark:text-blue-300',
    green: 'text-green-900 dark:text-green-300',
    orange: 'text-orange-900 dark:text-orange-300',
    amber: 'text-amber-900 dark:text-amber-300',
  };

  const listColorClasses = {
    purple: 'text-purple-800 dark:text-purple-200',
    blue: 'text-blue-800 dark:text-blue-200',
    green: 'text-green-800 dark:text-green-200',
    orange: 'text-orange-800 dark:text-orange-200',
    amber: 'text-amber-800 dark:text-amber-200',
  };

  return (
    <div className={`border rounded-lg p-5 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={colorClasses[color].split(' ').slice(-1)[0]}>
          {icon}
        </div>
        <h3 className={`text-lg font-semibold ${textColorClasses[color]}`}>{title}</h3>
      </div>
      <ul className={`space-y-2 text-sm ${listColorClasses[color]}`}>
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="mt-1">✓</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
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
