/**
 * Strapi Authentication Utilities for Next.js
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export interface StrapiUser {
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  phone?: string;
  country?: string;
  company?: string;
  salesContactAllowed?: boolean;
  accountStatus?: 'pending' | 'active' | 'suspended';
  displayName?: string;
  lastLoginAt?: string;
  role?: {
    id: number;
    name: string;
    description?: string;
    type: string;
  };
  // demoAccess removed - demos are handled via accessLevel and getUserDemos()
}

export interface LoginResponse {
  jwt: string;
  user: StrapiUser;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  phone: string;
  country?: string;
  company?: string;
  salesContactAllowed?: boolean;
  displayName?: string;
}

/**
 * Login with email/username and password
 */
export async function strapiLogin(
  identifier: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Login failed');
  }

  return res.json();
}

/**
 * Register a new user
 */
export async function strapiRegister(data: RegisterData): Promise<LoginResponse | { user: StrapiUser; message: string }> {
  const res = await fetch(`${STRAPI_URL}/api/custom-auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Registration failed');
  }

  return res.json();
}

/**
 * Logout (client-side only - clears session cookie)
 */
export async function strapiLogout(): Promise<void> {
  // Clear the auth cookie by calling the logout API route
  await fetch('/api/auth/logout', { method: 'POST' });
}

/**
 * Get current user from JWT token
 */
export async function getCurrentStrapiUser(token: string): Promise<StrapiUser | null> {
  if (!token) return null;

  try {
    const res = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Request password reset
 */
export async function strapiRequestPasswordReset(email: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${STRAPI_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Password reset request failed');
  }

  return res.json();
}

/**
 * Reset password with token
 */
export async function strapiResetPassword(
  code: string,
  password: string,
  passwordConfirmation: string
): Promise<LoginResponse> {
  const res = await fetch(`${STRAPI_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, password, passwordConfirmation }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Password reset failed');
  }

  return res.json();
}

/**
 * Update user profile
 */
export async function strapiUpdateProfile(
  token: string,
  data: Partial<Pick<StrapiUser, 'displayName' | 'country' | 'company' | 'salesContactAllowed'>>
): Promise<StrapiUser> {
  const res = await fetch(`${STRAPI_URL}/api/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Profile update failed');
  }

  return res.json();
}

/**
 * Check if user can access a demo
 */
export async function checkDemoAccess(token: string, demoId: number): Promise<boolean> {
  try {
    const res = await fetch(`${STRAPI_URL}/api/demos/${demoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get all accessible demos for user
 */
export async function getUserDemos(token: string): Promise<any[]> {
  try {
    const res = await fetch(`${STRAPI_URL}/api/demos?populate[0]=featuredImage&populate[1]=ownerUser`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to get user demos:', error);
    return [];
  }
}

/**
 * Server-side JWT verification
 */
export async function verifyJWT(token: string): Promise<{ valid: boolean; user?: StrapiUser }> {
  try {
    const user = await getCurrentStrapiUser(token);
    return { valid: !!user, user: user || undefined };
  } catch (error) {
    return { valid: false };
  }
}
