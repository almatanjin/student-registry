import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/server/auth/types";

const EIGHT_HOURS = 8 * 60 * 60;

/**
 * Auth.js settings shared by the full server setup (src/auth.ts) and the proxy.
 * It has no database access, so the proxy can load it cheaply.
 */
export const authConfig = {
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt", maxAge: EIGHT_HOURS },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.studentId = user.studentId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.role = token.role;
      session.user.studentId = token.studentId ?? null;
      return session;
    },
  },
} satisfies NextAuthConfig;

declare module "next-auth" {
  interface User {
    role: Role;
    studentId: string | null;
  }
  interface Session {
    user: { id: string; email: string; role: Role; studentId: string | null };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    studentId: string | null;
  }
}
