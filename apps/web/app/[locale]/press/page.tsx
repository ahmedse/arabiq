import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { setRequestLocale } from "next-intl/server";

type PressPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PressPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const siteUrl = process.env.SITE_URL ?? "https://arabiq.tech";
  const isAR = locale === "ar";

  const title = isAR ? "الأخبار الصحفية" : "Press";
  const description = isAR
    ? "الأخبار الصحفية والإعلامية من أربيك - قريباً"
    : "Arabiq press releases and media coverage - Coming Soon";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/press`,
      languages: {
        en: `${siteUrl}/en/press`,
        ar: `${siteUrl}/ar/press`,
      },
    },
  };
}

export default async function PressPage({ params }: PressPageProps) {
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
              {isRTL ? "الأخبار الصحفية" : "Press"}
            </h1>
            <p className="text-lg text-gray-400 mb-8">
              {isRTL
                ? "نعمل على إعداد قسم الأخبار الصحفية والتغطية الإعلامية. ترقبوا ذلك قريباً."
                : "We're preparing our press releases and media coverage section. Stay tuned."}
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm">
              {isRTL ? "📧 press@arabiq.tech للتواصل الإعلامي" : "📧 press@arabiq.tech for media inquiries"}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
