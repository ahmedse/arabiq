"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserMenu } from "@/components/auth/UserMenu";
import { MobileNav } from "./mobile-nav";
import type { NavItem } from "@/lib/strapi";

// Default navigation fallback when CMS content is unavailable
const defaultNav = (lang: string): NavItem[] => [
  { id: 1, label: lang === "ar" ? "الحلول" : "Solutions", href: "/solutions", isExternal: false, order: 1, location: "header" },
  { id: 2, label: lang === "ar" ? "القطاعات" : "Industries", href: "/industries", isExternal: false, order: 2, location: "header" },
  { id: 3, label: lang === "ar" ? "العروض" : "Demos", href: "/demos", isExternal: false, order: 3, location: "header" },
  { id: 4, label: lang === "ar" ? "من نحن" : "About", href: "/about", isExternal: false, order: 4, location: "header" },
  { id: 5, label: lang === "ar" ? "اتصل بنا" : "Contact", href: "/contact", isExternal: false, order: 5, location: "header" },
];

interface HeaderProps {
  locale: string;
  otherLocale: string;
  headerNav: NavItem[];
  dir: string;
  lang: string;
}

export function Header({ locale, otherLocale, headerNav, dir, lang }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-bold text-lg">
            A
          </div>
          <span className="text-xl font-bold text-slate-900">Arabiq</span>
        </Link>

        {/* Desktop Navigation - from Strapi */}
        <nav className={`hidden md:flex items-center gap-8 text-sm font-medium ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
          {(headerNav.length > 0 ? headerNav : defaultNav(lang)).map((item) => (
            <Link
              key={item.id}
              className="text-slate-600 hover:text-slate-900 transition-colors"
              href={item.isExternal ? item.href : `/${locale}${item.href}`}
              {...(item.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className={`flex items-center gap-3 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
          {/* Language switcher */}
          <Link
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            href={`/${otherLocale}`}
          >
            {otherLocale === "ar" ? "العربية" : "English"}
          </Link>

          {/* User menu or login button */}
          {!mounted ? (
            <div className="w-10 h-10" />
          ) : (
            <UserMenu locale={locale} />
          )}

          <MobileNav locale={locale} navItems={headerNav.length > 0 ? headerNav : defaultNav(lang)} />
        </div>
      </div>
    </header>
  );
}