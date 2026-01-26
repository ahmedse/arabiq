import { NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { userHasRole } from '@/lib/roles';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const isAdmin = await userHasRole(session.user.id, 'ADMIN');
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { secret, token } = body || {};
  if (!secret || !token) return NextResponse.json({ error: 'missing' }, { status: 400 });

  const ok = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
  if (!ok) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  // store secret and enable MFA for user
  await prisma.user.update({ where: { id: session.user.id }, data: { adminMfaEnabled: true, adminMfaSecret: secret } });

  const res = NextResponse.json({ ok: true });
  // set short-lived cookie to mark MFA verified for admin area
  res.headers.append('Set-Cookie', `ADMIN_MFA_VERIFIED=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24}`);
  return res;
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const isAdmin = await userHasRole(session.user.id, 'ADMIN');
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await prisma.user.update({ where: { id: session.user.id }, data: { adminMfaEnabled: false, adminMfaSecret: null } });

  const res = NextResponse.json({ ok: true });
  res.headers.append('Set-Cookie', `ADMIN_MFA_VERIFIED=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
}