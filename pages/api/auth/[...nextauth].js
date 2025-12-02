import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';

// Security: require NEXTAUTH_SECRET in production
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required in production for NextAuth');
}

// Ensure NEXTAUTH_URL has protocol
const nextAuthUrl = process.env.NEXTAUTH_URL 
  ? (process.env.NEXTAUTH_URL.startsWith('http') ? process.env.NEXTAUTH_URL : `https://${process.env.NEXTAUTH_URL}`)
  : undefined;

const isDev = process.env.NODE_ENV !== 'production';

export const authOptions = {
  url: nextAuthUrl,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase()?.trim();
        const password = credentials?.password;
        
        if (!email || !password) return null;
        
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        
        if (!user.password_hash) {
          // No password set (legacy/demo user) - deny by default for security
          return null;
        }
        
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;
        
        return { id: user.id, name: user.name || null, email: user.email };
      }
    })
  ],
  session: { 
    strategy: 'jwt', 
    maxAge: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24 // Update session every 24 hours
  },
  useSecureCookies: !isDev,
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id ? String(user.id) : token.userId;
        token.name = user.name || token.name;
        token.email = user.email || token.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = session.user || {};
      session.user.id = token.userId;
      session.user.name = token.name || session.user.name;
      session.user.email = token.email || session.user.email;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || (isDev ? 'dev-nextauth-secret' : undefined),
  cookies: {
    sessionToken: {
      name: isDev ? 'next-auth.session-token' : '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        secure: !isDev,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      }
    },
    csrfToken: {
      name: isDev ? 'next-auth.csrf-token' : '__Host-next-auth.csrf-token',
      options: {
        httpOnly: false,
        secure: !isDev,
        sameSite: 'lax',
        path: '/',
      }
    }
  }
};

export default NextAuth(authOptions);
