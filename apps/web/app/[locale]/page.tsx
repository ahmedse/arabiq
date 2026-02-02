import type { Metadata } from "next";
import { getSolutions, getIndustries, getCaseStudies, getDemos, getHomepage, getStats, getTrustedCompanies, getProcessSteps, getFeatures, getSiteSettings } from "@/lib/strapi";
import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { Container } from "@/components/ui/container";
import Link from "next/link";
import { ArrowRight, Zap, Globe, Sparkles, Building2, Briefcase, Play, CheckCircle2 } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

// Icon mapping for features
const iconMap: Record<string, React.ReactNode> = {
  zap: <Zap className="w-6 h-6" />,
  globe: <Globe className="w-6 h-6" />,
  sparkles: <Sparkles className="w-6 h-6" />,
};

// Step icon mapping
const stepIconMap: Record<string, string> = {
  chat: '💬',
  code: '🔧',
  rocket: '🚀',
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const siteUrl = process.env.SITE_URL ?? "https://arabiq.tech";
  const isAR = locale === "ar";
  
  const [site, homepage] = await Promise.all([
    getSiteSettings(locale),
    getHomepage(locale).catch(() => null),
  ]);
  
  const siteName = site?.title ?? "Arabiq";
  const title = homepage?.heroTitle || siteName;
  const description = homepage?.heroSubtitle || site?.description || (isAR 
    ? "حول جولاتك الافتراضية إلى تطبيقات تفاعلية للتسوق والحجز والاستكشاف" 
    : "Transform virtual tours into interactive applications for shopping, booking, and exploration");

  return {
    title: siteName,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        'en': `${siteUrl}/en`,
        'ar': `${siteUrl}/ar`,
      },
    },
    openGraph: {
      title: title,
      description,
      url: `${siteUrl}/${locale}`,
      siteName,
      locale: isAR ? 'ar_SA' : 'en_US',
      type: 'website',
      images: [
        {
          url: `${siteUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&locale=${locale}`,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/api/og?title=${encodeURIComponent(title)}&locale=${locale}`],
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const isRTL = locale === "ar";

  // Fetch ALL content from Strapi in parallel
  const [homepage, stats, trustedCompanies, processSteps, features, solutions, industries, caseStudies, demos] = await Promise.all([
    getHomepage(locale).catch(() => null),
    getStats(locale).catch(() => []),
    getTrustedCompanies(locale).catch(() => []),
    getProcessSteps(locale).catch(() => []),
    getFeatures(locale).catch(() => []),
    getSolutions(locale).catch(() => []),
    getIndustries(locale).catch(() => []),
    getCaseStudies(locale).catch(() => []),
    getDemos(locale).catch(() => []),
  ]);

  // Section visibility toggles (default to true if not set)
  const showStats = homepage?.showStatsSection !== false;
  const showTrustedBy = homepage?.showTrustedBySection !== false;
  const showHowItWorks = homepage?.showHowItWorksSection !== false;
  const showFeatures = homepage?.showFeaturesSection !== false;
  const showSolutions = homepage?.showSolutionsSection !== false;
  const showIndustries = homepage?.showIndustriesSection !== false;
  const showCaseStudies = homepage?.showCaseStudiesSection !== false;
  const showDemos = homepage?.showDemosSection !== false;
  const showCta = homepage?.showCtaSection !== false;

  const featuredSolutions = solutions.slice(0, 3);
  const featuredIndustries = industries.slice(0, 6);
  const featuredCaseStudies = caseStudies.slice(0, 2);
  const featuredDemos = demos.slice(0, 3);

  // Hero content with graceful fallbacks
  const heroTitle = homepage?.heroTitle || (isRTL ? 'حلول التوائم الرقمية' : 'Digital Twin Solutions');
  const heroSubtitle = homepage?.heroSubtitle || (isRTL ? 'اكتشف كيف يمكننا تحويل عملك رقمياً' : 'Discover how we can transform your business digitally');
  const heroPrimaryCta = homepage?.heroPrimaryCta || (isRTL ? 'ابدأ الآن' : 'Get Started');
  const heroSecondaryCta = homepage?.heroSecondaryCta || (isRTL ? 'شاهد العروض' : 'View Demos');
  const trustAward = homepage?.trustAward || (isRTL ? 'منصة حائزة على جوائز' : 'Award-winning platform');
  const trustGlobal = homepage?.trustGlobal || (isRTL ? 'نخدم منطقة الشرق الأوسط' : 'Serving MENA region');
  const trustFast = homepage?.trustFast || (isRTL ? 'انشر في أيام' : 'Deploy in days');

  return (
    <div className="min-h-screen">
      {/* Hero Section - Always shown */}
      <Hero
        title={heroTitle}
        subtitle={heroSubtitle}
        primaryCTA={{ label: heroPrimaryCta, href: `/${locale}/contact` }}
        secondaryCTA={{ label: heroSecondaryCta, href: `/${locale}/demos` }}
        trustIndicators={{ 
          award: trustAward, 
          global: trustGlobal, 
          fast: trustFast 
        }}
        isRTL={isRTL}
      />

      {/* Stats Section - Controlled by showStatsSection */}
      {showStats && stats.length > 0 && (
        <Stats
          stats={stats.map(s => ({ value: s.value, label: s.label }))}
        />
      )}

      {/* Trusted By Section - Controlled by showTrustedBySection */}
      {showTrustedBy && trustedCompanies.length > 0 && (
        <section className="py-16 bg-slate-50 border-b border-slate-100">
          <Container>
            <p className="text-center text-sm font-medium text-slate-500 mb-8">
              {homepage?.trustedByTitle || (isRTL ? 'موثوق من قبل' : 'Trusted By')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-60 grayscale">
              {trustedCompanies.map(c => <div key={c.id} className="text-xl font-bold text-slate-400">{c.name}</div>)}
            </div>
          </Container>
        </section>
      )}

      {/* How It Works Section - Controlled by showHowItWorksSection */}
      {showHowItWorks && processSteps.length > 0 && (
        <section className="py-24 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                {homepage?.howItWorksTitle || (isRTL ? 'كيف يعمل' : 'How It Works')}
              </h2>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                {homepage?.howItWorksSubtitle || (isRTL ? 'خطوات بسيطة للبدء' : 'Simple steps to get started')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200" />
              {processSteps.map(item => (
                <div key={item.id} className="relative text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white text-2xl mb-6 relative z-10">
                    {stepIconMap[item.icon] || '📋'}
                  </div>
                  <div className="text-xs font-bold text-indigo-600 mb-2">{String(item.step).padStart(2, '0')}</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 truncate">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Features Section - Controlled by showFeaturesSection */}
      {showFeatures && features.length > 0 && (
        <section className="py-24 bg-slate-50">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                {homepage?.featuresTitle || (isRTL ? 'المميزات' : 'Features')}
              </h2>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                {homepage?.featuresSubtitle || (isRTL ? 'كل ما تحتاجه' : 'Everything you need')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((f, i) => {
                const colors = ['from-yellow-400 to-orange-500', 'from-cyan-400 to-blue-500', 'from-purple-400 to-indigo-500'];
                return (
                  <div key={f.id} className="p-8 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-lg transition-all">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${colors[i % 3]} text-white mb-6`}>
                      {iconMap[f.icon] || <Zap className="w-6 h-6" />}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{f.title}</h3>
                    <p className="text-slate-600">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>
      )}

      {/* Solutions Section - Controlled by showSolutionsSection */}
      {showSolutions && featuredSolutions.length > 0 && (
        <section className="py-24 bg-white">
          <Container>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  {homepage?.solutionsTitle || (isRTL ? 'حلولنا' : 'Our Solutions')}
                </h2>
                <p className="mt-4 text-lg text-slate-600 max-w-2xl">
                  {homepage?.solutionsSubtitle || (isRTL ? 'حلول مصممة لاحتياجاتك' : 'Solutions designed for your needs')}
                </p>
              </div>
              <Link href={`/${locale}/solutions`} className={`inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {isRTL ? 'عرض الكل' : 'View all'}
                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {featuredSolutions.map((s, i) => (
                <Link key={s.id} href={`/${locale}/solutions/${s.slug}`} className="group">
                  <div className="h-full p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-200 transition-all">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-white mb-6 ${i === 0 ? 'bg-indigo-600' : i === 1 ? 'bg-purple-600' : 'bg-cyan-600'}`}>
                      {s.icon ? <span className="text-lg">{s.icon}</span> : <Briefcase className="w-5 h-5" />}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{s.title}</h3>
                    <p className="mt-3 text-slate-600 line-clamp-3">{s.summary}</p>
                    <div className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {isRTL ? 'اعرف المزيد' : 'Learn more'}
                      <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Industries Section - Controlled by showIndustriesSection */}
      {showIndustries && featuredIndustries.length > 0 && (
        <section className="py-24 bg-slate-900 text-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {homepage?.industriesTitle || (isRTL ? 'القطاعات' : 'Industries')}
              </h2>
              <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
                {homepage?.industriesSubtitle || (isRTL ? 'نخدم مختلف القطاعات' : 'We serve various industries')}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {featuredIndustries.map(ind => (
                <Link key={ind.id} href={`/${locale}/industries/${ind.slug}`} className="group p-6 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-indigo-500 transition-all">
                  <div className="flex items-center gap-3">
                    {ind.icon ? <span className="text-xl">{ind.icon}</span> : <Building2 className="w-5 h-5 text-indigo-400" />}
                    <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">{ind.title}</h3>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link href={`/${locale}/industries`} className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors">
                {isRTL ? 'عرض جميع القطاعات' : 'View all industries'}
                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* Case Studies Section - Controlled by showCaseStudiesSection */}
      {showCaseStudies && featuredCaseStudies.length > 0 && (
        <section className="py-24 bg-white">
          <Container>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  {homepage?.caseStudiesTitle || (isRTL ? 'دراسات الحالة' : 'Case Studies')}
                </h2>
                <p className="mt-4 text-lg text-slate-600 max-w-2xl">
                  {homepage?.caseStudiesSubtitle || (isRTL ? 'قصص نجاح عملائنا' : 'Our clients success stories')}
                </p>
              </div>
              <Link href={`/${locale}/case-studies`} className={`inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {isRTL ? 'عرض الكل' : 'View all'}
                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {featuredCaseStudies.map((cs, i) => (
                <Link key={cs.id} href={`/${locale}/case-studies/${cs.slug}`} className="group">
                  <div className="h-full rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all">
                    <div className={`h-48 ${i === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-cyan-500 to-blue-600'}`} />
                    <div className="p-8">
                      <h3 className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{cs.title}</h3>
                      <p className="mt-3 text-slate-600 line-clamp-2">{cs.summary}</p>
                      <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" />{isRTL ? 'مكتمل' : 'Completed'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Live Demos Section - Controlled by showDemosSection */}
      {showDemos && featuredDemos.length > 0 && (
        <section className="py-24 bg-gradient-to-br from-slate-50 to-indigo-50">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                {homepage?.demosTitle || (isRTL ? 'العروض التفاعلية' : 'Interactive Demos')}
              </h2>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                {homepage?.demosSubtitle || (isRTL ? 'جرب بنفسك' : 'Try it yourself')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredDemos.map(demo => (
                <Link key={demo.id} href={`/${locale}/demos/${demo.slug}`} className="group">
                  <div className="h-full p-6 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600"><Play className="w-5 h-5" /></div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{demo.title}</h3>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{demo.summary}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link href={`/${locale}/demos`} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-indigo-700 transition-colors">
                {isRTL ? 'استكشف جميع العروض' : 'Explore all demos'}
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* CTA Section - Controlled by showCtaSection */}
      {showCta && (
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          
          <Container className="relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                {homepage?.ctaTitle || (isRTL ? 'مستعد للبدء؟' : 'Ready to get started?')}
              </h2>
              <p className="mt-6 text-xl text-indigo-100">
                {homepage?.ctaSubtitle || (isRTL ? 'تواصل معنا اليوم' : 'Get in touch with us today')}
              </p>
              <div className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                <Link href={`/${locale}/contact`} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-indigo-700 shadow-lg hover:bg-indigo-50 transition-colors">
                  {homepage?.ctaPrimaryButton || (isRTL ? 'تواصل معنا' : 'Contact Us')}
                  <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
                <Link href={`/${locale}/demos`} className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm px-8 py-4 text-base font-semibold text-white hover:bg-white/20 transition-colors">
                  {homepage?.ctaSecondaryButton || (isRTL ? 'شاهد العروض' : 'View Demos')}
                </Link>
              </div>
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}
