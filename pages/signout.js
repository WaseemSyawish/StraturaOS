import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import { LogOut, ArrowRight, Home } from 'lucide-react';

// StraturaOS Logo SVG Component
const StraturaLogo = ({ size = 48, color = "gradient" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {color === "gradient" && (
      <defs>
        <linearGradient id="logoGradientSignout" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3730A3"/>
          <stop offset="50%" stopColor="#4F46E5"/>
          <stop offset="100%" stopColor="#6366F1"/>
        </linearGradient>
      </defs>
    )}
    <g transform="translate(0,64) scale(0.1,-0.1)" fill={color === "gradient" ? "url(#logoGradientSignout)" : color}>
      <path d="M169 567 c-75 -40 -144 -78 -153 -86 -13 -11 -16 -36 -16 -160 0 -80 4 -151 8 -157 4 -6 76 -46 160 -89 l154 -79 145 74 c80 41 152 80 159 88 20 20 20 305 0 324 -19 19 -291 158 -307 157 -8 0 -75 -33 -150 -72z m271 -74 l110 -58 0 -67 c0 -40 -4 -68 -10 -68 -6 0 -56 23 -112 51 l-102 51 28 23 28 22 -31 12 c-27 12 -36 10 -100 -25 -39 -21 -71 -41 -71 -44 0 -3 81 -45 180 -92 99 -48 180 -91 179 -95 0 -4 -49 -32 -108 -62 l-108 -53 -114 58 c-107 55 -114 61 -117 92 -2 18 1 32 8 32 5 0 56 -23 112 -51 l102 -51 35 17 36 17 -148 74 -148 75 3 42 3 42 110 57 c61 32 113 57 117 58 5 0 57 -26 118 -57z"/>
    </g>
  </svg>
);

export default function SignOut() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Clear local demo cookies first
        try {
          await fetch('/api/auth/local-signout', { method: 'POST' });
        } catch (e) {
          // ignore
        }
        
        // Sign out via next-auth
        await signOut({ redirect: false });
        setSigningOut(false);
        
        // Auto-redirect after a short delay
        setTimeout(() => {
          router.replace('/landing');
        }, 2000);
      } catch (e) {
        setError(true);
        setSigningOut(false);
      }
    })();
  }, [router]);

  // Force light mode for this page
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    if (hadDark) root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  return (
    <>
      <Head>
        <title>Signed Out — StraturaOS</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 50%, #f5f3ff 100%)'
      }}>
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-lg" style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
            }}>
              <StraturaLogo size={48} color="white" />
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8 shadow-xl text-center" style={{
            background: '#ffffff',
            border: '1px solid rgba(168, 85, 247, 0.1)',
            boxShadow: '0 20px 50px rgba(168, 85, 247, 0.08)'
          }}>
            {signingOut ? (
              <>
                {/* Signing out state */}
                <div className="w-12 h-12 mx-auto mb-6 rounded-full flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                }}>
                  <LogOut className="w-6 h-6 text-white animate-pulse" />
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: '#0f172a' }}>
                  Signing you out...
                </h1>
                <p style={{ color: '#64748b' }}>
                  Please wait a moment
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" style={{
                    borderWidth: '3px'
                  }} />
                </div>
              </>
            ) : error ? (
              <>
                {/* Error state */}
                <div className="w-12 h-12 mx-auto mb-6 rounded-full flex items-center justify-center bg-red-100">
                  <LogOut className="w-6 h-6 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: '#0f172a' }}>
                  Something went wrong
                </h1>
                <p className="mb-6" style={{ color: '#64748b' }}>
                  We couldn't sign you out properly. Please try again.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
                    }}
                  >
                    Try Again
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <Link
                    href="/landing"
                    className="w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border"
                    style={{
                      borderColor: '#e2e8f0',
                      color: '#64748b'
                    }}
                  >
                    <Home className="w-4 h-4" />
                    Go to Home
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Success state */}
                <div className="w-12 h-12 mx-auto mb-6 rounded-full flex items-center justify-center bg-green-100">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: '#0f172a' }}>
                  You've been signed out
                </h1>
                <p className="mb-6" style={{ color: '#64748b' }}>
                  Thanks for using StraturaOS. See you next time!
                </p>
                
                {/* Auto-redirect notice */}
                <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>
                  Redirecting to home page...
                </p>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/signin"
                    className="w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
                    }}
                  >
                    Sign In Again
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/landing"
                    className="w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border hover:bg-slate-50"
                    style={{
                      borderColor: '#e2e8f0',
                      color: '#64748b'
                    }}
                  >
                    <Home className="w-4 h-4" />
                    Back to Home
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <p className="text-center mt-8 text-sm" style={{ color: '#94a3b8' }}>
            © {new Date().getFullYear()} StraturaOS
          </p>
        </div>
      </div>
    </>
  );
}
