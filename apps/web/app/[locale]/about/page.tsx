import type { Metadata } from "next";
import { getSiteSettings, getAboutPage, getTeamMembers, getValues } from "@/lib/strapi";
import { Container } from "@/components/ui/container";
import Link from "next/link";
import { ArrowRight, Target, Eye, Heart, Users, Sparkles, Globe, Zap } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

// Icon mapping for dynamic values
const iconMap: Record<string, React.ReactNode> = {
  heart: <Heart className="w-6 h-6" />,
  target: <Target className="w-6 h-6" />,
  eye: <Eye className="w-6 h-6" />,
  sparkles: <Sparkles className="w-6 h-6" />,
  globe: <Globe className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
  users: <Users className="w-6 h-6" />,
};

const colorGradients = [
  'from-yellow-400 to-orange-500',
  'from-cyan-400 to-blue-500',
  'from-purple-400 to-indigo-500',
  'from-pink-400 to-rose-500',
  'from-green-400 to-emerald-500',
  'from-amber-400 to-yellow-500',
];

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const siteUrl = process.env.SITE_URL ?? "https://arabiq.tech";
  const isAR = locale === "ar";
  
  const [site, about] = await Promise.all([getSiteSettings(locale), getAboutPage(locale)]);
  
  const siteName = site?.title ?? "Arabiq";
  const title = about?.heroTitle || (isAR ? "من نحن" : "About Us");
  const description = about?.heroSubtitle || site?.description || (isAR 
    ? "تعرف على قصتنا ورؤيتنا وفريق العمل في أربيك"
    : "Learn about our story, vision, and the team behind Arabiq");

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/about`,
      languages: {
        'en': `${siteUrl}/en/about`,
        'ar': `${siteUrl}/ar/about`,
      },
    },
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: `${siteUrl}/${locale}/about`,
      siteName,
      locale: isAR ? 'ar_SA' : 'en_US',
      type: 'website',
      images: [{ url: `${siteUrl}/api/og?title=${encodeURIComponent(title)}&locale=${locale}`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteName}`,
      description,
      images: [`${siteUrl}/api/og?title=${encodeURIComponent(title)}&locale=${locale}`],
    },
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const isRTL = locale === "ar";

  // Fetch all content from CMS
  const [about, teamMembers, values] = await Promise.all([
    getAboutPage(locale).catch(() => null),
    getTeamMembers(locale).catch(() => []),
    getValues(locale).catch(() => []),
  ]);

  // Content from CMS with graceful fallbacks
  const heroTitle = about?.heroTitle || (isRTL ? 'من نحن' : 'About Us');
  const heroSubtitle = about?.heroSubtitle || (isRTL ? 'تعرف على قصتنا ورؤيتنا' : 'Learn about our story and vision');
  const missionTitle = about?.missionTitle || (isRTL ? 'مهمتنا' : 'Our Mission');
  const missionText = about?.missionText || (isRTL ? 'تحويل الجولات الافتراضية إلى تجارب تفاعلية غنية' : 'Transform virtual tours into rich interactive experiences');
  const visionTitle = about?.visionTitle || (isRTL ? 'رؤيتنا' : 'Our Vision');
  const visionText = about?.visionText || (isRTL ? 'أن نكون الخيار الأول لحلول التوائم الرقمية في المنطقة العربية' : 'To be the leading digital twin solutions provider in the Arab region');
  const valuesTitle = about?.valuesTitle || (isRTL ? 'قيمنا' : 'Our Values');
  const teamTitle = about?.teamTitle || (isRTL ? 'فريقنا' : 'Our Team');
  const teamSubtitle = about?.teamSubtitle || (isRTL ? 'تعرف على فريق العمل' : 'Meet the team');
  const ctaTitle = about?.ctaTitle || (isRTL ? 'مستعد للبدء؟' : 'Ready to get started?');
  const ctaButton = about?.ctaButton || (isRTL ? 'تواصل معنا' : 'Contact Us');

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

      {/* Values - Dynamic from CMS */}
      {values.length > 0 && (
        <section className="py-24 bg-slate-50">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">{valuesTitle}</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div key={value.id} className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${colorGradients[index % colorGradients.length]} text-white mb-6`}>
                    {iconMap[value.icon] || <Heart className="w-6 h-6" />}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{value.title}</h3>
                  <p className="text-slate-600">{value.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Team - Dynamic from CMS */}
      {teamMembers.length > 0 && (
        <section className="py-24 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">{teamTitle}</h2>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">{teamSubtitle}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {teamMembers.map((member) => (
                <div key={member.id} className="text-center group">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4 overflow-hidden">
                    {member.photoUrl ? (
                      <img 
                        src={member.photoUrl} 
                        alt={member.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-12 h-12 text-indigo-600" />
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900">{member.name}</h3>
                  <p className="text-sm text-slate-500">{member.position}</p>
                  {(member.linkedinUrl || member.twitterUrl) && (
                    <div className="mt-2 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {member.linkedinUrl && (
                        <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                      )}
                      {member.twitterUrl && (
                        <a href={member.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

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
