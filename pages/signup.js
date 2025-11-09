import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GraduationCap, Mail, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff, Check, X } from 'lucide-react';

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Password strength validation
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    score: 0
  });

  useEffect(() => {
    if (!password) {
      setPasswordStrength({ length: false, uppercase: false, lowercase: false, number: false, special: false, score: 0 });
      return;
    }

    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    setPasswordStrength({ ...checks, score });
  }, [password]);

  // Force a remount after initial render to clear autofill styling
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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

    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // Enforce password requirements
    if (!passwordStrength.uppercase) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!passwordStrength.lowercase) {
      setError('Password must contain at least one lowercase letter');
      return;
    }

    if (!passwordStrength.number) {
      setError('Password must contain at least one number');
      return;
    }

    if (!passwordStrength.special) {
      setError('Password must contain at least one special character (!@#$%^&*...)');
      return;
    }

    setLoading(true);
    try {
      const r = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j && j.error ? String(j.error) : 'Registration failed');
        setLoading(false);
        return;
      }
      console.log('Account created successfully', j.user && j.user.id);

      // Auto sign-in after signup for a smoother UX.
      const isDev = (process.env.NODE_ENV === 'development');
      try {
        // Clear any existing dev/demo cookies so auto-signin will replace them
        try {
          if (isDev) await fetch('/api/auth/local-signout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
        } catch (e) {}

        if (isDev) {
          // Try local password signin which validates password and sets cookies
          const lr = await fetch('/api/auth/local-signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ email: String(email).trim(), password: String(password), returnTo: '/overview' })
          });
          if (lr.ok || lr.redirected) {
            try { router.push('/overview'); return; } catch (e) { window.location.href = '/overview'; return; }
          }
        } else {
          const lr = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ email: String(email).trim() })
          });
          const lj = await lr.json().catch(() => ({}));
          if (lr.ok && lj && (lj.success || lj.id)) {
            try { router.push('/overview'); return; } catch (e) { window.location.href = '/overview'; return; }
          }
        }
      } catch (e) {
        // ignore auto-signin errors and fall back to signin page
      }

      setLoading(false);
      // Fallback: navigate to sign-in with registered hint and prefilling email
      router.push('/signin?registered=1&email=' + encodeURIComponent(String(email).trim()));
    } catch (e) {
      console.error('Signup error', e);
      setError('Could not create account');
      setLoading(false);
    }
  }

  return (
    <>
      <title>Create account — University Planner</title>
      <style>{`
        .signup-page button svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }
      `}</style>
      <div className="min-h-screen signup-page flex items-center justify-center p-4 bg-white" style={{
        background: '#ffffff'
      }}>
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex auth-brand-logo items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
            }}>
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-black mb-2" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Create your account
            </h1>
            <p style={{ color: '#64748b' }}>
              Get started with University Planner
            </p>
          </div>

          {/* Sign Up Card */}
          <div className="rounded-xl p-8 shadow-xl" style={{
            background: '#ffffff',
            border: '1px solid rgba(15, 23, 42, 0.06)',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)'
          }}>
            <div className="space-y-5">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: '#334155' }}>
                  Full name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ zIndex: 10 }}>
                    <User className="h-5 w-5" style={{ color: '#94a3b8' }} />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="John Doe"
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
                    <Lock className="h-5 w-5" style={{ color: '#94a3b8' }} />
                  </div>
                  <input
                    key={mounted ? (showPassword ? 'text' : 'password') : 'initial'}
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

                {/* Password Requirements */}
                {password && (
                  <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="text-xs font-medium mb-2" style={{ color: '#64748b' }}>
                      Password must contain:
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {passwordStrength.length ? (
                          <Check className="w-4 h-4" style={{ color: '#10b981' }} />
                        ) : (
                          <X className="w-4 h-4" style={{ color: '#ef4444' }} />
                        )}
                        <span className="text-xs" style={{ color: passwordStrength.length ? '#10b981' : '#64748b' }}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordStrength.uppercase ? (
                          <Check className="w-4 h-4" style={{ color: '#10b981' }} />
                        ) : (
                          <X className="w-4 h-4" style={{ color: '#ef4444' }} />
                        )}
                        <span className="text-xs" style={{ color: passwordStrength.uppercase ? '#10b981' : '#64748b' }}>
                          One uppercase letter (A-Z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordStrength.lowercase ? (
                          <Check className="w-4 h-4" style={{ color: '#10b981' }} />
                        ) : (
                          <X className="w-4 h-4" style={{ color: '#ef4444' }} />
                        )}
                        <span className="text-xs" style={{ color: passwordStrength.lowercase ? '#10b981' : '#64748b' }}>
                          One lowercase letter (a-z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordStrength.number ? (
                          <Check className="w-4 h-4" style={{ color: '#10b981' }} />
                        ) : (
                          <X className="w-4 h-4" style={{ color: '#ef4444' }} />
                        )}
                        <span className="text-xs" style={{ color: passwordStrength.number ? '#10b981' : '#64748b' }}>
                          One number (0-9)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordStrength.special ? (
                          <Check className="w-4 h-4" style={{ color: '#10b981' }} />
                        ) : (
                          <X className="w-4 h-4" style={{ color: '#ef4444' }} />
                        )}
                        <span className="text-xs" style={{ color: passwordStrength.special ? '#10b981' : '#64748b' }}>
                          One special character (!@#$%^&*...)
                        </span>
                      </div>
                    </div>

                    {/* Strength Bar */}
                    <div className="mt-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className="h-1 flex-1 rounded-full transition-colors"
                            style={{
                              backgroundColor: level <= passwordStrength.score
                                ? passwordStrength.score <= 2 ? '#ef4444'
                                : passwordStrength.score === 3 ? '#f59e0b'
                                : passwordStrength.score === 4 ? '#3b82f6'
                                : '#10b981'
                                : '#e2e8f0'
                            }}
                          />
                        ))}
                      </div>
                      <div className="text-xs mt-1.5" style={{
                        color: passwordStrength.score <= 2 ? '#ef4444'
                          : passwordStrength.score === 3 ? '#f59e0b'
                          : passwordStrength.score === 4 ? '#3b82f6'
                          : '#10b981'
                      }}>
                        {passwordStrength.score === 0 ? 'Very Weak'
                          : passwordStrength.score === 1 ? 'Very Weak'
                          : passwordStrength.score === 2 ? 'Weak'
                          : passwordStrength.score === 3 ? 'Fair'
                          : passwordStrength.score === 4 ? 'Good'
                          : 'Strong'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

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

              {/* Create Account Button */}
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
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
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Sign In Link */}
            <button
              onClick={() => router.push('/signin')}
              className="block w-full text-center py-3 px-4 rounded-lg font-medium transition-all"
              style={{
                border: '1px solid #cbd5e1',
                color: '#334155',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              Sign in instead
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
          input[name="name"],
          input[name="email"],
          input[name="password"],
          input#name,
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
      </div>
    </>
  );
}