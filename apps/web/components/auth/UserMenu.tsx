"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { strapiLogout, getCurrentStrapiUser } from "@/lib/strapiAuth";
import { useRouter } from "next/navigation";

interface UserMenuProps {
  locale: string;
}

interface StrapiUser {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  phone?: string;
  role?: { name: string; type: string };
}

export function UserMenu({ locale }: UserMenuProps) {
  const [user, setUser] = useState<StrapiUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const token = document.cookie.split('; ').find(row => row.startsWith('strapi_jwt='))?.split('=')[1];
      if (token) {
        const currentUser = await getCurrentStrapiUser(token);
        setUser(currentUser);
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await strapiLogout();
    setUser(null);
    router.push(`/${locale}/login`);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Link
        className="hidden sm:inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
        href={`/${locale}/login`}
      >
        Login
      </Link>
    );
  }

  const displayName = user.displayName || user.username || user.email;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-slate-100 p-1 hover:bg-slate-200 transition-colors"
        aria-label="User menu"
      >
        <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">
          {initials}
        </div>
        <svg
          className={`h-4 w-4 text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <div className="px-4 py-2 border-b border-slate-100">
              <div className="text-sm font-medium text-slate-900">
                {displayName}
              </div>
              <div className="text-xs text-slate-500">
                {user.email}
              </div>
              {user.role && (
                <div className="text-xs text-indigo-600 font-medium mt-1">
                  {user.role.name}
                </div>
              )}
            </div>

            <Link
              href={`/${locale}/account`}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Account Settings
            </Link>

            {user.role?.type === "admin" && (
              <Link
                href={`/${locale}/admin/users`}
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
