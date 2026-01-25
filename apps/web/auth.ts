import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Google({
      clientId: process.env.NEXTAUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.NEXTAUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user?.id) {
        return false;
      }

      const existingApproval = await prisma.userApproval.findUnique({
        where: { userId: user.id },
      });

      if (!existingApproval) {
        await prisma.userApproval.create({
          data: {
            userId: user.id,
            status: "PENDING",
          },
        });
      }

      return true;
    },
  },
});
