import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";



export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Google({
      clientId: process.env.NEXTAUTH_GOOGLE_ID as string,
      clientSecret: process.env.NEXTAUTH_GOOGLE_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      try {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (!dbUser) return false;
        if (dbUser.disabled) return false;
        const approval = await prisma.userApproval.findUnique({ where: { userId: dbUser.id } });
        if (!approval || approval.status !== 'APPROVED') return false;
        return true;
      } catch (err) {
        console.error('signIn callback error', err);
        return false;
      }
    },
  },
  events: {
    async createUser({ user }) {
      // create the approval record, assign default role, and optionally sync with Strapi
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const dbUser = user?.email ? await prisma.user.findUnique({ where: { email: user.email } }) : null;

          if (!dbUser?.id) {
            const wait = 100 * (attempt + 1);
            console.warn(`createUser: DB user not found yet, retrying in ${wait}ms (attempt ${attempt + 1})`);
            await new Promise((r) => setTimeout(r, wait));
            continue;
          }

          await prisma.userApproval.create({
            data: {
              user: { connect: { id: dbUser.id } },
              status: 'PENDING',
            },
          });

          // assign default role (PUBLIC) if available
          try {
            const defaultRole = await prisma.role.findUnique({ where: { name: 'PUBLIC' } });
            if (defaultRole) {
              await prisma.userRole.create({ data: { userId: dbUser.id, roleId: defaultRole.id } });
            } else {
              console.warn('createUser: default role PUBLIC not found; ensure roles are seeded');
            }
          } catch (err) {
            console.warn('createUser: failed to assign default role (non-blocking)', err);
          }

          // Strapi profile sync is disabled (web is authoritative).
          // If you later decide to re-enable profile sync, implement a controlled, audited sync flow and ensure secure secrets management.

          break;
        } catch (err: any) {
          const code = err?.code || err?.message || '';
          if (typeof code === 'string' && code.includes('P2003')) {
            const wait = 100 * (attempt + 1);
            console.warn(`createUser: FK violation, retrying in ${wait}ms (attempt ${attempt + 1})`);
            await new Promise((r) => setTimeout(r, wait));
            continue;
          }
          console.error('createUser event: failed', err);
          break;
        }
      }
    },
  },
});

