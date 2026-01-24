import Link from "next/link";
import { signOut } from "@/auth";

type AccessRejectedPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AccessRejectedPage({ params }: AccessRejectedPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: `/${locale}` });
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Access rejected</h1>
      <p className="text-slate-600">
        Your request to access demos was rejected. If you believe this is a mistake, please contact us.
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
