import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { homeFor, SIGN_IN_PATH } from "@/domain/access";
import { getCurrentUser } from "@/server/auth/current-user";

/**
 * Ends a session the server no longer accepts, such as one started before a password reset,
 * by clearing its cookie and showing sign-in. A session that is still valid is left alone,
 * so a link to this route cannot sign anyone out.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  await signOut({ redirectTo: SIGN_IN_PATH });
}
