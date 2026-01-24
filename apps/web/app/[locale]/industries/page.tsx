import Link from "next/link";
import type { Metadata } from "next";
import { getSiteSettings, getIndustries, getHomepage } from "@/lib/strapi";
import { Container } from "@/components/ui/container";
import { ArrowRight, Building2 } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

type IndustriesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: IndustriesPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const [site, homepage] = await Promise.all([getSiteSettings(locale), getHomepage(locale)]);

  const title = homepage?.industriesTitle || (locale === "ar" ? "القطاعات" : "Industries");
  const siteName = site?.title ?? "Arabiq";

  return {
    title: `${title} | ${siteName}`,
    description: homepage?.industriesSubtitle ?? site?.description ?? undefined,
  };
}

export default async function IndustriesPage({ params }: IndustriesPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const isRTL = locale === "ar";

  const [homepage, industries] = await Promise.all([
    getHomepage(locale).catch(() => null),
    getIndustries(locale),
  ]);

  const pageTitle = homepage?.industriesTitle || (isRTL ? "القطاعات التي نخدمها" : "Industries We Serve");
  const pageSubtitle = homepage?.industriesSubtitle || (isRTL ? "حلول مخصصة لكل قطاع" : "Tailored solutions for every sector");

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl" />
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl" />
        </div>
        <Container className="relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              {pageTitle}
            </h1>
            <p className="mt-6 text-xl text-slate-300">
              {pageSubtitle}
            </p>
          </div>
        </Container>
      </section>

      {/* Industries Grid */}
      <section className="py-24 bg-white">
        <Container>
          {industries.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-12 py-20 text-center">
              <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">
                {isRTL ? "لا توجد قطاعات متاحة حاليًا" : "No industries available yet"}
              </h3>
              <p className="mt-2 text-slate-600">
                {isRTL ? "تحقق مرة أخرى قريبًا" : "Check back soon for updates"}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {industries.map((industry) => (
                <Link 
                  key={industry.id} 
                  href={`/${locale}/industries/${industry.slug}`}
                  className="group"
                >
                  <div className="h-full p-8 rounded-2xl border border-slate-200 bg-white hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-200 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center">
                        {industry.icon ? (
                          <span className="text-xl">{industry.icon}</span>
                        ) : (
                          <Building2 className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {industry.title}
                      </h3>
                    </div>
                    <p className="text-slate-600 line-clamp-2">
                      {industry.summary}
                    </p>
                    <div className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {isRTL ? 'استكشف' : 'Explore'}
                      <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-indigo-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              {isRTL ? "لم تجد قطاعك؟" : "Don't see your industry?"}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {isRTL ? "نعمل مع مختلف القطاعات. تواصل معنا لمناقشة احتياجاتك" : "We work with various industries. Contact us to discuss your needs"}
            </p>
            <Link 
              href={`/${locale}/contact`}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-slate-800 transition-colors"
            >
              {isRTL ? "تواصل معنا" : "Contact Us"}
              <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
