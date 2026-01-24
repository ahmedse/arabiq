import Link from "next/link";
import type { Metadata } from "next";
import { getSiteSettings, getCaseStudies, getHomepage } from "@/lib/strapi";
import { Container } from "@/components/ui/container";
import { ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

type CaseStudiesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: CaseStudiesPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const [site, homepage] = await Promise.all([getSiteSettings(locale), getHomepage(locale)]);

  const title = homepage?.caseStudiesTitle || (locale === "ar" ? "قصص النجاح" : "Case Studies");
  const siteName = site?.title ?? "Arabiq";

  return {
    title: `${title} | ${siteName}`,
    description: homepage?.caseStudiesSubtitle ?? site?.description ?? undefined,
  };
}

export default async function CaseStudiesPage({ params }: CaseStudiesPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const isRTL = locale === "ar";

  const [homepage, caseStudies] = await Promise.all([
    getHomepage(locale).catch(() => null),
    getCaseStudies(locale),
  ]);

  const pageTitle = homepage?.caseStudiesTitle || (isRTL ? "قصص النجاح" : "Success Stories");
  const pageSubtitle = homepage?.caseStudiesSubtitle || (isRTL ? "اكتشف كيف ساعدنا عملائنا" : "Discover how we helped our clients achieve their goals");

  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <Container className="relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              {pageTitle}
            </h1>
            <p className="mt-6 text-xl text-slate-600">
              {pageSubtitle}
            </p>
          </div>
        </Container>
      </section>

      {/* Case Studies Grid */}
      <section className="py-24 bg-white">
        <Container>
          {caseStudies.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-12 py-20 text-center">
              <TrendingUp className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">
                {isRTL ? "لا توجد قصص نجاح متاحة حاليًا" : "No case studies available yet"}
              </h3>
              <p className="mt-2 text-slate-600">
                {isRTL ? "تحقق مرة أخرى قريبًا" : "Check back soon for updates"}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {caseStudies.map((caseStudy, index) => (
                <Link 
                  key={caseStudy.id} 
                  href={`/${locale}/case-studies/${caseStudy.slug}`}
                  className="group"
                >
                  <div className="h-full rounded-2xl overflow-hidden border border-slate-200 hover:shadow-2xl transition-all duration-300">
                    {/* Gradient Header */}
                    <div className={`h-48 bg-gradient-to-br ${gradients[index % gradients.length]} relative`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <TrendingUp className="w-16 h-16 text-white/30" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-8">
                      <h3 className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {caseStudy.title}
                      </h3>
                      <p className="mt-3 text-slate-600 line-clamp-2">
                        {caseStudy.summary}
                      </p>
                      
                      {/* Meta info */}
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        {caseStudy.client && (
                          <span>{caseStudy.client}</span>
                        )}
                        {caseStudy.industry && (
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                            {caseStudy.industry}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {isRTL ? 'مكتمل' : 'Completed'}
                        </span>
                      </div>
                      
                      <div className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {isRTL ? 'اقرأ القصة' : 'Read story'}
                        <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              {isRTL ? "هل تريد أن تكون قصة نجاحنا القادمة؟" : "Ready to be our next success story?"}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {isRTL ? "تواصل معنا اليوم وابدأ رحلة التحول الرقمي" : "Contact us today and start your digital transformation journey"}
            </p>
            <Link 
              href={`/${locale}/contact`}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-indigo-700 transition-colors"
            >
              {isRTL ? "تواصل معنا" : "Get Started"}
              <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
