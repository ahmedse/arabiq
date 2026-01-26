import { getDemoBySlug } from "@/lib/strapi";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isContentAccessibleByUser } from "@/lib/contentAuth";

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

  // Enforce role-based access control for demos when `allowedRoles` is set
  if (demo.allowedRoles && demo.allowedRoles.length > 0) {
    const session = await auth();
    const userId = session?.user?.id;

    const allowed = await isContentAccessibleByUser(userId, demo.allowedRoles);
    if (!allowed) {
      // If not authenticated, redirect to login; otherwise show access denied
      if (!userId) {
        redirect(`/${locale}/login`);
      }
      redirect(`/${locale}/admin/access-denied`);
    }
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
