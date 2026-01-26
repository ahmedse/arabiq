import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { userHasRole } from '@/lib/roles';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const isAdmin = await userHasRole(session.user.id, 'ADMIN');
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const users = await prisma.user.findMany({
    include: { userRoles: { include: { role: true } }, approval: true },
    take: 100,
  });

  const payload = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    disabled: u.disabled,
    approval: u.approval?.status ?? null,
    roles: u.userRoles.map((ur) => ur.role.name),
  }));

  return NextResponse.json({ users: payload });
}
