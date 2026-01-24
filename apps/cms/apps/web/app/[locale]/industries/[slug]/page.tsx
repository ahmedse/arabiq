import type { Metadata } from "next";
import Link from "next/link";
import { renderRichText } from "@/lib/richText";
import { getIndustryBySlug, getSiteSettings } from "@/lib/strapi";

type IndustryDetailPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export async function generateMetadata({ params }: IndustryDetailPageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const [site, industry] = await Promise.all([getSiteSettings(locale), getIndustryBySlug(locale, slug)]);
  const siteName = site?.title ?? "Arabiq";

  if (!industry) {
    return { title: `${locale === "ar" ? "غير موجود" : "Not found"} | ${siteName}` };
  }

  return {
    title: `${industry.title} | ${siteName}`,
    description: industry.summary || site?.description || undefined,
  };
}

export default async function IndustryDetailPage({ params }: IndustryDetailPageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const industry = await getIndustryBySlug(locale, slug);

  if (!industry) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            {locale === "ar" ? "غير موجود" : "Not found"}
          </h1>
          <p className="mt-2 text-slate-600">
            {locale === "ar" ? "القطاع المطلوب غير متاح" : "The industry you're looking for is not available"}
          </p>
          <Link
            className="mt-6 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            href={`/${locale}/industries`}
          >
            {locale === "ar" ? "← عودة للقطاعات" : "← Back to Industries"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <nav className="text-sm">
        <Link className="text-slate-600 hover:text-slate-900" href={`/${locale}/industries`}>
          {locale === "ar" ? "← القطاعات" : "← Industries"}
        </Link>
      </nav>

      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_100%_0%,rgba(168,85,247,0.08)_0%,rgba(255,255,255,0)_70%)]" />
        <div className="relative px-6 py-10 sm:px-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{industry.title}</h1>
          {industry.summary ? (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">{industry.summary}</p>
          ) : null}
        </div>
      </section>

      {industry.body || industry.summary ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-a:text-slate-900 prose-a:underline">
            {renderRichText(industry.body ?? industry.summary ?? "")}
          </div>
        </div>
      ) : null}
    </div>
  );
}
