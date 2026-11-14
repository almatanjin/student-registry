import { redirect } from "next/navigation";
import { homeFor, SIGN_IN_PATH } from "@/domain/access";
import { getCurrentUser } from "@/server/auth/current-user";

/** The root only sends people on: to sign-in, or to their role's home page. */
export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? homeFor(user.role) : SIGN_IN_PATH);
}
