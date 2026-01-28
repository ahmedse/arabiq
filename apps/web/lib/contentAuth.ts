/**
 * Content Access Control
 * Helper functions to check if a user can access specific content
 */

import type { StrapiUser } from './strapiAuth';

/**
 * Check if user can access content based on role and permissions
 */
export async function isContentAccessibleByUser(
  user: StrapiUser | null,
  requiredRoles?: string[]
): Promise<boolean> {
  // If no roles required, content is public
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // User must be authenticated
  if (!user) {
    return false;
  }

  // Check if user's role is in the required roles
  if (user.role && requiredRoles.includes(user.role.name)) {
    return true;
  }

  return false;
}

/**
 * Check if user can access a specific demo
 */
export async function canAccessDemo(
  user: StrapiUser | null,
  demoId: number
): Promise<boolean> {
  if (!user) return false;

  // Check if user has explicit access to this demo
  if (user.demoAccess && user.demoAccess.some(demo => demo.id === demoId)) {
    return true;
  }

  return false;
}
