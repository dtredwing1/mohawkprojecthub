import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import {
  getUser,
  getUsers,
  upsertUser,
  getCollaboratorInvites,
} from '@/lib/storage';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: (process.env.GOOGLE_CLIENT_ID || '').trim(),
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  debug: true,
  logger: {
    error(code, metadata) {
      console.error(`[NextAuth Error] ${code}:`, metadata);
    },
    warn(code) {
      console.warn(`[NextAuth Warn] ${code}`);
    },
    debug(code, metadata) {
      console.log(`[NextAuth Debug] ${code}:`, metadata);
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (!user.email) {
          console.warn('[NextAuth signIn] Missing user.email');
          return false;
        }
        const email = user.email.toLowerCase().trim();

        // Check if user is already an active user
        const existingUser = await getUser(email);
        if (existingUser && existingUser.status !== 'disabled') {
          await upsertUser({
            id: user.id || existingUser.id,
            email,
            name: user.name || existingUser.name,
            image: user.image || existingUser.image,
          });
          return true;
        }

        // Check if this is the very first user ever (First Admin Bootstrapping Rule)
        const allUsers = await getUsers();
        if (allUsers.length === 0) {
          console.log(`[NextAuth] Bootstrapping first user as Root Admin: ${email}`);
          await upsertUser({
            id: user.id,
            email,
            name: user.name || email.split('@')[0],
            image: user.image || undefined,
            role: 'admin',
            assignedProjectIds: ['*'],
          });
          return true;
        }

        // Check explicit ADMIN_EMAIL
        const explicitAdmin = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
        if (explicitAdmin && email === explicitAdmin) {
          console.log(`[NextAuth] Matching ADMIN_EMAIL for user: ${email}`);
          await upsertUser({
            id: user.id,
            email,
            name: user.name || email.split('@')[0],
            image: user.image || undefined,
            role: 'admin',
            assignedProjectIds: ['*'],
          });
          return true;
        }

        // Check collaborator invites
        const invites = await getCollaboratorInvites();
        const matchingInvite = invites.find(i => i.email.toLowerCase() === email);
        if (matchingInvite) {
          console.log(`[NextAuth] Matching invite found for: ${email}`);
          await upsertUser({
            id: user.id,
            email,
            name: user.name || email.split('@')[0],
            image: user.image || undefined,
            role: matchingInvite.role,
            assignedProjectIds: matchingInvite.assignedProjectIds,
          });
          return true;
        }

        // Check ALLOWED_EMAILS or ALLOWED_DOMAINS env vars
        const allowedEmails = (process.env.ALLOWED_EMAILS || '')
          .split(',')
          .map(e => e.trim().toLowerCase())
          .filter(Boolean);

        const allowedDomains = (process.env.ALLOWED_DOMAINS || '')
          .split(',')
          .map(d => d.trim().toLowerCase().replace('@', ''))
          .filter(Boolean);

        const domain = email.split('@')[1];
        if (allowedEmails.includes(email) || (domain && allowedDomains.includes(domain))) {
          console.log(`[NextAuth] Domain/email allowlist matched for: ${email}`);
          await upsertUser({
            id: user.id,
            email,
            name: user.name || email.split('@')[0],
            image: user.image || undefined,
            role: 'member',
            assignedProjectIds: ['proj-mohawk'],
          });
          return true;
        }

        console.warn(`[NextAuth] Unauthorized login attempt blocked for: ${email}`);
        return false;
      } catch (err) {
        console.error('[NextAuth] Exception in signIn callback:', err);
        return false;
      }
    },

    async jwt({ token }) {
      if (token.email) {
        const profile = await getUser(token.email);
        if (profile) {
          (token as any).role = profile.role;
          (token as any).assignedProjectIds = profile.assignedProjectIds;
          (token as any).defaultProjectId = profile.defaultProjectId;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = (token as any).role || 'member';
        (session.user as any).assignedProjectIds = (token as any).assignedProjectIds || ['*'];
        (session.user as any).defaultProjectId = (token as any).defaultProjectId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: (process.env.NEXTAUTH_SECRET || 'hub-prod-jwt-secret-key-32-chars-long-secure').trim(),
};
