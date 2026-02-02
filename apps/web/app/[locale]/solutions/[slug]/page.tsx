import type { Metadata } from "next";
import Link from "next/link";
import { renderRichText } from "@/lib/richText";
import { getSiteSettings, getSolutionBySlug } from "@/lib/strapi";

type SolutionDetailPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export async function generateMetadata({ params }: SolutionDetailPageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const siteUrl = process.env.SITE_URL ?? "https://arabiq.tech";
  const isAR = locale === "ar";

  const [site, solution] = await Promise.all([getSiteSettings(locale), getSolutionBySlug(locale, slug)]);
  const siteName = site?.title ?? "Arabiq";

  if (!solution) {
    return {
      title: isAR ? "غير موجود" : "Not Found",
    };
  }

  const title = solution.title;
  const description = solution.summary || site?.description || "";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/solutions/${slug}`,
      languages: {
        'en': `${siteUrl}/en/solutions/${slug}`,
        'ar': `${siteUrl}/ar/solutions/${slug}`,
      },
    },
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: `${siteUrl}/${locale}/solutions/${slug}`,
      siteName,
      locale: isAR ? 'ar_SA' : 'en_US',
      type: 'article',
      images: [{ url: `${siteUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&locale=${locale}`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteName}`,
      description,
      images: [`${siteUrl}/api/og?title=${encodeURIComponent(title)}&locale=${locale}`],
    },
  };
}

export default async function SolutionDetailPage({ params }: SolutionDetailPageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const solution = await getSolutionBySlug(locale, slug);

  if (!solution) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            {locale === "ar" ? "غير موجود" : "Not found"}
          </h1>
          <p className="mt-2 text-slate-600">
            {locale === "ar" ? "الحل المطلوب غير متاح" : "The solution you're looking for is not available"}
          </p>
          <Link
            className="mt-6 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            href={`/${locale}/solutions`}
          >
            {locale === "ar" ? "← عودة للحلول" : "← Back to Solutions"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <nav className="text-sm">
        <Link className="text-slate-600 hover:text-slate-900" href={`/${locale}/solutions`}>
          {locale === "ar" ? "← الحلول" : "← Solutions"}
        </Link>
      </nav>

      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_0%_0%,rgba(59,130,246,0.08)_0%,rgba(255,255,255,0)_70%)]" />
        <div className="relative px-6 py-10 sm:px-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{solution.title}</h1>
          {solution.summary ? (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">{solution.summary}</p>
          ) : null}
        </div>
      </section>

      {solution.body || solution.summary ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-a:text-slate-900 prose-a:underline">
            {renderRichText(solution.body ?? solution.summary ?? "")}
          </div>
        </div>
      ) : null}
    </div>
  );
}
