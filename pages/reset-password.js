import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';

// StraturaOS Logo - supports gradient or white color
const StraturaLogo = ({ size = 28, color = "gradient" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {color === "gradient" && (
      <defs>
        <linearGradient id="logoGradientReset" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED"/>
          <stop offset="50%" stopColor="#9333EA"/>
          <stop offset="100%" stopColor="#A855F7"/>
        </linearGradient>
      </defs>
    )}
    <g transform="translate(0,64) scale(0.1,-0.1)" fill={color === "gradient" ? "url(#logoGradientReset)" : color}>
      <path d="M169 567 c-75 -40 -144 -78 -153 -86 -13 -11 -16 -36 -16 -160 0 -80 4 -151 8 -157 4 -6 76 -46 160 -89 l154 -79 145 74 c80 41 152 80 159 88 20 20 20 305 0 324 -19 19 -291 158 -307 157 -8 0 -75 -33 -150 -72z m271 -74 l110 -58 0 -67 c0 -40 -4 -68 -10 -68 -6 0 -56 23 -112 51 l-102 51 28 23 28 22 -31 12 c-27 12 -36 10 -100 -25 -39 -21 -71 -41 -71 -44 0 -3 81 -45 180 -92 99 -48 180 -91 179 -95 0 -4 -49 -32 -108 -62 l-108 -53 -114 58 c-107 55 -114 61 -117 92 -2 18 1 32 8 32 5 0 56 -23 112 -51 l102 -51 35 17 36 17 -148 74 -148 75 3 42 3 42 110 57 c61 32 113 57 117 58 5 0 57 -26 118 -57z"/>
    </g>
  </svg>
);

const EyeIcon = ({ open }) => open ? (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
) : (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const router = useRouter();

  useEffect(() => {
    const tokenFromUrl = router.query.token;
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [router.query.token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Invalid token state
  if (!token) {
    return (
      <>
        <Head>
          <title>Invalid Link - StraturaOS</title>
        </Head>
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md bg-[#12121a] rounded-3xl p-10 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-red-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-white text-2xl font-semibold tracking-tight mb-2">Invalid Reset Link</h1>
            <p className="text-gray-400 text-sm mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-2.5 rounded-lg transition-all text-sm"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Reset Password - StraturaOS</title>
      </Head>

      {/* Dark background with centered card */}
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Main card container */}
        <div className="w-full max-w-[1100px] bg-[#12121a] rounded-3xl overflow-hidden flex min-h-[600px] shadow-2xl">
          
          {/* Left side - Image */}
          <div className="hidden lg:block w-[45%] relative">
            <div className="absolute inset-0">
              <Image
                src="/auth-bg.jpg"
                alt=""
                fill
                className="object-cover"
                quality={90}
                priority
              />
              {/* Subtle bottom fade only - no color overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/20 to-transparent" />
            </div>

            {/* Logo top left - white for contrast */}
            <div className="absolute top-6 left-6 z-10">
              <div className="flex items-center gap-2">
                <StraturaLogo size={24} color="white" />
                <span className="text-white font-semibold">StraturaOS</span>
              </div>
            </div>

            {/* Text overlay */}
            <div className="absolute bottom-16 left-6 right-6 z-10">
              <h2 className="text-white text-3xl font-light leading-tight tracking-tight">
                Almost there,
                <br />
                <span className="font-semibold">Set your new password.</span>
              </h2>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="flex-1 flex items-center justify-center px-8 sm:px-12 lg:px-16 py-12">
            <div className="w-full max-w-sm">
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center gap-2 mb-8">
                <StraturaLogo size={24} />
                <span className="text-white font-semibold">StraturaOS</span>
              </div>

              {message ? (
                /* Success State */
                <div>
                  <div className="w-14 h-14 mb-5 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="text-white text-2xl font-semibold tracking-tight mb-3">
                    Password reset!
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Your password has been successfully reset. Redirecting you to sign in...
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="mb-8">
                    <h1 className="text-white text-3xl font-semibold tracking-tight mb-2">
                      New password
                    </h1>
                    <p className="text-gray-400 text-sm">
                      Enter your new password below.
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="mb-5 text-red-400 text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      {error}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1.5">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full bg-[#1a1a24] border border-gray-800 rounded-lg px-4 py-3 pr-11 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          <EyeIcon open={showPassword} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-sm mb-1.5">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full bg-[#1a1a24] border border-gray-800 rounded-lg px-4 py-3 pr-11 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          <EyeIcon open={showConfirmPassword} />
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {loading ? 'Resetting...' : 'Reset password'}
                    </button>

                    <div className="text-center">
                      <Link href="/signin" className="text-gray-500 hover:text-purple-400 text-sm transition-colors">
                        ← Back to sign in
                      </Link>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}