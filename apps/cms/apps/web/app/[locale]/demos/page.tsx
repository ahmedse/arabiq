import Link from "next/link";
import type { Metadata } from "next";
import { getSiteSettings, getDemos, getHomepage } from "@/lib/strapi";
import { Container } from "@/components/ui/container";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

type DemosPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: DemosPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const [site, homepage] = await Promise.all([getSiteSettings(locale), getHomepage(locale)]);

  const title = homepage?.demosTitle || (locale === "ar" ? "العروض" : "Demos");
  const siteName = site?.title ?? "Arabiq";

  return {
    title: `${title} | ${siteName}`,
    description: homepage?.demosSubtitle ?? site?.description ?? undefined,
  };
}

export default async function DemosPage({ params }: DemosPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const isRTL = locale === "ar";

  const [homepage, demos] = await Promise.all([
    getHomepage(locale).catch(() => null),
    getDemos(locale),
  ]);

  const pageTitle = homepage?.demosTitle || (isRTL ? "جرب العروض التفاعلية" : "Try Our Live Demos");
  const pageSubtitle = homepage?.demosSubtitle || (isRTL ? "استكشف إمكانياتنا بنفسك" : "Explore our capabilities firsthand");

  const demoTypeLabels: Record<string, { en: string; ar: string }> = {
    'ecommerce': { en: 'E-Commerce', ar: 'تجارة إلكترونية' },
    'ai-chat': { en: 'AI Chat', ar: 'محادثة ذكية' },
    'events': { en: 'Events', ar: 'فعاليات' },
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl" />
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl" />
        </div>
        <Container className="relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">{isRTL ? "تفاعلي ومباشر" : "Interactive & Live"}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              {pageTitle}
            </h1>
            <p className="mt-6 text-xl text-indigo-100">
              {pageSubtitle}
            </p>
          </div>
        </Container>
      </section>

      {/* Demos Grid */}
      <section className="py-24 bg-white">
        <Container>
          {demos.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-12 py-20 text-center">
              <Play className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">
                {isRTL ? "لا توجد عروض متاحة حاليًا" : "No demos available yet"}
              </h3>
              <p className="mt-2 text-slate-600">
                {isRTL ? "تحقق مرة أخرى قريبًا" : "Check back soon for updates"}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {demos.map((demo) => {
                const typeLabel = demo.demoType && demoTypeLabels[demo.demoType];
                return (
                  <Link 
                    key={demo.id} 
                    href={`/${locale}/demos/${demo.slug}`}
                    className="group"
                  >
                    <div className="h-full rounded-2xl overflow-hidden border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-2xl transition-all duration-300">
                      {/* Demo Preview */}
                      <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                        {typeLabel && (
                          <span className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} px-3 py-1 rounded-full bg-white text-xs font-medium text-slate-600 shadow-sm`}>
                            {isRTL ? typeLabel.ar : typeLabel.en}
                          </span>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {demo.title}
                        </h3>
                        <p className="mt-2 text-slate-600 line-clamp-2">
                          {demo.summary}
                        </p>
                        <div className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {isRTL ? 'جرب الآن' : 'Try now'}
                          <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-indigo-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              {isRTL ? "أعجبك ما رأيت؟" : "Like what you see?"}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {isRTL ? "تواصل معنا لنبني حلك المخصص" : "Contact us to build your custom solution"}
            </p>
            <div className={`mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <Link 
                href={`/${locale}/contact`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-indigo-700 transition-colors"
              >
                {isRTL ? "تواصل معنا" : "Contact Us"}
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
              <Link 
                href={`/${locale}/solutions`}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-300 px-8 py-4 text-base font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {isRTL ? "استكشف الحلول" : "Explore Solutions"}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
