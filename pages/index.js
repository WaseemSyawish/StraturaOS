import { getToken } from 'next-auth/jwt';
import { parse } from 'cookie';

// Minimal index page: authenticated users -> /overview, otherwise -> /landing
export async function getServerSideProps(ctx) {
  const { req } = ctx;
  
  // Check for NextAuth session token
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token) {
      // User has valid session, redirect to overview
      return { redirect: { destination: '/overview', permanent: false } };
    }
  } catch (e) {
    // Token check failed, continue to check cookies
  }
  
  // Check for dev/legacy session cookies
  const cookieHeader = req.headers.cookie || '';
  const cookies = parse(cookieHeader);
  const hasSessionCookie = !!(cookies['session'] || cookies['userId'] || cookies['debug_userId']);
  
  if (hasSessionCookie) {
    // User has legacy session, redirect to overview
    return { redirect: { destination: '/overview', permanent: false } };
  }
  
  // No session found, send to landing page
  return { redirect: { destination: '/landing', permanent: false } };
}

export default function Index() {
  return null;
}
