import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const userId = session.user.id;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, userRoles: { include: { role: true } }, approval: true },
  });

  if (!u) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  return NextResponse.json({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    profile: u.profile,
    roles: u.userRoles.map((ur) => ur.role.name),
    approval: u.approval?.status ?? null,
    disabled: u.disabled,
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const userId = session.user.id;
  const updates: any = {};

  try {
    if (typeof body.name === 'string') updates.name = body.name;

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({ where: { id: userId }, data: updates });
      await logAuditEvent({ actorId: userId, action: 'user-update-self', targetUserId: userId });
    }

    if (body.profile && typeof body.profile === 'object') {
      const displayName = typeof body.profile.displayName === 'string' ? body.profile.displayName : undefined;
      const company = typeof body.profile.company === 'string' ? body.profile.company : undefined;

      await prisma.userProfile.upsert({
        where: { userId },
        update: { displayName, company },
        create: { userId, displayName, company },
      });

      await logAuditEvent({ actorId: userId, action: 'profile-update-self', targetUserId: userId });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('api/user PATCH error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}