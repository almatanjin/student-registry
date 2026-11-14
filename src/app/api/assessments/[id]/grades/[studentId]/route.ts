import { requireStaff } from "@/server/auth/guards";
import { readJson } from "@/server/http/request";
import { route } from "@/server/http/route";
import { setGrade } from "@/server/results/service";

type Context = { params: Promise<{ id: string; studentId: string }> };

/** Staff: set (`{ grade: 72 }`) or clear (`{ grade: null }`) a student's grade on an assessment. */
export const PUT = route(async (request, { params }: Context) => {
  await requireStaff();
  const { id, studentId } = await params;
  return Response.json(await setGrade(id, studentId, await readJson(request)));
});
