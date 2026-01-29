/**
 * Strapi-backed auth helper for server routes
 * Returns a session-like object { user, token } or null when unauthenticated.
 */
import { getServerSession } from './lib/serverAuth';

export async function auth() {
  const session = await getServerSession();
  if (!session) return null;

  // Normalize session shape expected by existing code (user.id, user.email)
  const { user, token } = session;
  return {
    user: {
      ...user,
      id: String(user.id),
      email: user.email,
    },
    token,
  };
}

/**
 * Server-side signOut helper — deletes Strapi JWT cookie and returns redirect target.
 * Use in server actions: `await signOut({ redirectTo: '/somewhere' })`.
 */
export async function signOut({ redirectTo } = { redirectTo: '/' }) {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.delete(process.env.STRAPI_JWT_COOKIE_NAME || 'strapi_jwt');
  return { redirectTo };
}

export default auth;
