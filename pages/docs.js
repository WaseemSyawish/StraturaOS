import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { BookOpen, Rocket, Calendar, CheckSquare, BookMarked, Home, ChevronRight, Search, BarChart3, Clock, Award, Users, Menu, X } from 'lucide-react';

// StraturaOS Logo SVG Component - Black and White for docs
const StraturaLogo = ({ size = 32, color = "white" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <g transform="translate(0,64) scale(0.1,-0.1)" fill={color}>
      <path d="M169 567 c-75 -40 -144 -78 -153 -86 -13 -11 -16 -36 -16 -160 0 -80 4 -151 8 -157 4 -6 76 -46 160 -89 l154 -79 145 74 c80 41 152 80 159 88 20 20 20 305 0 324 -19 19 -291 158 -307 157 -8 0 -75 -33 -150 -72z m271 -74 l110 -58 0 -67 c0 -40 -4 -68 -10 -68 -6 0 -56 23 -112 51 l-102 51 28 23 28 22 -31 12 c-27 12 -36 10 -100 -25 -39 -21 -71 -41 -71 -44 0 -3 81 -45 180 -92 99 -48 180 -91 179 -95 0 -4 -49 -32 -108 -62 l-108 -53 -114 58 c-107 55 -114 61 -117 92 -2 18 1 32 8 32 5 0 56 -23 112 -51 l102 -51 35 17 36 17 -148 74 -148 75 3 42 3 42 110 57 c61 32 113 57 117 58 5 0 57 -26 118 -57z"/>
    </g>
  </svg>
);

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = [
    { id: 'overview', name: 'Overview', icon: BookOpen },
    { id: 'getting-started', name: 'Getting Started', icon: Rocket },
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
        <title>Documentation - StraturaOS</title>
        <meta name="description" content="Complete documentation for StraturaOS - Academic management system" />
      </Head>
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      `}</style>
      
      <div className="min-h-screen bg-[#0a0a0f] relative" style={{
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl" />
        </div>
        
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo and Brand */}
              <Link href="/landing" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg shadow-purple-500/20 transition-transform group-hover:scale-105">
                  <StraturaLogo size={24} color="white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-lg">StraturaOS</span>
                  <span className="text-gray-500 text-sm font-medium">Docs</span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/landing" className="text-gray-400 hover:text-white font-medium text-sm transition-colors">
                  Home
                </Link>
                <Link href="/signin" className="text-gray-400 hover:text-white font-medium text-sm transition-colors">
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-all bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20"
                >
                  Get Started
                </Link>
              </nav>

              {/* Mobile menu button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-[#12121a] border-t border-white/5 py-4 px-4 space-y-3">
              <Link href="/landing" className="block text-gray-400 hover:text-white font-medium py-2">
                Home
              </Link>
              <Link href="/signin" className="block text-gray-400 hover:text-white font-medium py-2">
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="block px-4 py-2 rounded-lg font-medium text-sm text-white text-center bg-purple-600"
              >
                Get Started
              </Link>
            </div>
          )}
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search docs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#12121a] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Navigation */}
                <nav className="bg-[#12121a] rounded-xl border border-white/5 overflow-hidden">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        data-section={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-white/5 last:border-b-0 ${
                          activeSection === section.id
                            ? 'bg-purple-600/20 text-purple-400 font-medium'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
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

                {/* CTA Card */}
                <div className="rounded-xl p-5 text-white bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg shadow-purple-500/20">
                  <h3 className="font-semibold text-white mb-2">Ready to get started?</h3>
                  <p className="text-sm text-white/70 mb-4">Create your free account and start organizing your academic life today.</p>
                  <Link 
                    href="/signup"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-700 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
                  >
                    Sign Up Free
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3">
              <div className="bg-[#12121a] rounded-xl border border-white/5 p-8 md:p-10 prose prose-invert prose-lg max-w-none" style={{ lineHeight: '1.8' }}>
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

        {/* Footer */}
        <footer className="border-t border-white/5 bg-[#0a0a0f] mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-800">
                  <StraturaLogo size={20} color="white" />
                </div>
                <span className="font-semibold text-white">StraturaOS</span>
              </div>
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} StraturaOS. Built for students, by students.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function OverviewSection() {
  return (
    <div className="max-w-none space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">Welcome to StraturaOS</h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          <span className="text-white font-medium">StraturaOS</span> helps you stay organized throughout your academic journey. 
          Manage your courses, track grades, schedule events, and monitor attendance all in one place.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-6">What Can You Do?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FeatureCard 
          icon={<BookMarked className="w-6 h-6 text-purple-400" />} 
          title="Organize Courses" 
          description="Keep track of all your modules, credits, and instructors" 
        />
        <FeatureCard 
          icon={<BarChart3 className="w-6 h-6 text-blue-400" />} 
          title="Monitor Grades" 
          description="Track your academic performance and calculate GPA automatically" 
        />
        <FeatureCard 
          icon={<Clock className="w-6 h-6 text-green-400" />} 
          title="Smart Scheduling" 
          description="Create weekly timetables with automatic recurring events" 
        />
        <FeatureCard 
          icon={<CheckSquare className="w-6 h-6 text-orange-400" />} 
          title="Track Attendance" 
          description="Monitor class attendance with an easy point system" 
        />
        <FeatureCard 
          icon={<Calendar className="w-6 h-6 text-pink-400" />} 
          title="Unified Calendar" 
          description="View all assignments, exams, and events in one place" 
        />
        <FeatureCard 
          icon={<Award className="w-6 h-6 text-amber-400" />} 
          title="Holiday Integration" 
          description="Automatic detection of holidays for Iraq and Kurdistan" 
        />
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Rocket className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-lg font-semibold text-blue-300 mb-2">New to StraturaOS?</h4>
            <p className="text-blue-200/80 mb-4">
              Start by creating your account, then set up your first semester and add your courses. The guide will walk you through everything!
            </p>
            <button 
              onClick={() => document.querySelector('[data-section="getting-started"]')?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors text-sm"
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
    <div className="max-w-none space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">Getting Started</h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          Follow these simple steps to get started with StraturaOS and organize your academic life.
        </p>
      </div>

      <div className="space-y-8">
        <Step 
          number="1" 
          title="Create Your Account"
          icon={<Users className="w-5 h-5 text-purple-400" />}
        >
          <p className="text-gray-400 mb-4 leading-relaxed">
            Click the <span className="text-white font-medium">Sign Up</span> button on the homepage and create your account with your email and password.
          </p>
          <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 text-sm text-blue-200/80 leading-relaxed rounded-r-lg">
            <span className="text-blue-300 font-medium">Tip:</span> Use a strong password to keep your academic data secure.
          </div>
        </Step>

        <Step 
          number="2" 
          title="Set Up Your First Semester"
          icon={<Calendar className="w-5 h-5 text-purple-400" />}
        >
          <p className="text-gray-400 leading-relaxed">
            Go to <Link href="/modules" className="text-purple-400 hover:text-purple-300 font-medium">Modules</Link> and click <span className="text-white font-medium">"Configure Semesters"</span> to add your current semester with start and end dates.
          </p>
        </Step>

        <Step 
          number="3" 
          title="Add Your Courses"
          icon={<BookMarked className="w-5 h-5 text-purple-400" />}
        >
          <p className="text-gray-400 mb-4 leading-relaxed">
            Click <span className="text-white font-medium">"Add Course"</span> to create entries for each module you're taking. Include:
          </p>
          <ul className="text-sm text-gray-400 space-y-2.5 list-disc list-inside leading-relaxed">
            <li>Course name and code</li>
            <li>Credits</li>
            <li>Instructor name</li>
            <li>Pick a color for easy identification</li>
          </ul>
        </Step>

        <Step 
          number="4" 
          title="Create Your Timetable"
          icon={<Clock className="w-5 h-5 text-purple-400" />}
        >
          <p className="text-gray-400 leading-relaxed">
            Visit <Link href="/timetable-setup" className="text-purple-400 hover:text-purple-300 font-medium">Smart Schedule Creator</Link> and use the wizard to generate your weekly class schedule. 
            The system will automatically create recurring events for each class.
          </p>
        </Step>

        <Step 
          number="5" 
          title="Set Up Grade Tracking"
          icon={<BarChart3 className="w-5 h-5 text-purple-400" />}
        >
          <p className="text-gray-400 leading-relaxed">
            Head to <Link href="/grades" className="text-purple-400 hover:text-purple-300 font-medium">Grades</Link> and add grading categories 
            (like Assignments, Midterm, Final) for each course to start tracking your performance.
          </p>
        </Step>

        <Step 
          number="6" 
          title="Start Using the Platform"
          icon={<Award className="w-5 h-5 text-purple-400" />}
        >
          <p className="text-gray-400">
            You're all set! Check your <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 font-medium">Dashboard</Link> for 
            an overview, use the <Link href="/calendar" className="text-purple-400 hover:text-purple-300 font-medium">Calendar</Link> to track deadlines, 
            and log <Link href="/attendance" className="text-purple-400 hover:text-purple-300 font-medium">Attendance</Link> for your classes.
          </p>
        </Step>
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8">
        <div className="flex items-start gap-4">
          <CheckSquare className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-lg font-semibold text-green-300 mb-4">Quick Start Checklist</h4>
            <ul className="text-green-200/80 space-y-3 text-sm leading-relaxed">
              <li className="flex items-center gap-3">
                <span className="text-green-400 text-base">✓</span> Create account and sign in
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400 text-base">✓</span> Configure your semester dates
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400 text-base">✓</span> Add all your courses
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400 text-base">✓</span> Generate weekly timetable
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400 text-base">✓</span> Set up grading categories
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400 text-base">✓</span> Explore the dashboard
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
    <div className="max-w-none space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Managing Courses</h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          Learn how to organize your academic courses and semesters effectively.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-5">Adding a Course</h3>
        <div className="bg-white/5 rounded-xl p-6">
          <ol className="space-y-3 text-gray-400">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <span>Navigate to the <Link href="/modules" className="text-purple-400 hover:text-purple-300 font-medium">Modules</Link> page</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <span>Click the <span className="text-white font-medium">"Add Course"</span> button</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <span>Fill in course details (name, code, credits, instructor)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
              <span>Pick a color to identify the course visually</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm font-semibold">5</span>
              <span>Assign to a semester (optional)</span>
            </li>
          </ol>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-5">Managing Semesters</h3>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Semesters help you organize courses by academic term. Click <span className="text-white font-medium">"Configure Semesters"</span> to:
        </p>
        <ul className="space-y-2 text-gray-400 list-disc list-inside mb-6 leading-relaxed">
          <li>Add new semesters with start and end dates</li>
          <li>Mark a semester as active (shows first in lists)</li>
          <li>Edit or archive old semesters</li>
        </ul>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-300 mb-1">Pro Tip</h4>
              <p className="text-amber-200/80 text-sm">
                Use color coding consistently - for example, use blue for all computer science courses, green for math, etc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GradesSection() {
  return (
    <div className="max-w-none space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Tracking Grades</h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          Monitor your academic performance with detailed grade tracking and automatic GPA calculation.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-5">Setting Up Grading Categories</h3>
        <p className="text-gray-400 mb-4 leading-relaxed">
          For each course, you can create grading categories (Assignments, Quizzes, Midterm, Final, etc.):
        </p>
        <div className="bg-white/5 rounded-xl p-6">
          <ol className="space-y-3 text-gray-400">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <span>Go to <Link href="/grades" className="text-purple-400 hover:text-purple-300 font-medium">Grades</Link></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <span>Select a course</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <span>Click <span className="text-white font-medium">"Add Category"</span></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
              <span>Enter category name and weight (percentage of final grade)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">5</span>
              <span>Add individual items (assignments, quizzes) with scores</span>
            </li>
          </ol>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-5">Understanding Your GPA</h3>
        <p className="text-gray-400 mb-4 leading-relaxed">
          The system automatically calculates your:
        </p>
        <ul className="space-y-2 text-gray-400 list-disc list-inside leading-relaxed">
          <li><span className="text-white font-medium">Course Grade:</span> Weighted average of all categories</li>
          <li><span className="text-white font-medium">Semester GPA:</span> Average of all courses in active semester</li>
          <li><span className="text-white font-medium">Overall GPA:</span> Cumulative GPA across all semesters</li>
        </ul>
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-green-300 mb-2">Grading Scale</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-green-200/80">
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
    <div className="max-w-none space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Creating Schedules</h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          Use the Smart Schedule Creator to generate your weekly class timetable automatically.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-5">Using the Smart Schedule Creator</h3>
        <p className="text-gray-400 mb-4 leading-relaxed">
          The wizard makes it easy to create recurring weekly events:
        </p>
        <div className="bg-white/5 rounded-xl p-6 mb-6">
          <ol className="space-y-3 text-gray-400">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <span>Visit <Link href="/timetable-setup" className="text-purple-400 hover:text-purple-300 font-medium">Smart Schedule Creator</Link></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <span>Select a course from your list</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <span>Choose the day(s) of the week the class meets</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
              <span>Set start and end times</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">5</span>
              <span>Add location (classroom, building)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">6</span>
              <span>Click <span className="text-white font-medium">"Generate Schedule"</span> - done!</span>
            </li>
          </ol>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-5">Viewing Your Timetable</h3>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Check your weekly schedule at <Link href="/timetable" className="text-purple-400 hover:text-purple-300 font-medium">Timetable</Link>. You can:
        </p>
        <ul className="space-y-2 text-gray-400 list-disc list-inside leading-relaxed">
          <li>View by day or week</li>
          <li>See location for each class</li>
          <li>Edit individual events if needed</li>
          <li>Delete entire event series</li>
        </ul>
      </div>

      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-purple-300 mb-1">Smart Features</h4>
            <p className="text-purple-200/80 text-sm">
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
    <div className="max-w-none space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Using the Calendar</h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          Your unified view of all assignments, exams, course schedules, and holidays.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-5">Adding Events</h3>
        <p className="text-gray-400 mb-4 leading-relaxed">
          Create custom events for assignments, exams, or personal reminders:
        </p>
        <div className="bg-white/5 rounded-xl p-6">
          <ol className="space-y-3 text-gray-400">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-pink-500/20 text-pink-400 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <span>Click on any date in the <Link href="/calendar" className="text-purple-400 hover:text-purple-300 font-medium">Calendar</Link></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-pink-500/20 text-pink-400 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <span>Choose event type (Assignment, Exam, Meeting, etc.)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-pink-500/20 text-pink-400 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <span>Enter title and details</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-pink-500/20 text-pink-400 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
              <span>Link to a course (optional)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-pink-500/20 text-pink-400 rounded-full flex items-center justify-center text-sm font-semibold">5</span>
              <span>Set time and location</span>
            </li>
          </ol>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-5">Event Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookMarked className="w-4 h-4 text-blue-400" />
              <h4 className="font-semibold text-blue-300">Assignment</h4>
            </div>
            <p className="text-sm text-blue-200/80">Homework, projects, papers</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-red-400" />
              <h4 className="font-semibold text-red-300">Exam</h4>
            </div>
            <p className="text-sm text-red-200/80">Midterms, finals, quizzes</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-green-400" />
              <h4 className="font-semibold text-green-300">Meeting</h4>
            </div>
            <p className="text-sm text-green-200/80">Office hours, group meetings</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <h4 className="font-semibold text-purple-300">Other</h4>
            </div>
            <p className="text-sm text-purple-200/80">Personal reminders, deadlines</p>
          </div>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-300 mb-1">Holiday Integration</h4>
            <p className="text-amber-200/80 text-sm">
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
    <div className="max-w-none space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Attendance Tracking</h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          Keep track of your class attendance with an easy point-based system.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-5">Logging Attendance</h3>
        <p className="text-gray-400 mb-4 leading-relaxed">
          After each class:
        </p>
        <div className="bg-white/5 rounded-xl p-6 mb-6">
          <ol className="space-y-3 text-gray-400">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <span>Go to <Link href="/attendance" className="text-purple-400 hover:text-purple-300 font-medium">Attendance</Link></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <span>Select the course</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <span>Mark your status: Present, Absent, Late, or Excused</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
              <span>Add notes if needed (optional)</span>
            </li>
          </ol>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-5">Point System</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">+2</div>
            <div className="text-sm font-semibold text-green-300">Present</div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-amber-400 mb-1">+1</div>
            <div className="text-sm font-semibold text-amber-300">Late</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">+1</div>
            <div className="text-sm font-semibold text-blue-300">Excused</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400 mb-1">0</div>
            <div className="text-sm font-semibold text-red-300">Absent</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-5">Viewing Statistics</h3>
        <p className="text-gray-400 mb-4 leading-relaxed">
          The attendance page shows:
        </p>
        <ul className="space-y-2 text-gray-400 list-disc list-inside leading-relaxed">
          <li>Total points earned per course</li>
          <li>Attendance percentage</li>
          <li>Number of absences</li>
          <li>Visual progress indicators</li>
        </ul>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <CheckSquare className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-300 mb-1">Stay on Track</h4>
            <p className="text-blue-200/80 text-sm">
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
    <div className="max-w-none space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Tips & Best Practices</h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          Get the most out of StraturaOS with these helpful tips.
        </p>
      </div>

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

      <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-xl p-6 mt-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <StraturaLogo size={24} color="white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-300 mb-2">Need More Help?</h3>
            <p className="text-purple-200/80 mb-4">
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
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
      <div className="mb-4">{icon}</div>
      <h4 className="font-semibold text-white mb-2 text-lg">{title}</h4>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, icon, children }) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl flex items-center justify-center font-bold text-base shadow-lg shadow-purple-500/20">
        {number}
      </div>
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-2.5 mb-3">
          {icon && <div className="text-purple-400">{icon}</div>}
          <h4 className="font-semibold text-white text-lg">{title}</h4>
        </div>
        <div className="space-y-3 text-gray-400 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

function TipCard({ icon, title, color, tips }) {
  const colorClasses = {
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  };

  const textColorClasses = {
    purple: 'text-purple-300',
    blue: 'text-blue-300',
    green: 'text-green-300',
    orange: 'text-orange-300',
    amber: 'text-amber-300',
  };

  const listColorClasses = {
    purple: 'text-purple-200/80',
    blue: 'text-blue-200/80',
    green: 'text-green-200/80',
    orange: 'text-orange-200/80',
    amber: 'text-amber-200/80',
  };

  return (
    <div className={`border rounded-xl p-6 ${colorClasses[color]}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`${colorClasses[color].split(' ').slice(-1)[0]}`}>
          {icon}
        </div>
        <h3 className={`text-lg font-semibold ${textColorClasses[color]}`}>{title}</h3>
      </div>
      <ul className={`space-y-3 text-sm leading-relaxed ${listColorClasses[color]}`}>
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="mt-0.5 text-base">✓</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
