import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) return <div>Not authenticated</div>;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { profile: true, approval: true },
  });

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Account</h1>
      <div className="mt-4">
        <p>Name: {user?.name}</p>
        <p>Email: {user?.email}</p>
        <p>Status: {user?.approval?.status}</p>
        <p>Display Name: {user?.profile?.displayName}</p>
        <p>Company: {user?.profile?.company}</p>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <Button type="submit">Sign Out</Button>
      </form>
    </div>
  );
}