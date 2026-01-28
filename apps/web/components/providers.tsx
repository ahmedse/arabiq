"use client";

// No providers needed with Strapi authentication
// Authentication is handled server-side via cookies

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
