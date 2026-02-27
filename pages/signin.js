import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

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
        <linearGradient id="logoGradientAuth" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED"/>
          <stop offset="50%" stopColor="#9333EA"/>
          <stop offset="100%" stopColor="#A855F7"/>
        </linearGradient>
      </defs>
    )}
    <g transform="translate(0,64) scale(0.1,-0.1)" fill={color === "gradient" ? "url(#logoGradientAuth)" : color}>
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

// Carousel slides
const carouselSlides = [
  { image: '/auth-bg.jpg', title: 'Organize Your,', subtitle: 'Academic Life' },
  { image: '/auth-bg.jpg', title: 'Track Your,', subtitle: 'Progress Daily' },
  { image: '/auth-bg.jpg', title: 'Achieve Your,', subtitle: 'Goals Faster' },
];

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Mount animation trigger
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      router.push('/overview');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/overview' });
  };

  return (
    <>
      <Head>
        <title>Sign In - StraturaOS</title>
      </Head>

      {/* Dark background with centered card */}
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Main card container */}
        <div className={`w-full max-w-[1100px] bg-[#12121a] rounded-3xl overflow-hidden flex min-h-[680px] shadow-2xl transition-all duration-700 ease-out ${mounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-4'}`}>
          
          {/* Left side - Image */}
          <div className="hidden lg:block w-[45%] relative overflow-hidden">
            <div className="absolute inset-0">
              {carouselSlides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                    index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                  }`}
                >
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    className="object-cover"
                    quality={90}
                    priority={index === 0}
                  />
                  {/* Subtle bottom fade only - no color overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/20 to-transparent" />
                </div>
              ))}
            </div>

            {/* Logo top left - white for contrast */}
            <div className={`absolute top-6 left-6 z-10 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}>
              <div className="flex items-center gap-2">
                <StraturaLogo size={24} color="white" />
                <span className="text-white font-semibold">StraturaOS</span>
              </div>
            </div>

            {/* Back to website button */}
            <Link 
              href="/landing" 
              className={`absolute top-6 right-6 z-10 flex items-center gap-1.5 text-white/70 hover:text-white text-sm bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full backdrop-blur-sm transition-all duration-700 delay-400 hover:scale-105 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}
            >
              Back to website
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Text overlay */}
            <div className="absolute bottom-16 left-6 right-6 z-10">
              {carouselSlides.map((slide, index) => (
                <div
                  key={index}
                  className={`transition-all duration-700 ease-out ${
                    index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 absolute'
                  }`}
                >
                  <h2 className="text-white text-3xl font-light leading-tight tracking-tight">
                    {slide.title}
                    <br />
                    <span className="font-semibold">{slide.subtitle}</span>
                  </h2>
                </div>
              ))}
            </div>

            {/* Carousel dots */}
            <div className="absolute bottom-6 left-6 z-10 flex gap-1.5">
              {carouselSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    index === currentSlide 
                      ? 'w-6 bg-white' 
                      : 'w-3 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right side - Form */}
          <div className="flex-1 flex items-center justify-center px-8 sm:px-12 lg:px-16 py-12">
            <div className="w-full max-w-sm">
              {/* Mobile logo */}
              <div className={`lg:hidden flex items-center gap-2 mb-8 transition-all duration-500 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                <StraturaLogo size={24} />
                <span className="text-white font-semibold">StraturaOS</span>
              </div>

              {/* Header */}
              <div className={`mb-8 transition-all duration-600 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <h1 className="text-white text-3xl font-semibold tracking-tight mb-2">
                  Welcome back
                </h1>
                <p className="text-gray-400 text-sm">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">
                    Sign up
                  </Link>
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 text-red-400 text-sm flex items-center gap-2 animate-[slideDown_200ms_ease-out]">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className={`transition-all duration-600 delay-[400ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <label className="block text-gray-400 text-sm mb-1.5">Email</label>
                  <div className={`relative rounded-lg transition-all duration-200 ${focusedField === 'email' ? 'ring-2 ring-purple-500/30' : ''}`}>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your email"
                      className="w-full bg-[#1a1a24] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className={`transition-all duration-600 delay-[500ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <label className="block text-gray-400 text-sm mb-1.5">Password</label>
                  <div className={`relative rounded-lg transition-all duration-200 ${focusedField === 'password' ? 'ring-2 ring-purple-500/30' : ''}`}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your password"
                      className="w-full bg-[#1a1a24] border border-gray-800 rounded-lg px-4 py-3 pr-11 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                  <div className="mt-2 text-right">
                    <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-purple-400 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <div className={`transition-all duration-600 delay-[600ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-sm relative overflow-hidden group"
                  >
                    <span className={`inline-flex items-center gap-2 transition-all duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                      Sign in
                    </span>
                    {isLoading && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>

                <div className={`transition-all duration-600 delay-[700ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <div className="relative flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-gray-800" />
                    <span className="text-gray-500 text-xs">Or sign in with</span>
                    <div className="flex-1 h-px bg-gray-800" />
                  </div>
                </div>

                <div className={`transition-all duration-600 delay-[800ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-2 bg-[#1a1a24] border border-gray-800 hover:border-gray-600 hover:bg-[#1e1e2a] active:scale-[0.97] text-white py-2.5 rounded-lg transition-all duration-200 text-sm group"
                  >
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
