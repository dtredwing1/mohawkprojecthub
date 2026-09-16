import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - /api/auth (NextAuth endpoints)
     * - /api/v1/agent (Autonomous AI Agent REST API - authenticated by x-api-key)
     * - /auth/signin, /auth/error (Authentication pages)
     * - /_next/static, /_next/image, /favicon.ico (Static assets)
     */
    '/((?!api/auth|api/v1/agent|auth/signin|auth/error|_next/static|_next/image|favicon.ico).*)',
  ],
};
