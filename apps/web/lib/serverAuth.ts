/**
 * Server-side authentication utilities using cookies
 */

import { cookies } from 'next/headers';
import { getCurrentStrapiUser, type StrapiUser } from './strapiAuth';

const TOKEN_COOKIE_NAME = 'strapi_jwt';

/**
 * Get the current session from cookies (server-side)
 */
export async function getServerSession(): Promise<{ user: StrapiUser; token: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) return null;

  const user = await getCurrentStrapiUser(token);
  if (!user) return null;

  return { user, token };
}

/**
 * Get current user (server-side)
 */
export async function getCurrentUser(): Promise<StrapiUser | null> {
  const session = await getServerSession();
  return session?.user || null;
}

/**
 * Check if user has specific role
 */
export async function hasRole(roleName: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role?.name === roleName || user?.role?.type === roleName;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roleNames: string[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user?.role) return false;

  return roleNames.includes(user.role.name) || roleNames.includes(user.role.type);
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<StrapiUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Require specific role - throws if user doesn't have role
 */
export async function requireRole(roleName: string): Promise<StrapiUser> {
  const user = await requireAuth();
  if (user.role?.name !== roleName && user.role?.type !== roleName) {
    throw new Error('Insufficient permissions');
  }
  return user;
}

/**
 * Check if account is active
 */
export async function isAccountActive(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.accountStatus === 'active';
}
