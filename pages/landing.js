import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Calendar, BookOpen, Bell, Users, TrendingUp, Shield, Zap, Clock, Star, CheckCircle2, BarChart3 } from 'lucide-react';

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
          <stop offset="0%" stopColor="#3730A3"/>
          <stop offset="50%" stopColor="#4F46E5"/>
          <stop offset="100%" stopColor="#6366F1"/>
        </linearGradient>
      </defs>
    )}
    <g transform="translate(0,64) scale(0.1,-0.1)" fill={color === "gradient" ? "url(#logoGradientLanding)" : color}>
      <path d="M169 567 c-75 -40 -144 -78 -153 -86 -13 -11 -16 -36 -16 -160 0 -80 4 -151 8 -157 4 -6 76 -46 160 -89 l154 -79 145 74 c80 41 152 80 159 88 20 20 20 305 0 324 -19 19 -291 158 -307 157 -8 0 -75 -33 -150 -72z m271 -74 l110 -58 0 -67 c0 -40 -4 -68 -10 -68 -6 0 -56 23 -112 51 l-102 51 28 23 28 22 -31 12 c-27 12 -36 10 -100 -25 -39 -21 -71 -41 -71 -44 0 -3 81 -45 180 -92 99 -48 180 -91 179 -95 0 -4 -49 -32 -108 -62 l-108 -53 -114 58 c-107 55 -114 61 -117 92 -2 18 1 32 8 32 5 0 56 -23 112 -51 l102 -51 35 17 36 17 -148 74 -148 75 3 42 3 42 110 57 c61 32 113 57 117 58 5 0 57 -26 118 -57z"/>
    </g>
  </svg>
);

export default function Welcome() {
  const [scrolled, setScrolled] = useState(false);

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
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #faf5ff 0%, #ffffff 50%, #f5f3ff 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <Head>
        <title>StraturaOS - Stop drowning in sticky notes</title>
        <meta name="description" content="Built by students who were tired of juggling 47 browser tabs. One calendar for everything. Actually free." />
      </Head>

      {/* Navigation */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(168, 85, 247, 0.1)' : '1px solid transparent',
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link href="/landing" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            textDecoration: 'none',
            transition: 'transform 0.2s ease'
          }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
            }}>
              <StraturaLogo size={24} color="white" />
            </div>
            <span style={{ 
              fontSize: '1.25rem', 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              StraturaOS
            </span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link href="#features" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#a855f7'} onMouseLeave={(e) => e.currentTarget.style.color = '#4b5563'}>
              Features
            </Link>
            <Link href="#how-it-works" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#a855f7'} onMouseLeave={(e) => e.currentTarget.style.color = '#4b5563'}>
              How It Works
            </Link>
            <Link href="/signin" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#a855f7'} onMouseLeave={(e) => e.currentTarget.style.color = '#4b5563'}>
              Sign In
            </Link>
            <Link href="/signup" style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
              color: 'white',
              padding: '0.625rem 1.5rem',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
              transition: 'all 0.2s ease'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.4)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.3)';
            }}>
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ paddingTop: '6rem' }}>
        <section style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '4rem 2rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '4rem', 
              fontWeight: 900, 
              lineHeight: 1.1,
              marginBottom: '2rem',
              color: '#1f2937',
              letterSpacing: '-0.02em'
            }}>
              Stop drowning in<br />
              spreadsheets &<br />
              <span style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                sticky notes
              </span>
            </h1>
            
            <p style={{ 
              fontSize: '1.375rem', 
              color: '#4b5563', 
              lineHeight: 1.6,
              marginBottom: '2.5rem',
              fontWeight: 500
            }}>
              A StraturaOS that actually understands how chaotic student life is. Built by students who were tired of juggling 47 browser tabs.
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <Link href="/signup" style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '1.125rem',
                boxShadow: '0 8px 20px rgba(168, 85, 247, 0.3)',
                transition: 'all 0.2s ease',
                display: 'inline-block'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(168, 85, 247, 0.4)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(168, 85, 247, 0.3)';
              }}>
                Start Planning Now
              </Link>
              
              <Link href="/signin" style={{
                background: 'white',
                color: '#7c3aed',
                padding: '1rem 2rem',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '1.125rem',
                border: '2px solid #e9d5ff',
                transition: 'all 0.2s ease',
                display: 'inline-block'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#a855f7';
                e.currentTarget.style.background = '#faf5ff';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e9d5ff';
                e.currentTarget.style.background = 'white';
              }}>
                Sign In
              </Link>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: '#6b7280', fontSize: '0.9375rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#a855f7' }} />
                <span style={{ fontWeight: 500 }}>Actually free. Not "free trial"</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#a855f7' }} />
                <span style={{ fontWeight: 500 }}>No ads. Ever.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#a855f7' }} />
                <span style={{ fontWeight: 500 }}>Works offline</span>
              </div>
            </div>
          </div>

          {/* Hero Illustration */}
          <div style={{ position: 'relative' }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 20px 60px rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative gradient */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(90deg, #a855f7 0%, #7c3aed 50%, #a855f7 100%)',
              }} />
              
              {/* Mock Calendar UI */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>This Week</h3>
                  <Calendar size={20} color="#a855f7" />
                </div>
                
                {[
                  { title: 'Computer Science Lecture', time: '9:00 AM', color: '#a855f7' },
                  { title: 'Math Assignment Due', time: '11:30 AM', color: '#ec4899' },
                  { title: 'Study Group Meeting', time: '2:00 PM', color: '#3b82f6' }
                ].map((event, i) => (
                  <div key={i} style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)',
                    borderLeft: `3px solid ${event.color}`,
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.25rem' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {event.time}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3e8ff' }}>
                {[
                  { label: 'Courses', value: '6', icon: BookOpen },
                  { label: 'Tasks', value: '12', icon: CheckCircle2 },
                  { label: 'Grade', value: 'A-', icon: Star }
                ].map((stat, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      margin: '0 auto 0.5rem',
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <stat.icon size={20} color="#a855f7" />
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>{stat.value}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badges */}
            <div style={{
              position: 'absolute',
              top: '-1rem',
              right: '-1rem',
              background: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(168, 85, 247, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid rgba(168, 85, 247, 0.1)'
            }}>
              <TrendingUp size={16} color="#10b981" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>+15% this week</span>
            </div>
          </div>
        </section>


        {/* Features Section */}
        <section id="features" style={{ 
          maxWidth: '1200px', 
          margin: '6rem auto', 
          padding: '0 2rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ 
              fontSize: '3rem', 
              fontWeight: 900, 
              marginBottom: '1.25rem',
              color: '#1f2937',
              letterSpacing: '-0.02em'
            }}>
              Built for real students,<br />
              not marketing slides
            </h2>
            <p style={{ fontSize: '1.25rem', color: '#6b7280', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
              No fluff. Just the tools you actually need to stop forgetting assignment deadlines at 11:59 PM.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '2rem'
          }}>
            {[
              {
                icon: Calendar,
                title: 'One calendar for everything',
                description: 'Classes, assignments, exams, study sessions. Stop switching between 5 different apps.',
                gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
              },
              {
                icon: BookOpen,
                title: 'Track your courses',
                description: "Know what's due, what's coming up, and what you can actually ignore (looking at you, optional readings).",
                gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
              },
              {
                icon: BarChart3,
                title: 'See your actual grades',
                description: 'Not some AI-generated "predicted" nonsense. Real grades, real GPA calculations.',
                gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              },
              {
                icon: Clock,
                title: 'Built-in timetable',
                description: 'Stop screenshotting your schedule. Just... stop.',
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              },
              {
                icon: Shield,
                title: 'Your data stays yours',
                description: "We don't sell your data. We don't train AI on it. We just store it securely.",
                gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              },
              {
                icon: Zap,
                title: 'Actually fast',
                description: 'No loading spinners. No "syncing..." messages. Just instant.',
                gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
              }
            ].map((feature, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(168, 85, 247, 0.1)',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(168, 85, 247, 0.15)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: feature.gradient,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 16px rgba(168, 85, 247, 0.2)'
                }}>
                  <feature.icon size={28} color="white" />
                </div>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 700, 
                  marginBottom: '0.75rem',
                  color: '#1f2937'
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  fontSize: '0.9375rem', 
                  color: '#6b7280', 
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" style={{ 
          background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
          padding: '6rem 2rem',
          marginTop: '6rem'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ 
                fontSize: '3rem', 
                fontWeight: 900, 
                marginBottom: '1.25rem',
                color: '#1f2937',
                letterSpacing: '-0.02em'
              }}>
                Literally takes 2 minutes
              </h2>
              <p style={{ fontSize: '1.25rem', color: '#6b7280', lineHeight: 1.6 }}>
                No onboarding videos. No tutorials. No "wizard". Just sign up and start using it.
              </p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '3rem',
              position: 'relative'
            }}>
              {[
                {
                  step: '01',
                  title: 'Create account',
                  description: 'Email and password. Done. No "verify your identity" nonsense.'
                },
                {
                  step: '02',
                  title: 'Add your stuff',
                  description: 'Type in your courses and assignments. Or import them if your uni has a sane system.'
                },
                {
                  step: '03',
                  title: "You're done",
                  description: 'Seriously. Start using it. No tutorial required.'
                }
              ].map((step, i) => (
                <div key={i} style={{ position: 'relative', textAlign: 'center' }}>
                  <div style={{
                    fontSize: '4rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    opacity: 0.2,
                    marginBottom: '1rem'
                  }}>
                    {step.step}
                  </div>
                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: '0 8px 24px rgba(168, 85, 247, 0.1)',
                    border: '2px solid rgba(168, 85, 247, 0.1)'
                  }}>
                    <h3 style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 700, 
                      marginBottom: '0.75rem',
                      color: '#1f2937'
                    }}>
                      {step.title}
                    </h3>
                    <p style={{ 
                      fontSize: '1rem', 
                      color: '#6b7280', 
                      lineHeight: 1.6,
                      margin: 0
                    }}>
                      {step.description}
                    </p>
                  </div>
                  
                  {i < 2 && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      right: '-1.5rem',
                      width: '3rem',
                      height: '2px',
                      background: 'linear-gradient(90deg, #a855f7 0%, #7c3aed 100%)',
                      opacity: 0.3,
                      zIndex: -1
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Honest CTA */}
        <section style={{ 
          maxWidth: '900px', 
          margin: '6rem auto', 
          padding: '0 2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            borderRadius: '24px',
            padding: '4rem 3rem',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.2)'
          }}>
            <h2 style={{ 
              fontSize: '2.75rem', 
              fontWeight: 900, 
              color: 'white',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              Try it. It's free.<br />
              Actually free.
            </h2>
            <p style={{ 
              fontSize: '1.125rem', 
              color: '#d1d5db',
              marginBottom: '2.5rem',
              maxWidth: '600px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.6
            }}>
              No credit card. No "upgrade to premium" popups. No ads. Just a tool that works.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
              <Link href="/signup" style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                color: 'white',
                padding: '1.125rem 2.5rem',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '1.125rem',
                display: 'inline-block',
                transition: 'all 0.2s ease',
                boxShadow: '0 8px 20px rgba(168, 85, 247, 0.4)'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(168, 85, 247, 0.5)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(168, 85, 247, 0.4)';
              }}>
                Create Account
              </Link>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>
              Or check out the <Link href="/docs" style={{ color: '#a855f7', textDecoration: 'underline' }}>docs</Link> if you're the "read first" type
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ 
        borderTop: '1px solid #e5e7eb',
        padding: '3rem 2rem 2rem',
        background: '#fafafa'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '3rem'
        }}>
          <div style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <StraturaLogo size={20} color="white" />
              </div>
              <span style={{ 
                fontSize: '1.125rem', 
                fontWeight: 700,
                color: '#1f2937'
              }}>
                StraturaOS
              </span>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
              A student planner that doesn't suck. Made by students who got tired of forgetting deadlines.
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '1.5rem' }}>
              © {new Date().getFullYear()} · Built with caffeine & desperation
            </p>
          </div>

          <div style={{ display: 'flex', gap: '4rem' }}>
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Product
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link href="#features" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.9375rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#a855f7'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                  Features
                </Link>
                <Link href="/docs" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.9375rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#a855f7'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                  Docs
                </Link>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Get Started
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link href="/signup" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.9375rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#a855f7'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                  Sign Up
                </Link>
                <Link href="/signin" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.9375rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#a855f7'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
