import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

// StraturaOS Logo SVG Component
const StraturaLogo = ({ size = 32, color = "gradient" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {color === "gradient" && (
      <defs>
        <linearGradient id="logoGradientSignin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3730A3"/>
          <stop offset="50%" stopColor="#4F46E5"/>
          <stop offset="100%" stopColor="#6366F1"/>
        </linearGradient>
      </defs>
    )}
    <g transform="translate(0,64) scale(0.1,-0.1)" fill={color === "gradient" ? "url(#logoGradientSignin)" : color}>
      <path d="M169 567 c-75 -40 -144 -78 -153 -86 -13 -11 -16 -36 -16 -160 0 -80 4 -151 8 -157 4 -6 76 -46 160 -89 l154 -79 145 74 c80 41 152 80 159 88 20 20 20 305 0 324 -19 19 -291 158 -307 157 -8 0 -75 -33 -150 -72z m271 -74 l110 -58 0 -67 c0 -40 -4 -68 -10 -68 -6 0 -56 23 -112 51 l-102 51 28 23 28 22 -31 12 c-27 12 -36 10 -100 -25 -39 -21 -71 -41 -71 -44 0 -3 81 -45 180 -92 99 -48 180 -91 179 -95 0 -4 -49 -32 -108 -62 l-108 -53 -114 58 c-107 55 -114 61 -117 92 -2 18 1 32 8 32 5 0 56 -23 112 -51 l102 -51 35 17 36 17 -148 74 -148 75 3 42 3 42 110 57 c61 32 113 57 117 58 5 0 57 -26 118 -57z"/>
    </g>
  </svg>
);

export default function SignInPolished() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCurrentPassword, setResetCurrentPassword] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetCurrentPassword, setShowResetCurrentPassword] = useState(false);
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const router = useRouter();

  // Force a remount after initial render to clear autofill styling
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Prefill email from query param (helpful after signup)
  useEffect(() => {
    try {
      if (router && router.query && router.query.email) {
        setEmail(String(router.query.email));
      }
    } catch (e) {}
  }, [router && router.query && router.query.email]);

  // Ensure this page does not render in dark mode: temporarily remove the
  // `dark` class from <html> while this page is mounted, and restore it on
  // unmount if it was present before.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    if (hadDark) root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  async function handleSubmit(e) {
    e && e.preventDefault();
    setError('');

    // Basic client-side validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    const emailRe = /^\S+@\S+\.\S+$/;
    if (!emailRe.test(String(email))) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Clear any existing dev/demo cookies to avoid staying signed in as the demo user
      try {
        if (process.env.NODE_ENV === 'development') {
          await fetch('/api/auth/local-signout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
        }
      } catch (e) {}
      // In development we support a local password-based signin helper.
      // Prefer `/api/auth/local-signin` when available (development) so
      // we can validate passwords. In production, fall back to the
      // generic `/api/auth/signin` which accepts an email and issues a
      // session cookie (or a dev-user fallback).
      const isDev = (process.env.NODE_ENV === 'development');

      if (isDev) {
        // Try local password signin (returns 302 redirect on success and sets cookies)
        const res = await fetch('/api/auth/local-signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ email: String(email).trim(), password: String(password), returnTo: '/overview' })
        });
        // If the endpoint redirected or returned OK, assume success and navigate
        if (res.ok || res.redirected) {
          try { router.push('/overview'); return; } catch (e) { window.location.href = '/overview'; return; }
        }
        // Try to parse error message
        const txt = await res.text().catch(() => null);
        setError(txt || 'Invalid credentials');
        return;
      }

      // Production: call /api/auth/signin which issues a session cookie based on email
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: String(email).trim() })
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json && (json.success || json.id)) {
        try { router.push('/overview'); return; } catch (e) { window.location.href = '/overview'; return; }
      }
      setError((json && (json.error || json.message)) ? String(json.error || json.message) : 'Sign in failed');
    } catch (err) {
      console.error('Sign-in error', err);
      setError('Sign-in failed — please try again');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset(e) {
    e && e.preventDefault();
    setResetError('');
    setResetSuccess(false);

    if (!resetEmail || !resetCurrentPassword || !resetNewPassword) {
      setResetError('All fields are required');
      return;
    }

    const emailRe = /^\S+@\S+\.\S+$/;
    if (!emailRe.test(String(resetEmail))) {
      setResetError('Please enter a valid email address');
      return;
    }

    if (resetNewPassword.length < 8) {
      setResetError('New password must be at least 8 characters');
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: resetEmail.trim(),
          currentPassword: resetCurrentPassword,
          newPassword: resetNewPassword
        })
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        setResetSuccess(true);
        setResetEmail('');
        setResetCurrentPassword('');
        setResetNewPassword('');
        
        // Auto-close modal after 2 seconds
        setTimeout(() => {
          setShowResetModal(false);
          setResetSuccess(false);
        }, 2000);
      } else {
        setResetError(json?.error || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setResetError('Network error. Please try again.');
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Sign In — StraturaOS</title>
      </Head>
      <style>{`
        .signin-page button svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }
      `}</style>
      <div className="min-h-screen signin-page flex items-center justify-center p-4 bg-white" style={{
        background: '#ffffff'
      }}>
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex auth-brand-logo items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
            }}>
              <StraturaLogo size={32} color="white" />
            </div>
            <h1 className="text-5xl font-black mb-2" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Welcome back
            </h1>
            <p style={{ color: '#64748b' }}>
              Sign in to continue to StraturaOS
            </p>
          </div>

          {/* Sign In Card */}
          <div className="rounded-xl p-8 shadow-xl" style={{
            background: '#ffffff',
            border: '1px solid rgba(15, 23, 42, 0.06)',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)'
          }}>
            <div className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#334155' }}>
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ zIndex: 10 }}>
                    <Mail className="h-5 w-5" style={{ color: '#94a3b8' }} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="you@university.edu"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      borderRadius: '0.5rem',
                      backgroundColor: '#f8fafc',
                      color: '#0f172a',
                      border: '1px solid #e2e8f0',
                      outline: 'none',
                      fontSize: '1rem',
                      lineHeight: '1.5',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#334155' }}>
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ zIndex: 10 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffffff' }}>
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <input
                    key={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="off"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="••••••••"
                    className="password-input"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem 3rem 0.75rem 2.5rem',
                      borderRadius: '0.5rem',
                      backgroundColor: '#f8fafc',
                      color: '#0f172a',
                      border: '1px solid #e2e8f0',
                      outline: 'none',
                      fontSize: '1rem',
                      lineHeight: '1.5',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    style={{ color: '#64748b', zIndex: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <a
                  href="/forgot-password"
                  className="text-sm font-medium transition-colors"
                  style={{
                    color: '#7c3aed',
                    textDecoration: 'none'
                  }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Show success banner when redirected from signup */}
              {router.query && router.query.registered && (
                <div className="rounded-lg p-4 mb-2 flex items-start gap-3" style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.15)'
                }}>
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#16a34a' }} />
                  <p className="text-sm" style={{ color: '#16a34a' }}>Account created — please sign in.</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="rounded-lg p-4 flex items-start gap-3" style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                  <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
                </div>
              )}

              {/* Sign In Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-medium focus:outline-none transition-all flex items-center justify-center gap-2 shadow-lg"
                style={{
                  background: loading ? '#9333ea' : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 30px rgba(168, 85, 247, 0.3)'
                }}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" 
                         style={{ animation: 'spin 0.8s linear infinite' }} />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <span style={{ display: 'inline-flex', color: '#ffffff' }}>
                      <ArrowRight className="w-5 h-5" style={{ color: '#ffffff', stroke: '#ffffff', fill: 'none' }} />
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid #e2e8f0' }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4" style={{ background: '#ffffff', color: '#64748b' }}>
                  Don't have an account?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <button
              onClick={() => router.push('/signup')}
              className="block w-full text-center py-3 px-4 rounded-lg font-medium transition-all"
              style={{
                border: '1px solid #cbd5e1',
                color: '#334155',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              Create an account
            </button>
          </div>

          {/* Back to Landing */}
          <div className="mt-6 text-center">
            <a href="/landing" className="text-sm transition-colors" style={{ color: '#64748b' }}>
              ← Back to home
            </a>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          * {
            box-sizing: border-box;
          }
          
          /* Nuclear option - force override everything */
          input[type="text"],
          input[type="email"],
          input[type="password"],
          input[name="email"],
          input[name="password"],
          input#email,
          input#password,
          .password-input {
            background-color: #f8fafc !important;
            background: #f8fafc !important;
            background-image: none !important;
            color: #0f172a !important;
            border: 1px solid #e2e8f0 !important;
            -webkit-text-fill-color: #0f172a !important;
            -webkit-background-clip: padding-box !important;
            background-clip: padding-box !important;
            -webkit-appearance: none !important;
            appearance: none !important;
            color-scheme: light !important;
            caret-color: #0f172a !important;
            box-shadow: none !important;
            -webkit-box-shadow: 0 0 0 1000px #f8fafc inset !important;
          }
          
          input[type="text"]:hover,
          input[type="email"]:hover,
          input[type="password"]:hover,
          input[type="text"]:focus,
          input[type="email"]:focus,
          input[type="password"]:focus,
          input[type="text"]:active,
          input[type="email"]:active,
          input[type="password"]:active {
            background-color: #f8fafc !important;
            background: #f8fafc !important;
            background-image: none !important;
            color: #0f172a !important;
            border: 1px solid #e2e8f0 !important;
            outline: none !important;
            -webkit-text-fill-color: #0f172a !important;
            color-scheme: light !important;
          }
          
          input[type="text"]::placeholder,
          input[type="email"]::placeholder,
          input[type="password"]::placeholder {
            color: #94a3b8 !important;
            opacity: 1 !important;
          }
          
          /* Autofill overrides (stronger) */
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active,
          textarea:-webkit-autofill,
          select:-webkit-autofill,
          input[type="password"]:-webkit-autofill,
          :-internal-autofill-selected,
          ::-internal-autofill-selected,
          input:-internal-autofill-selected {
            /* force background color above UA/autofill overlay */
            -webkit-box-shadow: 0 0 0 1000px #f8fafc inset !important;
            box-shadow: 0 0 0 1000px #f8fafc inset !important;
            /* fallback background-image override (helps some versions) */
            background-image: none !important;
            background-repeat: no-repeat !important;
            background-size: 100% 100% !important;
            -webkit-text-fill-color: #0f172a !important;
            background-color: #f8fafc !important;
            color: #0f172a !important;
            border: 1px solid #e2e8f0 !important;
            -webkit-background-clip: padding-box !important;
            background-clip: padding-box !important;
            -webkit-appearance: none !important;
            appearance: none !important;
            transition: background-color 9999s ease-in-out 0s !important;
            filter: none !important;
          }
        `}</style>

        {/* Password Reset Modal */}
        {showResetModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 forgot-password-modal"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              style={{
                animation: 'scale-in 0.2s ease-out',
                background: '#ffffff'
              }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div 
                  className="lock-icon-container"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: '#ffffff', color: '#ffffff' }}>
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: '#0f172a' }}>
                    Change Password
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                    Enter your current password and choose a new one
                  </p>
                </div>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-4 mt-6">
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium mb-2" style={{ color: '#334155' }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5" style={{ color: '#94a3b8' }} />
                    </div>
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@university.edu"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#f8fafc',
                        color: '#0f172a',
                        border: '1px solid #e2e8f0',
                        outline: 'none',
                        fontSize: '1rem',
                        lineHeight: '1.5',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-current-password" className="block text-sm font-medium mb-2" style={{ color: '#334155' }}>
                    Current Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <input
                      id="reset-current-password"
                      type={showResetCurrentPassword ? "text" : "password"}
                      value={resetCurrentPassword}
                      onChange={(e) => setResetCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#f8fafc',
                        color: '#0f172a',
                        border: '1px solid #e2e8f0',
                        outline: 'none',
                        fontSize: '1rem',
                        lineHeight: '1.5',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetCurrentPassword(!showResetCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {showResetCurrentPassword ? <EyeOff className="h-5 w-5" style={{ color: '#94a3b8' }} /> : <Eye className="h-5 w-5" style={{ color: '#94a3b8' }} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-new-password" className="block text-sm font-medium mb-2" style={{ color: '#334155' }}>
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <input
                      id="reset-new-password"
                      type={showResetNewPassword ? "text" : "password"}
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#f8fafc',
                        color: '#0f172a',
                        border: '1px solid #e2e8f0',
                        outline: 'none',
                        fontSize: '1rem',
                        lineHeight: '1.5',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {showResetNewPassword ? <EyeOff className="h-5 w-5" style={{ color: '#94a3b8' }} /> : <Eye className="h-5 w-5" style={{ color: '#94a3b8' }} />}
                    </button>
                  </div>
                </div>

                {resetError && (
                  <div 
                    className="rounded-lg p-3 flex items-start gap-3"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                    <p className="text-sm" style={{ color: '#ef4444' }}>{resetError}</p>
                  </div>
                )}

                {resetSuccess && (
                  <div 
                    className="rounded-lg p-3 flex items-start gap-3"
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.08)',
                      border: '1px solid rgba(34, 197, 94, 0.15)'
                    }}
                  >
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#16a34a' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#16a34a' }}>
                        Password updated successfully!
                      </p>
                      <p className="text-sm mt-1" style={{ color: '#16a34a' }}>
                        You can now use your new password to sign in.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(false);
                      setResetEmail('');
                      setResetError('');
                      setResetSuccess(false);
                    }}
                    disabled={resetLoading}
                    className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all"
                    style={{
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      backgroundColor: 'transparent',
                      cursor: resetLoading ? 'not-allowed' : 'pointer',
                      opacity: resetLoading ? 0.5 : 1
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading || !resetEmail}
                    className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                    style={{
                      background: resetLoading || !resetEmail || !resetCurrentPassword || !resetNewPassword ? '#9333ea' : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      opacity: resetLoading || !resetEmail || !resetCurrentPassword || !resetNewPassword ? 0.7 : 1,
                      cursor: resetLoading || !resetEmail || !resetCurrentPassword || !resetNewPassword ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
                    }}
                  >
                    {resetLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}