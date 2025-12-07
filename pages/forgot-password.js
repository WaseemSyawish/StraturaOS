import { useState } from 'react';
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
        <linearGradient id="logoGradientForgot" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED"/>
          <stop offset="50%" stopColor="#9333EA"/>
          <stop offset="100%" stopColor="#A855F7"/>
        </linearGradient>
      </defs>
    )}
    <g transform="translate(0,64) scale(0.1,-0.1)" fill={color === "gradient" ? "url(#logoGradientForgot)" : color}>
      <path d="M169 567 c-75 -40 -144 -78 -153 -86 -13 -11 -16 -36 -16 -160 0 -80 4 -151 8 -157 4 -6 76 -46 160 -89 l154 -79 145 74 c80 41 152 80 159 88 20 20 20 305 0 324 -19 19 -291 158 -307 157 -8 0 -75 -33 -150 -72z m271 -74 l110 -58 0 -67 c0 -40 -4 -68 -10 -68 -6 0 -56 23 -112 51 l-102 51 28 23 28 22 -31 12 c-27 12 -36 10 -100 -25 -39 -21 -71 -41 -71 -44 0 -3 81 -45 180 -92 99 -48 180 -91 179 -95 0 -4 -49 -32 -108 -62 l-108 -53 -114 58 c-107 55 -114 61 -117 92 -2 18 1 32 8 32 5 0 56 -23 112 -51 l102 -51 35 17 36 17 -148 74 -148 75 3 42 3 42 110 57 c61 32 113 57 117 58 5 0 57 -26 118 -57z"/>
    </g>
  </svg>
);

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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

            {/* Back to website button */}
            <Link 
              href="/landing" 
              className="absolute top-6 right-6 z-10 flex items-center gap-1.5 text-white/70 hover:text-white text-sm bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full backdrop-blur-sm transition-all"
            >
              Back to website
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Text overlay */}
            <div className="absolute bottom-16 left-6 right-6 z-10">
              <h2 className="text-white text-3xl font-light leading-tight tracking-tight">
                Forgot your password?
                <br />
                <span className="font-semibold">We've got you.</span>
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

              {success ? (
                /* Success State */
                <div>
                  <div className="w-14 h-14 mb-5 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="text-white text-2xl font-semibold tracking-tight mb-3">
                    Check your email
                  </h1>
                  <p className="text-gray-400 text-sm mb-6">
                    We've sent a password reset link to <span className="text-white font-medium">{email}</span>
                  </p>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                      Didn't receive the email?{' '}
                      <button
                        onClick={() => setSuccess(false)}
                        className="text-purple-400 hover:text-purple-300 font-medium"
                      >
                        Try again
                      </button>
                    </p>
                    <Link
                      href="/signin"
                      className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to sign in
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="mb-8">
                    <h1 className="text-white text-3xl font-semibold tracking-tight mb-2">
                      Reset password
                    </h1>
                    <p className="text-gray-400 text-sm">
                      Enter your email and we'll send you a reset link.
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
                      <label className="block text-gray-400 text-sm mb-1.5">Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full bg-[#1a1a24] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isLoading ? 'Sending...' : 'Send reset link'}
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
