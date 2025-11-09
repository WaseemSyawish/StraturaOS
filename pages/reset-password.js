import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, GraduationCap, ArrowRight } from 'lucide-react';
import Head from 'next/head';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if no token
  useEffect(() => {
    if (router.isReady && !token) {
      router.push('/signin');
    }
  }, [router.isReady, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const json = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      } else {
        setError(json?.error || 'Failed to reset password. The link may have expired.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null; // Will redirect
  }

  if (success) {
    return (
      <>
        <Head>
          <title>Password Reset Successful - University Planner</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center p-4 bg-white">
          <div className="w-full max-w-md text-center">
            <div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              }}
            >
              <CheckCircle2 className="w-10 h-10" style={{ color: '#ffffff' }} />
            </div>
            <h1 className="text-3xl font-bold mb-3" style={{ color: '#0f172a' }}>
              Password Reset Successful!
            </h1>
            <p className="text-lg mb-6" style={{ color: '#64748b' }}>
              Your password has been updated successfully.
            </p>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Redirecting to sign in page...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Reset Password - University Planner</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
              }}
            >
              <GraduationCap className="w-8 h-8" style={{ color: '#ffffff' }} />
            </div>
            <h1 className="text-4xl font-black mb-2" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Reset Password
            </h1>
            <p style={{ color: '#64748b' }}>
              Enter your new password below
            </p>
          </div>

          {/* Form Card */}
          <div 
            className="rounded-2xl p-8 shadow-xl"
            style={{
              border: '1px solid #e2e8f0',
              background: '#ffffff'
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium mb-2" style={{ color: '#334155' }}>
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5" style={{ color: '#94a3b8' }} />
                  </div>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
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
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs mt-2" style={{ color: '#64748b' }}>
                  Must be at least 8 characters
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium mb-2" style={{ color: '#334155' }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5" style={{ color: '#94a3b8' }} />
                  </div>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div 
                  className="rounded-lg p-4 flex items-start gap-3"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                  <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
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
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="w-5 h-5" style={{ color: '#ffffff' }} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Back to Sign In */}
          <div className="mt-6 text-center">
            <a 
              href="/signin" 
              className="text-sm transition-colors"
              style={{ color: '#64748b' }}
            >
              ← Back to sign in
            </a>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 0.8s linear infinite;
          }
        `}</style>
      </div>
    </>
  );
}
