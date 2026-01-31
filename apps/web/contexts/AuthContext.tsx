"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { getCurrentStrapiUser, strapiLogin, strapiRegister } from '@/lib/strapiAuth';

interface StrapiUser {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  phone?: string;
  country?: string;
  company?: string;
  salesContactAllowed?: boolean;
  accountStatus?: string;
  lastLogin?: string;
  provider?: string;
  confirmed?: boolean;
  blocked?: boolean;
  role?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextValue {
  user: StrapiUser | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<any>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StrapiUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = Cookies.get('strapi_jwt');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/custom-auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return;
      }

      // If unauthorized, clear cookie to prevent retry storm and treat user as logged out
      if (res.status === 401) {
        Cookies.remove('strapi_jwt');
        setUser(null);
        return;
      }

      // Other non-ok statuses: log for debugging
      try {
        const errBody = await res.json();
        console.error('Failed to refresh user:', res.status, errBody);
      } catch (_) {
        console.error('Failed to refresh user:', res.status);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = Cookies.get('strapi_jwt');
      if (!token) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentStrapiUser(token);
        // If the token is invalid the helper returns null — remove cookie to stop retrying
        if (!currentUser) {
          Cookies.remove('strapi_jwt');
          if (mounted) setUser(null);
        } else {
          if (mounted) setUser(currentUser);
        }
      } catch (e) {
        console.error('Auth bootstrap failed', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (identifier: string, password: string) => {
    const { jwt, user } = await strapiLogin(identifier, password);
    // store cookie
    Cookies.set('strapi_jwt', jwt, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    setUser(user as StrapiUser);
  };

  const logout = () => {
    Cookies.remove('strapi_jwt');
    setUser(null);
  };

  const register = async (data: any) => {
    const res = await strapiRegister(data);
    if ((res as any).jwt) {
      Cookies.set('strapi_jwt', (res as any).jwt, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
      setUser((res as any).user as StrapiUser);
    }
    return res;
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    logout,
    register,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
