"use client";

import { AuthProvider } from '@/contexts/AuthContext';

// Wrap app in AuthProvider so client components can access auth state
export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
