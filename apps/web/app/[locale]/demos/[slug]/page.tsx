import type { Metadata } from "next";
import { getDemoBySlug, getSiteSettings } from "@/lib/strapi";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/serverAuth";
import { DemoViewer } from "./DemoViewer";
import { fetchDemoItems } from "@/lib/api/demos";
import { fetchVoiceOvers } from "@/lib/api/voiceOvers";
import type { DemoConfig } from "@/lib/matterport/types";

type DemoDetailPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export async function generateMetadata({ params }: DemoDetailPageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const siteUrl = process.env.SITE_URL ?? "https://arabiq.tech";
  const isAR = locale === "ar";
  
  const [site, demo] = await Promise.all([getSiteSettings(locale), getDemoBySlug(locale, slug)]);
  const siteName = site?.title ?? "Arabiq";

  if (!demo) {
    return { title: isAR ? "غير موجود" : "Not Found" };
  }

  const title = demo.title;
  const description = demo.summary || site?.description || "";

  return {
    title,
    description,
    robots: { index: false, follow: false }, // Demo pages not indexed
    alternates: {
      canonical: `${siteUrl}/${locale}/demos/${slug}`,
    },
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: `${siteUrl}/${locale}/demos/${slug}`,
      siteName,
      locale: isAR ? 'ar_SA' : 'en_US',
      type: 'article',
    },
  };
}

export default async function DemoDetailPage({ params }: DemoDetailPageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  
  // Require authentication for demo pages
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login?redirect=/${locale}/demos/${slug}`);
  }

  // Check account status - must be active and approved
  if (user.accountStatus === 'suspended') {
    redirect(`/${locale}/account-suspended`);
  }
  if (user.accountStatus === 'pending') {
    redirect(`/${locale}/account-pending`);
  }
  if (user.accountStatus !== 'active') {
    redirect(`/${locale}/access-denied`);
  }

  const demo = await getDemoBySlug(locale, slug);

  if (!demo) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white p-8">
          <h1 className="text-2xl font-bold mb-4">{locale === 'ar' ? 'العرض غير موجود' : 'Demo not found'}</h1>
          <p className="text-gray-400">
            {locale === 'ar' ? 'لم نتمكن من العثور على هذا العرض.' : 'We could not find this demo.'}
          </p>
        </div>
      </main>
    );
  }

  // Handle missing matterportModelId gracefully
  if (!demo.matterportModelId) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white p-8">
          <h1 className="text-2xl font-bold mb-4">{demo.title}</h1>
          <p className="text-gray-400">
            {locale === 'ar' 
              ? 'جولة 3D لم يتم تكوينها بعد. يرجى التحقق لاحقًا.'
              : '3D Tour not yet configured. Please check back soon.'}
          </p>
        </div>
      </main>
    );
  }

  // Fetch items and voice-overs based on demo type
  const [items, voiceOvers] = await Promise.all([
    fetchDemoItems(demo.id, demo.demoType || 'tour3d', locale),
    demo.enableVoiceOver ? fetchVoiceOvers(demo.id, locale) : Promise.resolve([]),
  ]);

  // Convert to DemoConfig format
  const demoConfig: DemoConfig = {
    id: demo.id,
    slug: demo.slug,
    title: demo.title,
    summary: demo.summary,
    matterportModelId: demo.matterportModelId,
    demoType: (demo.demoType || 'tour3d') as DemoConfig['demoType'],
    featuredImage: demo.image?.url,
    businessName: demo.businessName,
    businessPhone: demo.businessPhone,
    businessEmail: demo.businessEmail,
    businessWhatsapp: demo.businessWhatsapp,
    enableVoiceOver: demo.enableVoiceOver ?? false,
    enableLiveChat: demo.enableLiveChat ?? false,
    enableAiChat: demo.enableAiChat ?? true,
  };

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Full-screen 3D viewer */}
      <DemoViewer 
        demo={demoConfig} 
        items={items}
        voiceOvers={voiceOvers}
        locale={locale}
      />
    </main>
  );
}
