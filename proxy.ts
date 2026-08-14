import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Pages anyone can visit without being logged in.
const publicRoutes = ["/login", "/signup"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.includes(pathname);

  // getSessionCookie only checks whether a session cookie is *present* —
  // it does NOT verify the session is still valid. That's intentional:
  // Proxy runs on every request (including prefetches), so it must stay
  // fast and can't afford a database round trip. This is purely a UX
  // redirect; the real security check already lives in each API route
  // (`auth.api.getSession(...)`), which does hit the database.
  const sessionCookie = getSessionCookie(request);

  if (!isPublicRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|favicon.ico).*)"],
};
