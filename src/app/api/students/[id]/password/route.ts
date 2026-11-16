import { requireStaff } from "@/server/auth/guards";
import { readJson } from "@/server/http/request";
import { route } from "@/server/http/route";
import { resetStudentPassword } from "@/server/students/service";

type Context = { params: Promise<{ id: string }> };

/**
 * Staff: set a temporary password for a student who cannot sign in.
 * The student must change it at their next sign-in. The response has no body,
 * so the password is never sent back.
 */
export const PUT = route(async (request, { params }: Context) => {
  await requireStaff();
  const { id } = await params;
  await resetStudentPassword(id, await readJson(request));
  return new Response(null, { status: 204 });
});
