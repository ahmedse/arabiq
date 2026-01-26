import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

const SUPPORTED_LOCALES = new Set(["en", "ar"]);

function isPublicFile(pathname: string) {
  if (pathname.startsWith("/_next/") || pathname.startsWith("/api/")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  // Any file with an extension is served from /public and must not be locale-redirected.
  // Example: /brand/arabiq-logo.jpg
  if (pathname.includes(".")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicFile(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/en";
    return NextResponse.redirect(url);
  }

  const [, locale] = pathname.split("/");

  if (!SUPPORTED_LOCALES.has(locale)) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    return NextResponse.redirect(url);
  }

  // Auth protection for /account
  if (pathname.startsWith(`/${locale}/account`)) {
    const session = await auth();
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }
  }

  // Admin area: require authenticated user with ADMIN role
  if (pathname.startsWith(`/${locale}/admin`)) {
    const session = await auth();
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }

    const userId = session?.user?.id;
    if (!userId) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }

    const { userHasRole } = await import('@/lib/roles');
    const isAdmin = await userHasRole(userId, 'ADMIN');
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/admin/access-denied`;
      return NextResponse.redirect(url);
    }

    // Optional IP allowlist enforcement for admin area
    const allowlistRaw = process.env.ADMIN_IP_ALLOWLIST ?? '';
    if (allowlistRaw.trim()) {
      const allowlist = allowlistRaw.split(',').map((s) => s.trim()).filter(Boolean);
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || '';
      if (!allowlist.includes(ip)) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/admin/access-denied`;
        return NextResponse.redirect(url);
      }
    }

    // If admin MFA enabled, require a verified cookie
    const { prisma } = await import('@/lib/prisma');
    const userRow = await prisma.user.findUnique({ where: { id: userId }, select: { adminMfaEnabled: true } });
    if (userRow?.adminMfaEnabled) {
      const mfaCookie = request.cookies.get('ADMIN_MFA_VERIFIED')?.value;
      if (!mfaCookie) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/admin/mfa/setup`;
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
