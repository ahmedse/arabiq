import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { setRequestLocale } from "next-intl/server";

type BlogPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const siteUrl = process.env.SITE_URL ?? "https://arabiq.tech";
  const isAR = locale === "ar";

  const title = isAR ? "المدونة" : "Blog";
  const description = isAR
    ? "مدونة أربيك - مقالات وأخبار حول التوائم الرقمية والجولات الافتراضية - قريباً"
    : "Arabiq Blog - Articles and news about digital twins and virtual tours - Coming Soon";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/blog`,
      languages: {
        en: `${siteUrl}/en/blog`,
        ar: `${siteUrl}/ar/blog`,
      },
    },
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
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
              {isRTL ? "المدونة" : "Blog"}
            </h1>
            <p className="text-lg text-gray-400 mb-8">
              {isRTL
                ? "نعمل على إعداد محتوى قيّم حول التوائم الرقمية والجولات الافتراضية. ترقبوا مقالاتنا قريباً."
                : "We're crafting valuable content about digital twins and virtual tours. Stay tuned for our articles."}
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm">
              {isRTL ? "📧 hello@arabiq.tech للاستفسارات" : "📧 hello@arabiq.tech for inquiries"}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
