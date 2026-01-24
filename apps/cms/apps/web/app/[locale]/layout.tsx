import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { getSiteSettings, getNavItems, type NavItem } from "@/lib/strapi";
import { MobileNav } from "./mobile-nav";
import { setRequestLocale } from "next-intl/server";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-ibm-plex-arabic",
  display: "swap",
});

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const normalizedLocale = locale === "ar" ? "ar" : "en";
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const site = await getSiteSettings(normalizedLocale);
  const siteName = site?.title ?? "Arabiq";
  const description = site?.description ?? "Arabiq platform.";

  return {
    metadataBase: new URL(siteUrl),
    alternates: { canonical: `/${normalizedLocale}` },
    title: { default: siteName, template: `%s | ${siteName}` },
    description,
    openGraph: {
      title: siteName,
      description,
      url: `/${normalizedLocale}`,
      siteName,
      locale: normalizedLocale,
      type: "website",
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = locale === "ar" ? "ar" : "en";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const otherLocale = locale === "ar" ? "en" : "ar";

  // Fetch ALL navigation from Strapi
  const [headerNavItems, footerCompanyItems, footerProductsItems, footerResourcesItems, footerSocialItems] = await Promise.all([
    getNavItems(lang, "header"),
    getNavItems(lang, "footer-company"),
    getNavItems(lang, "footer-products"),
    getNavItems(lang, "footer-resources"),
    getNavItems(lang, "footer-social"),
  ]);

  // Fallback navigation if Strapi is not available
  const defaultHeaderNav: NavItem[] = [
    { id: 1, label: lang === "ar" ? "الحلول" : "Solutions", href: "/solutions", location: "header", order: 1, isExternal: false },
    { id: 2, label: lang === "ar" ? "القطاعات" : "Industries", href: "/industries", location: "header", order: 2, isExternal: false },
    { id: 3, label: lang === "ar" ? "قصص النجاح" : "Case Studies", href: "/case-studies", location: "header", order: 3, isExternal: false },
    { id: 4, label: lang === "ar" ? "العروض" : "Demos", href: "/demos", location: "header", order: 4, isExternal: false },
    { id: 5, label: lang === "ar" ? "من نحن" : "About", href: "/about", location: "header", order: 5, isExternal: false },
    { id: 6, label: lang === "ar" ? "تواصل معنا" : "Contact", href: "/contact", location: "header", order: 6, isExternal: false },
  ];

  const headerNav = headerNavItems.length > 0 ? headerNavItems : defaultHeaderNav;
  const footerCompany = footerCompanyItems.length > 0 ? footerCompanyItems : [
    { id: 1, label: lang === "ar" ? "من نحن" : "About Us", href: "/about", location: "footer-company", order: 1, isExternal: false },
    { id: 2, label: lang === "ar" ? "تواصل معنا" : "Contact", href: "/contact", location: "footer-company", order: 2, isExternal: false },
  ];
  const footerProducts = footerProductsItems.length > 0 ? footerProductsItems : [
    { id: 1, label: lang === "ar" ? "الحلول" : "Solutions", href: "/solutions", location: "footer-products", order: 1, isExternal: false },
    { id: 2, label: lang === "ar" ? "العروض" : "Demos", href: "/demos", location: "footer-products", order: 2, isExternal: false },
  ];
  const footerResources = footerResourcesItems.length > 0 ? footerResourcesItems : [
    { id: 1, label: lang === "ar" ? "قصص النجاح" : "Case Studies", href: "/case-studies", location: "footer-resources", order: 1, isExternal: false },
    { id: 2, label: lang === "ar" ? "القطاعات" : "Industries", href: "/industries", location: "footer-resources", order: 2, isExternal: false },
  ];
  const footerSocial = footerSocialItems.length > 0 ? footerSocialItems : [
    { id: 1, label: "Twitter", href: "https://twitter.com/arabiq", location: "footer-social", order: 1, isExternal: true },
    { id: 2, label: "LinkedIn", href: "https://linkedin.com/company/arabiq", location: "footer-social", order: 2, isExternal: true },
  ];

  return (
    <div
      lang={lang}
      dir={dir}
      className={`min-h-screen bg-white text-slate-900 ${lang === "ar" ? ibmPlexArabic.variable : ""}`}
    >
      {/* Stripe-style header */}
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
            {headerNav.map((item) => (
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
            
            {/* Login button */}
            <Link
              className="hidden sm:inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
              href={`/${locale}/login`}
            >
              {lang === "ar" ? "تسجيل الدخول" : "Login"}
            </Link>
            
            <MobileNav locale={locale} navItems={headerNav} />
          </div>
        </div>
      </header>

      <main>{children}</main>

      {/* Stripe-style footer - from Strapi */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                {lang === "ar" ? "الشركة" : "Company"}
              </h3>
              <ul className="space-y-3 text-sm">
                {footerCompany.map((item) => (
                  <li key={item.id}>
                    <Link
                      className="text-slate-600 hover:text-slate-900 transition-colors"
                      href={item.isExternal ? item.href : `/${locale}${item.href}`}
                      {...(item.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Products */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                {lang === "ar" ? "المنتجات" : "Products"}
              </h3>
              <ul className="space-y-3 text-sm">
                {footerProducts.map((item) => (
                  <li key={item.id}>
                    <Link
                      className="text-slate-600 hover:text-slate-900 transition-colors"
                      href={item.isExternal ? item.href : `/${locale}${item.href}`}
                      {...(item.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                {lang === "ar" ? "الموارد" : "Resources"}
              </h3>
              <ul className="space-y-3 text-sm">
                {footerResources.map((item) => (
                  <li key={item.id}>
                    <Link
                      className="text-slate-600 hover:text-slate-900 transition-colors"
                      href={item.isExternal ? item.href : `/${locale}${item.href}`}
                      {...(item.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Social / Connect */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                {lang === "ar" ? "تواصل معنا" : "Connect"}
              </h3>
              <ul className="space-y-3 text-sm">
                {footerSocial.map((item) => (
                  <li key={item.id}>
                    <Link
                      className="text-slate-600 hover:text-slate-900 transition-colors"
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600">
            <p>© {new Date().getFullYear()} Arabiq. {lang === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
            <div className={`flex items-center gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
              <div className="flex items-center justify-center h-6 w-6 rounded bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-bold text-xs">
                A
              </div>
              <span className="font-medium text-slate-900">Arabiq</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
