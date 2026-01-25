import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  debug: true,
  providers: [
    Google({
      clientId: process.env.NEXTAUTH_GOOGLE_ID as string,
      clientSecret: process.env.NEXTAUTH_GOOGLE_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user?.id) {
        return false;
      }

      // allow sign in; userApproval will be created in the `createUser` event
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // create the approval record, resolving the actual DB user id first
      // (some adapter implementations may pass a different transient `user.id`)
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          // try to resolve the persisted user by email (best-effort)
          const dbUser = user?.email
            ? await prisma.user.findUnique({ where: { email: user.email } })
            : null;

          if (!dbUser?.id) {
            // user row may not be committed yet; wait and retry
            const wait = 100 * (attempt + 1);
            console.warn(`createUser: DB user not found yet, retrying in ${wait}ms (attempt ${attempt + 1})`);
            await new Promise((r) => setTimeout(r, wait));
            continue;
          }

          await prisma.userApproval.create({
            data: {
              user: { connect: { id: dbUser.id } },
              status: "PENDING",
            },
          });
          break;
        } catch (err: any) {
          const code = err?.code || err?.message || '';
          if (typeof code === 'string' && code.includes('P2003')) {
            const wait = 100 * (attempt + 1);
            console.warn(`createUser: FK violation, retrying in ${wait}ms (attempt ${attempt + 1})`);
            await new Promise((r) => setTimeout(r, wait));
            continue;
          }
          console.error('createUser event: failed to create UserApproval', err);
          break;
        }
      }
    },
  },
});
            console.warn(`createUser: FK violation, retrying in ${wait}ms (attempt ${attempt + 1})`);
