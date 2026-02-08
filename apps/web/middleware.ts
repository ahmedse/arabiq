import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LOCALES = new Set(["en", "ar"]);
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

function isPublicFile(pathname: string) {
  if (pathname.startsWith("/_next/") || pathname.startsWith("/api/")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  // Any file with an extension is served from /public and must not be locale-redirected.
  // Example: /brand/arabiq-logo.jpg
  if (pathname.includes(".")) return true;
  return false;
}

async function getStrapiUser(token: string) {
  try {
    const res = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
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

  const token = request.cookies.get('strapi_jwt')?.value;

  // Auth protection for /account
  if (pathname.startsWith(`/${locale}/account`)) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }

    const user = await getStrapiUser(token);
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }

    // Check account status and avoid redirect loops by ensuring we are not already on the target page
    if (user.accountStatus === 'suspended' && pathname !== `/${locale}/account-suspended`) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/account-suspended`;
      return NextResponse.redirect(url);
    }

    if (user.accountStatus === 'pending' && pathname !== `/${locale}/account-pending`) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/account-pending`;
      return NextResponse.redirect(url);
    }
  }

  // Admin area: require authenticated user with ADMIN role
  if (pathname.startsWith(`/${locale}/admin`)) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }

    const user = await getStrapiUser(token);
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }

    const isAdmin = user.role?.type === 'admin';
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/access-denied`;
      return NextResponse.redirect(url);
    }
  }

  // Demo protection
  if (pathname.match(new RegExp(`/${locale}/demos/[^/]+`))) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const user = await getStrapiUser(token);
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/account-${user.accountStatus}`;
      return NextResponse.redirect(url);
    }
  }

  // Add pathname to headers for layout to detect route
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
