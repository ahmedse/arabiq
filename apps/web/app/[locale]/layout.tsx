import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { getSiteSettings, getNavItems, type NavItem } from "@/lib/strapi";
import { MobileNav } from "./mobile-nav";
import { Header } from "./Header";
import { setRequestLocale } from "next-intl/server";
import { Toaster } from "react-hot-toast";
import { OrganizationSchema, WebsiteSchema } from "@/components/StructuredData";
import { Analytics } from "@/components/Analytics";

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
  const siteUrl = process.env.SITE_URL ?? "https://arabiq.tech";
  const site = await getSiteSettings(normalizedLocale);
  const siteName = site?.title ?? "Arabiq";
  const description = site?.description ?? (normalizedLocale === "ar" 
    ? "حلول التوائم الرقمية والجولات الافتراضية للشركات" 
    : "Digital twin and virtual tour solutions for businesses");
  const isAR = normalizedLocale === "ar";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: isAR 
      ? ['توائم رقمية', 'جولات افتراضية', 'ماتربورت', 'تجارة إلكترونية', 'عقارات', 'فنادق', 'VR', 'الذكاء الاصطناعي']
      : ['digital twins', 'virtual tours', 'Matterport', 'e-commerce', 'real estate', 'hospitality', 'VR', 'AI'],
    authors: [{ name: 'Arabiq', url: siteUrl }],
    creator: 'Arabiq',
    publisher: 'Arabiq',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `${siteUrl}/${normalizedLocale}`,
      languages: {
        'en': `${siteUrl}/en`,
        'ar': `${siteUrl}/ar`,
      },
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
    openGraph: {
      type: 'website',
      locale: isAR ? 'ar_SA' : 'en_US',
      alternateLocale: isAR ? 'en_US' : 'ar_SA',
      url: `${siteUrl}/${normalizedLocale}`,
      siteName,
      title: siteName,
      description,
      images: [
        {
          url: `${siteUrl}/api/og?title=${encodeURIComponent(siteName)}&description=${encodeURIComponent(description)}&locale=${normalizedLocale}`,
          width: 1200,
          height: 630,
          alt: isAR ? 'أربيك - حلول التوائم الرقمية' : 'Arabiq - Digital Twin Solutions',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@arabiqtech',
      creator: '@arabiqtech',
      title: siteName,
      description,
      images: [`${siteUrl}/api/og?title=${encodeURIComponent(siteName)}&locale=${normalizedLocale}`],
    },
    verification: {
      // Add when available
      // google: 'google-verification-code',
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = locale === "ar" ? "ar" : "en";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const otherLocale = locale === "ar" ? "en" : "ar";

  // Fetch site settings AND navigation from Strapi
  const [siteSettings, headerNavItems, footerCompanyItems, footerProductsItems, footerResourcesItems, footerSocialItems] = await Promise.all([
    getSiteSettings(lang),
    getNavItems(lang, "header"),
    getNavItems(lang, "footer-company"),
    getNavItems(lang, "footer-products"),
    getNavItems(lang, "footer-resources"),
    getNavItems(lang, "footer-social"),
  ]);

  // Use CMS content with graceful fallbacks
  const headerNav = headerNavItems;
  const footerCompany = footerCompanyItems;
  const footerProducts = footerProductsItems;
  const footerResources = footerResourcesItems;
  const footerSocial = footerSocialItems;

  // Footer titles from CMS with fallbacks
  const footerCompanyTitle = siteSettings?.footerCompanyTitle || (lang === "ar" ? "الشركة" : "Company");
  const footerProductsTitle = siteSettings?.footerProductsTitle || (lang === "ar" ? "المنتجات" : "Products");
  const footerResourcesTitle = siteSettings?.footerResourcesTitle || (lang === "ar" ? "الموارد" : "Resources");
  const footerConnectTitle = siteSettings?.footerConnectTitle || (lang === "ar" ? "تواصل معنا" : "Connect");
  const copyrightText = siteSettings?.copyrightText || `© ${new Date().getFullYear()} Arabiq. ${lang === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved."}`;
  const loginButtonText = siteSettings?.loginButtonText;

  // Default footer links if CMS is empty
  const defaultCompanyLinks = [
    { id: 1, label: lang === "ar" ? "من نحن" : "About", href: "/about", isExternal: false, order: 1, location: "footer-company" },
    { id: 2, label: lang === "ar" ? "اتصل بنا" : "Contact", href: "/contact", isExternal: false, order: 2, location: "footer-company" },
  ];
  const defaultProductLinks = [
    { id: 1, label: lang === "ar" ? "الحلول" : "Solutions", href: "/solutions", isExternal: false, order: 1, location: "footer-products" },
    { id: 2, label: lang === "ar" ? "العروض" : "Demos", href: "/demos", isExternal: false, order: 2, location: "footer-products" },
  ];
  const defaultResourceLinks = [
    { id: 1, label: lang === "ar" ? "القطاعات" : "Industries", href: "/industries", isExternal: false, order: 1, location: "footer-resources" },
    { id: 2, label: lang === "ar" ? "دراسات الحالة" : "Case Studies", href: "/case-studies", isExternal: false, order: 2, location: "footer-resources" },
  ];

  const displayFooterCompany = footerCompany.length > 0 ? footerCompany : defaultCompanyLinks;
  const displayFooterProducts = footerProducts.length > 0 ? footerProducts : defaultProductLinks;
  const displayFooterResources = footerResources.length > 0 ? footerResources : defaultResourceLinks;

return (
    <>
      {/* Preconnect for performance - load external resources faster */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://my.matterport.com" />
      <link rel="dns-prefetch" href="https://cdn.matterport.com" />
      
      <OrganizationSchema locale={lang as 'en' | 'ar'} />
      <WebsiteSchema />
      <Analytics />
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang="${lang}";document.documentElement.dir="${dir}";`,
        }}
      />
      <div
        lang={lang}
        dir={dir}
        className={`min-h-screen bg-white text-slate-900 ${lang === "ar" ? ibmPlexArabic.variable : ""}`}
      >
        <Header
          locale={locale}
          otherLocale={otherLocale}
          headerNav={headerNav}
          dir={dir}
          lang={lang}
        />

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />

        <main>{children}</main>

        {/* Stripe-style footer - from Strapi */}
        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-start">
              {/* Company */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 leading-tight">
                  {footerCompanyTitle}
                </h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  {displayFooterCompany.map((item) => (
                    <li key={item.id}>
                      <Link
                        className="text-slate-600 hover:text-slate-900 transition-colors leading-relaxed"
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
                <h3 className="text-sm font-semibold text-slate-900 mb-3 leading-tight">
                  {footerProductsTitle}
                </h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  {displayFooterProducts.map((item) => (
                    <li key={item.id}>
                      <Link
                        className="text-slate-600 hover:text-slate-900 transition-colors leading-relaxed"
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
                <h3 className="text-sm font-semibold text-slate-900 mb-3 leading-tight">
                  {footerResourcesTitle}
                </h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  {displayFooterResources.map((item) => (
                    <li key={item.id}>
                      <Link
                        className="text-slate-600 hover:text-slate-900 transition-colors leading-relaxed"
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
              {footerSocial.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 leading-tight">
                    {footerConnectTitle}
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {footerSocial.map((item) => (
                      <li key={item.id}>
                        <Link
                          className="text-slate-600 hover:text-slate-900 transition-colors leading-relaxed"
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
              )}
            </div>
            
            {/* Bottom bar */}
            <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600">
              <p>{copyrightText}</p>
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
    </>
  );
}