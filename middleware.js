import { NextResponse } from 'next/server';

// Phase A middleware: protect a small set of pages by ensuring a demo `userId` cookie exists.
// This is intentionally minimal for local/dev use. Do not rely on this for production auth.

const PROTECTED_PATHS = ['/overview', '/calendar', '/timetable', '/modules', '/grades', '/attendance', '/settings', '/profile'];

export function middleware(req) {
  try {
    const url = req.nextUrl.clone();
    const { pathname } = url;

    // Block direct browser access to API routes (but allow programmatic fetch calls)
    // Only block if user is directly navigating to the API route in browser address bar
    if (pathname.startsWith('/api/')) {
      const referer = req.headers.get('referer') || '';
      const acceptHeader = req.headers.get('accept') || '';
      
      // If it's a browser navigation (HTML page request) with no referer, block it
      // But allow if there's a referer (means it's from our app) or if accept is not HTML
      if (acceptHeader.includes('text/html') && !referer) {
        return new NextResponse('API route not accessible directly', { status: 403 });
      }
      // Allow all other API requests (including fetch from our app)
      return NextResponse.next();
    }

    // Allow non-protected paths through
    if (!PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return NextResponse.next();

    // Synchronously check for session cookies. We accept next-auth token names
    // as well as our dev helper cookies (`session`, `userId`, `debug_userId`) so
    // that the local password sign-in helper and token-based endpoints all work
    // together during development.
    try {
      if (req.cookies && req.cookies.get) {
        const na1 = req.cookies.get('next-auth.session-token');
        const na2 = req.cookies.get('__Secure-next-auth.session-token');
        const s = req.cookies.get('session');
        const uid = req.cookies.get('userId');
        const dbg = req.cookies.get('debug_userId');
        if (na1 || na2 || s || uid || dbg) return NextResponse.next();
      }
      // Fallback: check the raw Cookie header for presence of known cookie names
      const raw = req.headers.get('cookie') || '';
      if (
        raw.includes('next-auth.session-token=') ||
        raw.includes('__Secure-next-auth.session-token=') ||
        raw.includes('session=') ||
        raw.includes('userId=') ||
        raw.includes('debug_userId=')
      ) {
        return NextResponse.next();
      }
    } catch (e) {
      // ignore and redirect
    }

    url.pathname = '/signin';
    // preserve returnTo param so user can be redirected back after sign-in
    url.searchParams.set('returnTo', req.nextUrl.pathname);
    // Dev-only logging to help trace auth redirects
    try { if (process.env.NODE_ENV !== 'production') console.log('[middleware] redirecting unauthenticated request to /signin, returnTo=', req.nextUrl.pathname); } catch (e) {}
    return NextResponse.redirect(url);
  } catch (err) {
    // Fail open on unexpected errors to avoid blocking the app during dev
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/overview', '/calendar', '/timetable', '/modules', '/grades', '/attendance', '/settings', '/profile'],
};
