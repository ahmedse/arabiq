import { NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { auth } from '@/auth';
import { userHasRole } from '@/lib/roles';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const isAdmin = await userHasRole(session.user.id, 'ADMIN');
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const secret = speakeasy.generateSecret({ name: `Arabiq Admin (${session.user.email})` });
  const otpauth = secret.otpauth_url as string;
  const qrDataUrl = await qrcode.toDataURL(otpauth);

  return NextResponse.json({ secret: secret.base32, otpauth, qrDataUrl });
}