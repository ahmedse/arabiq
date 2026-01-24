import Link from "next/link";
import { signOut } from "@/auth";

type AccessPendingPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AccessPendingPage({ params }: AccessPendingPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: `/${locale}` });
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Access pending</h1>
      <p className="text-slate-600">
        Your account is created, but access to demos must be approved by an admin.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          href={`/${locale}/contact`}
        >
          Contact us
        </Link>
        <form action={doSignOut}>
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800">Sign out</button>
        </form>
      </div>
    </div>
  );
}
