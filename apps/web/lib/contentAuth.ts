import { userHasAnyRole } from '@/lib/roles';

/**
 * Returns true if the content (with allowedRoles array) is accessible by the user.
 * - If allowedRoles is empty -> public
 * - If userId missing and allowedRoles present -> not allowed
 * - Otherwise check if user has any of the allowed roles
 */
export async function isContentAccessibleByUser(userId: string | undefined | null, allowedRoles: string[] | undefined) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userId) return false;
  return userHasAnyRole(userId, allowedRoles);
}