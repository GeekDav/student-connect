import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "sc_session";

const studentRoutes = [
  "/accueil",
  "/residents",
  "/evenements",
  "/sos",
  "/recyclerie",
  "/messages",
  "/profil",
];

async function readRole(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    return {
      role: String(payload.role ?? ""),
      userId: String(payload.userId ?? ""),
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readRole(request);

  const needsStudent = studentRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const needsManager =
    pathname === "/gestionnaire" || pathname.startsWith("/gestionnaire/");
  const needsSuper =
    pathname === "/super-admin" || pathname.startsWith("/super-admin/");

  if ((needsStudent || needsManager || needsSuper) && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (needsSuper && session?.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    needsManager &&
    session?.role !== "MANAGER" &&
    session?.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/accueil",
    "/accueil/:path*",
    "/residents",
    "/residents/:path*",
    "/evenements",
    "/evenements/:path*",
    "/sos",
    "/sos/:path*",
    "/recyclerie",
    "/recyclerie/:path*",
    "/messages",
    "/messages/:path*",
    "/profil",
    "/profil/:path*",
    "/gestionnaire",
    "/gestionnaire/:path*",
    "/super-admin",
    "/super-admin/:path*",
  ],
};
