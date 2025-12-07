import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Calendar, BookOpen, Shield, Zap, Clock, BarChart3, ArrowRight, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';

// StraturaOS Logo SVG Component
const StraturaLogo = ({ size = 24, color = "gradient" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {color === "gradient" && (
      <defs>
        <linearGradient id="logoGradientLanding" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED"/>
          <stop offset="50%" stopColor="#9333EA"/>
          <stop offset="100%" stopColor="#A855F7"/>
        </linearGradient>
      </defs>
    )}
    <g transform="translate(0,64) scale(0.1,-0.1)" fill={color === "gradient" ? "url(#logoGradientLanding)" : color}>
      <path d="M169 567 c-75 -40 -144 -78 -153 -86 -13 -11 -16 -36 -16 -160 0 -80 4 -151 8 -157 4 -6 76 -46 160 -89 l154 -79 145 74 c80 41 152 80 159 88 20 20 20 305 0 324 -19 19 -291 158 -307 157 -8 0 -75 -33 -150 -72z m271 -74 l110 -58 0 -67 c0 -40 -4 -68 -10 -68 -6 0 -56 23 -112 51 l-102 51 28 23 28 22 -31 12 c-27 12 -36 10 -100 -25 -39 -21 -71 -41 -71 -44 0 -3 81 -45 180 -92 99 -48 180 -91 179 -95 0 -4 -49 -32 -108 -62 l-108 -53 -114 58 c-107 55 -114 61 -117 92 -2 18 1 32 8 32 5 0 56 -23 112 -51 l102 -51 35 17 36 17 -148 74 -148 75 3 42 3 42 110 57 c61 32 113 57 117 58 5 0 57 -26 118 -57z"/>
    </g>
  </svg>
);

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    if (hadDark) root.classList.remove('dark');
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      if (hadDark) root.classList.add('dark');
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ 
      background: '#0a0a0f',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <Head>
        <title>StraturaOS</title>
        <meta name="description" content="One place for courses, grades, schedules, and everything academic. Built by students who needed it." />
      </Head>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        .animate-pulse-soft {
          animation: pulse-soft 3s ease-in-out infinite;
        }
      `}</style>

      {/* Navigation */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(10, 10, 15, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link href="/landing" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.625rem',
            textDecoration: 'none',
          }}>
            <StraturaLogo size={30} color="white" />
            <span style={{ 
              fontSize: '1.25rem', 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}>
              StraturaOS
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link href="#features" style={{ 
              color: '#9ca3af', 
              textDecoration: 'none', 
              fontSize: '0.9375rem',
              fontWeight: 500,
            }}>
              Features
            </Link>
            <Link href="#how-it-works" style={{ 
              color: '#9ca3af', 
              textDecoration: 'none', 
              fontSize: '0.9375rem',
              fontWeight: 500,
            }}>
              How It Works
            </Link>
            <Link href="/docs" style={{ 
              color: '#9ca3af', 
              textDecoration: 'none', 
              fontSize: '0.9375rem',
              fontWeight: 500,
            }}>
              Docs
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link href="/signin" style={{ 
                color: '#9333EA', 
                textDecoration: 'none', 
                fontSize: '0.9375rem',
                fontWeight: 600,
                padding: '0.5rem 1rem',
              }}>
                Sign in
              </Link>
              <Link href="/signup" style={{
                background: 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)',
                color: 'white',
                padding: '0.625rem 1.25rem',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                boxShadow: '0 4px 14px rgba(147, 51, 234, 0.25)',
              }}>
                Get Started
              </Link>
            </div>
          </nav>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'none',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div style={{
            background: 'rgba(18, 18, 26, 0.98)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '1rem',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link href="#features" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.75rem 1rem', color: '#e5e7eb', textDecoration: 'none', fontWeight: 500 }}>Features</Link>
              <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.75rem 1rem', color: '#e5e7eb', textDecoration: 'none', fontWeight: 500 }}>How It Works</Link>
              <Link href="/docs" style={{ padding: '0.75rem 1rem', color: '#e5e7eb', textDecoration: 'none', fontWeight: 500 }}>Docs</Link>
              <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />
              <Link href="/signin" style={{ padding: '0.75rem 1rem', color: '#9333EA', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
              <Link href="/signup" style={{ 
                padding: '0.75rem 1rem', 
                background: 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)', 
                color: 'white', 
                textDecoration: 'none', 
                fontWeight: 600,
                borderRadius: '10px',
                textAlign: 'center',
              }}>Get Started</Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '10rem 1.5rem 6rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '3rem',
          alignItems: 'center',
        }}>
          <div>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(147, 51, 234, 0.1)',
              padding: '0.5rem 1rem',
              borderRadius: '100px',
              marginBottom: '1.5rem',
              border: '1px solid rgba(147, 51, 234, 0.2)',
            }}>
              <Sparkles size={14} color="#9333EA" />
              <span style={{ fontSize: '0.8125rem', color: '#9333EA', fontWeight: 600 }}>
                Built by students, for students
              </span>
            </div>

            <h1 style={{ 
              fontSize: 'clamp(2.75rem, 6vw, 4rem)', 
              fontWeight: 800, 
              lineHeight: 1.1,
              marginBottom: '1.5rem',
              color: '#ffffff',
              letterSpacing: '-0.03em',
            }}>
              Your academic<br />
              <span style={{
                background: 'linear-gradient(135deg, #9333EA 0%, #A855F7 50%, #C084FC 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>command center</span>
            </h1>
            
            <p style={{ 
              fontSize: '1.25rem', 
              color: '#9ca3af', 
              lineHeight: 1.65,
              marginBottom: '2rem',
              maxWidth: '460px',
            }}>
              One place for your courses, grades, timetable, and deadlines. Stop juggling apps and start focusing on what matters.
            </p>

            {/* CTAs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '2.5rem',
            }}>
              <Link href="/signup" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.625rem',
                background: 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)',
                color: 'white',
                padding: '1rem 1.75rem',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                boxShadow: '0 4px 20px rgba(147, 51, 234, 0.3)',
                transition: 'all 0.2s ease',
              }}>
                Start for Free
                <ArrowRight size={18} />
              </Link>
              <Link href="/signin" style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: '#a78bfa',
                padding: '1rem 1.5rem',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                borderRadius: '12px',
                border: '2px solid rgba(167, 139, 250, 0.3)',
                background: 'transparent',
                transition: 'all 0.2s ease',
              }}>
                Sign In
              </Link>
            </div>

            {/* Value props */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['Completely free, no hidden fees', 'No ads or data selling', 'Works on any device'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <CheckCircle2 size={18} color="#a78bfa" />
                  <span style={{ fontSize: '0.9375rem', color: '#9ca3af', fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Visual */}
          <div style={{ position: 'relative' }}>
            {/* Decorative gradient blob */}
            <div className="animate-pulse-soft" style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%)',
              filter: 'blur(40px)',
              zIndex: 0,
            }} />

            {/* Main preview card */}
            <div className="animate-float" style={{
              position: 'relative',
              zIndex: 1,
              background: '#12121a',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              maxWidth: '380px',
              margin: '0 auto',
            }}>
              {/* Header bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Calendar size={18} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff' }}>This Week</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>4 upcoming</div>
                  </div>
                </div>
                <div style={{
                  background: 'rgba(147, 51, 234, 0.1)',
                  color: '#9333EA',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}>
                  On track
                </div>
              </div>
              
              {/* Events list */}
              {[
                { title: 'Data Structures Lecture', time: 'Today, 10:00 AM', color: '#9333EA', type: 'Class' },
                { title: 'Algorithm Assignment', time: 'Tomorrow, 11:59 PM', color: '#F59E0B', type: 'Due' },
                { title: 'Database Systems', time: 'Wed, 2:00 PM', color: '#A855F7', type: 'Class' },
              ].map((event, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  padding: '0.875rem',
                  marginBottom: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                  <div style={{ 
                    width: '4px', 
                    height: '40px', 
                    borderRadius: '2px', 
                    background: event.color,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.125rem' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{event.time}</div>
                  </div>
                  <div style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: event.color,
                    background: `${event.color}15`,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                  }}>
                    {event.type}
                  </div>
                </div>
              ))}

              {/* Mini stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                {[
                  { label: 'Courses', value: '6' },
                  { label: 'Tasks', value: '12' },
                  { label: 'GPA', value: '3.7' },
                ].map((stat, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a78bfa' }}>{stat.value}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#9ca3af', fontWeight: 500 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Problem / Solution Bridge */}
        <section style={{
          background: 'linear-gradient(135deg, #9333EA 0%, #A855F7 50%, #C084FC 100%)',
          padding: '5rem 1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle pattern overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              marginBottom: '1.25rem',
            }}>
              Stop letting deadlines sneak up on you
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.65,
              maxWidth: '600px',
              margin: '0 auto 2.5rem',
            }}>
              We built StraturaOS because we were tired of forgetting assignments, 
              losing track of lectures, and scrambling before exams. Now we're sharing it with you.
            </p>

            <Link href="/signup" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'white',
              color: '#9333EA',
              padding: '0.875rem 1.75rem',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}>
              Try It Free
              <ChevronRight size={18} />
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '6rem 1.5rem',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ 
              fontSize: 'clamp(2rem, 4vw, 2.75rem)', 
              fontWeight: 800, 
              marginBottom: '1rem',
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}>
              Everything in one place
            </h2>
            <p style={{ 
              fontSize: '1.125rem', 
              color: '#9ca3af', 
              maxWidth: '500px', 
              margin: '0 auto', 
              lineHeight: 1.6 
            }}>
              No more switching between apps. Everything you need to stay on top of academics.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1.5rem',
          }}>
            {[
              { 
                icon: Calendar, 
                title: 'Unified Calendar', 
                description: 'Classes, exams, assignments, study sessions — all in one view. Color-coded and organized.',
              },
              { 
                icon: BookOpen, 
                title: 'Course Tracking', 
                description: "Keep track of what's due, what's coming up, and what you've completed for each course.",
              },
              { 
                icon: BarChart3, 
                title: 'Grade Calculator', 
                description: 'Calculate your GPA, track individual course grades, and know where you stand.',
              },
              { 
                icon: Clock, 
                title: 'Smart Timetable', 
                description: 'Your weekly schedule at a glance. Never forget which room or what time.',
              },
              { 
                icon: Shield, 
                title: 'Privacy Focused', 
                description: "Your data stays yours. We don't sell it, we don't show ads, we don't track you.",
              },
              { 
                icon: Zap, 
                title: 'Built with Care', 
                description: 'Designed to help you focus. Clean interface, thoughtful features.',
              },
            ].map((feature, i) => (
              <div key={i} style={{
                background: '#12121a',
                borderRadius: '16px',
                padding: '2rem',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.2s ease',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(147, 51, 234, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}>
                  <feature.icon size={24} color="#a78bfa" />
                </div>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 700, 
                  marginBottom: '0.5rem',
                  color: '#ffffff',
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  fontSize: '0.9375rem', 
                  color: '#9ca3af', 
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" style={{ 
          background: '#12121a',
          padding: '6rem 1.5rem',
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ 
                fontSize: 'clamp(2rem, 4vw, 2.75rem)', 
                fontWeight: 800, 
                marginBottom: '1rem',
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}>
                Get started in minutes
              </h2>
              <p style={{ 
                fontSize: '1.125rem', 
                color: '#9ca3af', 
                lineHeight: 1.6 
              }}>
                No complicated setup. No learning curve.
              </p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '3rem',
            }}>
              {[
                { 
                  step: '1', 
                  title: 'Create your account', 
                  description: 'Sign up with your email. Takes about 30 seconds.',
                },
                { 
                  step: '2', 
                  title: 'Add your courses', 
                  description: 'Enter your classes, schedule, and any upcoming deadlines.',
                },
                { 
                  step: '3', 
                  title: 'Stay organized', 
                  description: "That's it. Check your dashboard daily and never miss a deadline.",
                },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    margin: '0 auto 1.5rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(147, 51, 234, 0.25)',
                  }}>
                    {item.step}
                  </div>
                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 700, 
                    marginBottom: '0.625rem',
                    color: '#ffffff',
                  }}>
                    {item.title}
                  </h3>
                  <p style={{ 
                    fontSize: '1rem', 
                    color: '#9ca3af', 
                    lineHeight: 1.6,
                    margin: 0,
                  }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section style={{
          background: '#0a0a0f',
          padding: '6rem 1.5rem',
        }}>
          <div style={{ 
            maxWidth: '700px', 
            margin: '0 auto', 
            textAlign: 'center',
          }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: '1.25rem',
              letterSpacing: '-0.02em',
            }}>
              Ready to get organized?
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#9ca3af',
              marginBottom: '2rem',
              lineHeight: 1.6,
            }}>
              Join students who have taken control of their academic life.
            </p>

            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <Link href="/signup" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                boxShadow: '0 4px 20px rgba(147, 51, 234, 0.3)',
              }}>
                Get Started Free
                <ArrowRight size={18} />
              </Link>
            </div>

            <p style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280',
              marginTop: '1.5rem',
            }}>
              Free forever · No credit card required
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ 
        background: '#12121a',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '3rem 1.5rem',
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <StraturaLogo size={24} color="white" />
            <span style={{ 
              fontSize: '1rem', 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              StraturaOS
            </span>
          </div>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Features', href: '#features' },
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Docs', href: '/docs' },
              { label: 'Sign In', href: '/signin' },
            ].map((link, i) => (
              <Link 
                key={i}
                href={link.href}
                style={{ 
                  color: '#9ca3af', 
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <p style={{ 
            color: '#6b7280', 
            fontSize: '0.8125rem',
            margin: 0,
          }}>
            © {new Date().getFullYear()} StraturaOS
          </p>
        </div>
      </footer>
    </div>
  );
}
