import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { apiAccess, pageRedirect } from "@/domain/access";
import { UnauthorizedError, toErrorResponse } from "@/server/http/errors";

// Uses the database-free Auth.js settings: the proxy only reads the signed session cookie.
const { auth } = NextAuth(authConfig);

/**
 * Optimistic checks before a request reaches a page or route:
 * signed-out visitors go to sign-in, a person who must change their password is held on that page,
 * and each role is kept to its own pages.
 * Route Handlers and pages still check the role and ownership themselves.
 */
export const proxy = auth((request) => {
  const { pathname } = request.nextUrl;
  const role = request.auth?.user?.role ?? null;
  const mustChangePassword = request.auth?.user?.mustChangePassword ?? false;

  if (pathname.startsWith("/api/")) {
    return apiAccess(pathname, role !== null) === "allow"
      ? NextResponse.next()
      : toErrorResponse(new UnauthorizedError());
  }

  const target = pageRedirect(pathname, role, mustChangePassword);
  return target ? NextResponse.redirect(new URL(target, request.nextUrl)) : NextResponse.next();
});

export const config = {
  // Everything except Next.js assets and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
