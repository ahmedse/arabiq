import type { Metadata } from "next";
import Link from "next/link";
import { renderRichText } from "@/lib/richText";
import { getCaseStudyBySlug, getSiteSettings } from "@/lib/strapi";

type CaseStudyDetailPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export async function generateMetadata({ params }: CaseStudyDetailPageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const [site, caseStudy] = await Promise.all([getSiteSettings(locale), getCaseStudyBySlug(locale, slug)]);
  const siteName = site?.title ?? "Arabiq";

  if (!caseStudy) {
    return { title: `${locale === "ar" ? "غير موجود" : "Not found"} | ${siteName}` };
  }

  return {
    title: `${caseStudy.title} | ${siteName}`,
    description: caseStudy.summary || site?.description || undefined,
  };
}

export default async function CaseStudyDetailPage({ params }: CaseStudyDetailPageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const caseStudy = await getCaseStudyBySlug(locale, slug);

  if (!caseStudy) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            {locale === "ar" ? "غير موجود" : "Not found"}
          </h1>
          <p className="mt-2 text-slate-600">
            {locale === "ar" ? "دراسة الحالة المطلوبة غير متاحة" : "The case study you're looking for is not available"}
          </p>
          <Link
            className="mt-6 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            href={`/${locale}/case-studies`}
          >
            {locale === "ar" ? "← عودة لدراسات الحالة" : "← Back to Case Studies"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <nav className="text-sm">
        <Link className="text-slate-600 hover:text-slate-900" href={`/${locale}/case-studies`}>
          {locale === "ar" ? "← دراسات الحالة" : "← Case Studies"}
        </Link>
      </nav>

      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(34,197,94,0.08)_0%,rgba(255,255,255,0)_70%)]" />
        <div className="relative px-6 py-10 sm:px-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{caseStudy.title}</h1>
          {caseStudy.summary ? (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">{caseStudy.summary}</p>
          ) : null}
        </div>
      </section>

      {caseStudy.body || caseStudy.summary ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-a:text-slate-900 prose-a:underline">
            {renderRichText(caseStudy.body ?? caseStudy.summary ?? "")}
          </div>
        </div>
      ) : null}
    </div>
  );
}
