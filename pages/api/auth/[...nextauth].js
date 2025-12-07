import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
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
    // Google OAuth Provider
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),
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
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === 'google') {
        try {
          const email = user.email?.toLowerCase()?.trim();
          if (!email) return false;
          
          // Check if user exists
          let dbUser = await prisma.user.findUnique({ where: { email } });
          
          if (!dbUser) {
            // Create new user for Google OAuth
            dbUser = await prisma.user.create({
              data: {
                email,
                name: user.name || profile?.name || email.split('@')[0],
                password_hash: null, // No password for OAuth users
              }
            });
          }
          
          // Attach the database user ID
          user.id = dbUser.id;
          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id ? String(user.id) : token.userId;
        token.name = user.name || token.name;
        token.email = user.email || token.email;
      }
      // For OAuth, we need to fetch the user ID from the database
      if (account?.provider === 'google' && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({ 
            where: { email: token.email.toLowerCase() } 
          });
          if (dbUser) {
            token.userId = String(dbUser.id);
          }
        } catch (error) {
          console.error('JWT callback error:', error);
        }
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
