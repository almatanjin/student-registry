import { requireStaff, requireStudentOwner } from "@/server/auth/guards";
import { readJson } from "@/server/http/request";
import { route } from "@/server/http/route";
import { getStudent, updateStudent } from "@/server/students/service";

type Context = { params: Promise<{ id: string }> };

/** Staff, or the student themself: read one student record. */
export const GET = route(async (_request, { params }: Context) => {
  const { id } = await params;
  await requireStudentOwner(id);
  return Response.json({ student: await getStudent(id) });
});

/** Staff: change some of a student's details. */
export const PATCH = route(async (request, { params }: Context) => {
  await requireStaff();
  const { id } = await params;
  return Response.json({ student: await updateStudent(id, await readJson(request)) });
});
