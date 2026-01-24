import { getDemoBySlug } from "@/lib/strapi";

type DemoDetailPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export default async function DemoDetailPage({ params }: DemoDetailPageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";
  const demo = await getDemoBySlug(locale, slug);

  if (!demo) {
    return <h1>Demo not found</h1>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{demo.title}</h1>
        {demo.summary ? <p className="text-slate-600">{demo.summary}</p> : null}
      </div>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-slate-500">
        Demo content placeholder
      </div>
    </div>
  );
}
