import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import { LogOut, ArrowRight, Home, CheckCircle2, AlertCircle } from 'lucide-react';

// StraturaOS Logo SVG Component
const StraturaLogo = ({ size = 48, color = "white" }) => (
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
        }, 2500);
      } catch (e) {
        setError(true);
        setSigningOut(false);
      }
    })();
  }, [router]);

  return (
    <>
      <Head>
        <title>Signed Out — StraturaOS</title>
      </Head>
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); }
          50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.5); }
        }
        .animate-spin-slow {
          animation: spin 1.5s linear infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
      
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: '#0a0a0f',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/landing" className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-2xl shadow-purple-500/20 transition-transform hover:scale-105" style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)'
            }}>
              <StraturaLogo size={48} color="white" />
            </Link>
            <h2 className="text-white/60 text-sm font-medium tracking-wide">STRATURAOS</h2>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8 text-center border" style={{
            background: 'linear-gradient(135deg, rgba(18, 18, 26, 0.9) 0%, rgba(15, 15, 23, 0.95) 100%)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03)'
          }}>
            {signingOut ? (
              <>
                {/* Signing out state */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center animate-pulse-glow" style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)'
                }}>
                  <LogOut className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold mb-3 text-white">
                  Signing you out...
                </h1>
                <p className="text-gray-400 mb-6">
                  Please wait a moment
                </p>
                <div className="flex justify-center">
                  <div className="w-10 h-10 border-3 rounded-full animate-spin-slow" style={{
                    borderWidth: '3px',
                    borderColor: 'rgba(168, 85, 247, 0.2)',
                    borderTopColor: '#a855f7'
                  }} />
                </div>
              </>
            ) : error ? (
              <>
                {/* Error state */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{
                  background: 'rgba(239, 68, 68, 0.15)'
                }}>
                  <AlertCircle className="w-7 h-7 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold mb-3 text-white">
                  Something went wrong
                </h1>
                <p className="text-gray-400 mb-8">
                  We couldn't sign you out properly. Please try again.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
                    }}
                  >
                    Try Again
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <Link
                    href="/landing"
                    className="w-full py-3.5 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border text-gray-300 hover:text-white hover:bg-white/5"
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.1)',
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
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{
                  background: 'rgba(34, 197, 94, 0.15)'
                }}>
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold mb-3 text-white">
                  You've been signed out
                </h1>
                <p className="text-gray-400 mb-3">
                  Thanks for using StraturaOS. See you next time!
                </p>
                
                {/* Auto-redirect notice */}
                <p className="text-sm text-gray-500 mb-8">
                  Redirecting to home page...
                </p>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/signin"
                    className="w-full py-3.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
                    }}
                  >
                    Sign In Again
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/landing"
                    className="w-full py-3.5 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border text-gray-300 hover:text-white hover:bg-white/5"
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.1)',
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
          <p className="text-center mt-8 text-sm text-gray-600">
            © {new Date().getFullYear()} StraturaOS
          </p>
        </div>
      </div>
    </>
  );
}
