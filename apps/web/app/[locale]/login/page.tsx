import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

type LoginPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "ar" ? "ar" : "en";

  const session = await auth();
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (user) {
      const approval = await prisma.userApproval.findUnique({
        where: { userId: user.id },
        select: { status: true },
      });

      const status = approval?.status ?? "PENDING";
      if (status === "APPROVED") redirect(`/${locale}/demos`);
      if (status === "REJECTED") redirect(`/${locale}/access-rejected`);
      redirect(`/${locale}/access-pending`);
    }
  }

  const callbackUrl = `http://localhost:3000/${locale}/demos`;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="text-sm text-slate-600">Sign in with Google to request access to demos.</p>
      </div>

      <GoogleSignInButton callbackUrl={callbackUrl} />

      <p className="text-xs text-slate-500">
        By continuing, you may be asked for approval before accessing protected demos.
      </p>
    </div>
  );
}
