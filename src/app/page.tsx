import { redirect } from "next/navigation";
import { CHANGE_PASSWORD_PATH, homeFor, SESSION_ENDED_PATH } from "@/domain/access";
import { getCurrentUser } from "@/server/auth/current-user";

/** The root only sends people on: to sign-in, to the change-password page, or to their role's home page. */
export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect(SESSION_ENDED_PATH);
  redirect(user.mustChangePassword ? CHANGE_PASSWORD_PATH : homeFor(user.role));
}
