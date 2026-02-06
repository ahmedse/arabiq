import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { setRequestLocale } from "next-intl/server";

type CareersPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: CareersPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const siteUrl = process.env.SITE_URL ?? "https://arabiq.tech";
  const isAR = locale === "ar";

  const title = isAR ? "الوظائف" : "Careers";
  const description = isAR
    ? "انضم إلى فريق أربيك - فرص عمل قريباً"
    : "Join the Arabiq team - Career opportunities coming soon";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/careers`,
      languages: {
        en: `${siteUrl}/en/careers`,
        ar: `${siteUrl}/ar/careers`,
      },
    },
  };
}

export default async function CareersPage({ params }: CareersPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const isRTL = locale === "ar";

  return (
    <main dir={isRTL ? "rtl" : "ltr"}>
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_50%)]" />
        <Container className="relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
              {isRTL ? "قريباً" : "Coming Soon"}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {isRTL ? "الوظائف" : "Careers"}
            </h1>
            <p className="text-lg text-gray-400 mb-8">
              {isRTL
                ? "نحن نبني فريقاً استثنائياً. ترقبوا فرص العمل المتاحة قريباً."
                : "We're building an exceptional team. Stay tuned for open positions."}
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm">
              {isRTL ? "📧 careers@arabiq.tech للتقديم" : "📧 careers@arabiq.tech to apply"}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
