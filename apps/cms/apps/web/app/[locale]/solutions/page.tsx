import Link from "next/link";
import type { Metadata } from "next";
import { getSiteSettings, getSolutions, getHomepage } from "@/lib/strapi";
import { Container } from "@/components/ui/container";
import { ArrowRight, Briefcase } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

type SolutionsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: SolutionsPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const [site, homepage] = await Promise.all([getSiteSettings(locale), getHomepage(locale)]);

  const title = homepage?.solutionsTitle || (locale === "ar" ? "الحلول" : "Solutions");
  const siteName = site?.title ?? "Arabiq";

  return {
    title: `${title} | ${siteName}`,
    description: homepage?.solutionsSubtitle ?? site?.description ?? undefined,
  };
}

export default async function SolutionsPage({ params }: SolutionsPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const isRTL = locale === "ar";

  const [homepage, solutions] = await Promise.all([
    getHomepage(locale).catch(() => null),
    getSolutions(locale),
  ]);

  const pageTitle = homepage?.solutionsTitle || (isRTL ? "حلولنا" : "Our Solutions");
  const pageSubtitle = homepage?.solutionsSubtitle || (isRTL ? "أدوات تحول رقمي شاملة" : "Comprehensive digital transformation tools");

  const colors = [
    'bg-indigo-600', 'bg-purple-600', 'bg-cyan-600', 
    'bg-emerald-600', 'bg-orange-600', 'bg-pink-600'
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

      {/* Solutions Grid */}
      <section className="py-24 bg-white">
        <Container>
          {solutions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-12 py-20 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">
                {isRTL ? "لا توجد حلول متاحة حاليًا" : "No solutions available yet"}
              </h3>
              <p className="mt-2 text-slate-600">
                {isRTL ? "تحقق مرة أخرى قريبًا" : "Check back soon for updates"}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {solutions.map((solution, index) => (
                <Link 
                  key={solution.id} 
                  href={`/${locale}/solutions/${solution.slug}`}
                  className="group"
                >
                  <div className="h-full p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-200 hover:shadow-xl transition-all duration-300">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${colors[index % colors.length]} text-white mb-6`}>
                      {solution.icon ? (
                        <span className="text-xl">{solution.icon}</span>
                      ) : (
                        <Briefcase className="w-6 h-6" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {solution.title}
                    </h3>
                    <p className="mt-3 text-slate-600 line-clamp-3">
                      {solution.summary}
                    </p>
                    <div className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {isRTL ? 'اعرف المزيد' : 'Learn more'}
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
      <section className="py-24 bg-slate-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              {isRTL ? "لم تجد ما تبحث عنه؟" : "Can't find what you're looking for?"}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {isRTL ? "تواصل معنا وسنساعدك في إيجاد الحل الأمثل لاحتياجاتك" : "Contact us and we'll help you find the perfect solution for your needs"}
            </p>
            <Link 
              href={`/${locale}/contact`}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-indigo-700 transition-colors"
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
