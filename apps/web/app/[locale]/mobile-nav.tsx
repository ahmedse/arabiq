"use client";

import Link from "next/link";
import { useState } from "react";

type NavItem = {
  id: number;
  label: string;
  href: string;
  location: string;
  order: number;
  isExternal: boolean;
};

type MobileNavProps = {
  locale: string;
  navItems: NavItem[];
};

export function MobileNav({ locale, navItems }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const lang = locale === "ar" ? "ar" : "en";

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-x-0 top-[57px] z-40 border-b border-slate-200 bg-white/95 shadow-lg backdrop-blur md:hidden">
          <nav className="mx-auto max-w-6xl px-4 py-4">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  href={item.isExternal ? item.href : `/${locale}${item.href}`}
                  onClick={() => setIsOpen(false)}
                  {...(item.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-slate-200 pt-3">
                <Link
                  className="block rounded-md bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                  href={`/${locale}/login`}
                  onClick={() => setIsOpen(false)}
                >
                  {lang === "ar" ? "تسجيل الدخول" : "Login"}
                </Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
