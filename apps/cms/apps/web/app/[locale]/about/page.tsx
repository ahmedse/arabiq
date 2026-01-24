import type { Metadata } from "next";
import { getSiteSettings, getAboutPage } from "@/lib/strapi";
import { Container } from "@/components/ui/container";
import Link from "next/link";
import { ArrowRight, Target, Eye, Heart, Users } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const [site, about] = await Promise.all([getSiteSettings(locale), getAboutPage(locale)]);
  
  const title = about?.heroTitle || (locale === "ar" ? "عن الشركة" : "About");
  const siteName = site?.title ?? "Arabiq";

  return {
    title: `${title} | ${siteName}`,
    description: about?.heroSubtitle ?? site?.description ?? undefined,
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const isRTL = locale === "ar";

  const about = await getAboutPage(locale).catch(() => null);

  // Fallback content
  const heroTitle = about?.heroTitle || (isRTL ? "عن Arabiq" : "About Arabiq");
  const heroSubtitle = about?.heroSubtitle || (isRTL ? "نبني مستقبل التجارة الرقمية للعالم العربي" : "We're building the future of digital commerce for the Arab world");
  const missionTitle = about?.missionTitle || (isRTL ? "مهمتنا" : "Our Mission");
  const missionText = about?.missionText || (isRTL ? "تمكين الشركات العربية بتقنية التوأم الرقمي المتطورة" : "To empower Arab businesses with cutting-edge digital twin technology");
  const visionTitle = about?.visionTitle || (isRTL ? "رؤيتنا" : "Our Vision");
  const visionText = about?.visionText || (isRTL ? "عالم حيث كل شركة عربية يمكنها الوجود مرتين" : "A world where every Arab business can exist twice");
  const valuesTitle = about?.valuesTitle || (isRTL ? "قيمنا" : "Our Values");
  const value1Title = about?.value1Title || (isRTL ? "الابتكار" : "Innovation");
  const value1Text = about?.value1Text || (isRTL ? "ندفع الحدود ونتبنى تقنيات جديدة" : "We push boundaries and embrace new technologies");
  const value2Title = about?.value2Title || (isRTL ? "عربي-أولاً" : "Arabic-First");
  const value2Text = about?.value2Text || (isRTL ? "نبني للسوق العربي أولاً" : "We build for the Arab market first");
  const value3Title = about?.value3Title || (isRTL ? "التميز" : "Excellence");
  const value3Text = about?.value3Text || (isRTL ? "نسعى لأعلى جودة" : "We strive for the highest quality");
  const teamTitle = about?.teamTitle || (isRTL ? "فريقنا" : "Our Team");
  const teamSubtitle = about?.teamSubtitle || (isRTL ? "فريق متنوع من المهندسين والمصممين" : "A diverse team of engineers, designers, and strategists");
  const ctaTitle = about?.ctaTitle || (isRTL ? "انضم لرحلتنا" : "Join Our Journey");
  const ctaButton = about?.ctaButton || (isRTL ? "تواصل معنا" : "Get in Touch");

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <Container className="relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight">
              {heroTitle}
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed">
              {heroSubtitle}
            </p>
          </div>
        </Container>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-600 text-white mb-6">
                <Target className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{missionTitle}</h2>
              <p className="text-lg text-slate-600 leading-relaxed">{missionText}</p>
            </div>

            {/* Vision */}
            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-purple-600 text-white mb-6">
                <Eye className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{visionTitle}</h2>
              <p className="text-lg text-slate-600 leading-relaxed">{visionText}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="py-24 bg-slate-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">{valuesTitle}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Value 1 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white mb-6">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{value1Title}</h3>
              <p className="text-slate-600">{value1Text}</p>
            </div>

            {/* Value 2 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{value2Title}</h3>
              <p className="text-slate-600">{value2Text}</p>
            </div>

            {/* Value 3 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 text-white mb-6">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{value3Title}</h3>
              <p className="text-slate-600">{value3Text}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Team */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">{teamTitle}</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">{teamSubtitle}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                  <Users className="w-12 h-12 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-slate-900">{isRTL ? `عضو الفريق ${i}` : `Team Member ${i}`}</h3>
                <p className="text-sm text-slate-500">{isRTL ? "منصب" : "Position"}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800" />
        <Container className="relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{ctaTitle}</h2>
            <div className="mt-10">
              <Link 
                href={`/${locale}/contact`} 
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-indigo-700 shadow-lg hover:bg-indigo-50 transition-colors"
              >
                {ctaButton}
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
