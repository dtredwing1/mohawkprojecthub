import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      // If whitelist is defined, enforce it
      const allowedEmails = (process.env.ALLOWED_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);

      const allowedDomains = (process.env.ALLOWED_DOMAINS || '')
        .split(',')
        .map(d => d.trim().toLowerCase().replace('@', ''))
        .filter(Boolean);

      // If no restrictions are configured, allow all sign-ins
      if (allowedEmails.length === 0 && allowedDomains.length === 0) {
        return true;
      }

      if (!user.email) return false;
      const email = user.email.toLowerCase();
      const domain = email.split('@')[1];

      if (allowedEmails.includes(email)) return true;
      if (domain && allowedDomains.includes(domain)) return true;

      console.warn(`Access denied for email: ${email}`);
      return false;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-super-secret-hub-key-change-in-prod',
};
