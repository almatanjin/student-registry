import { requireStaff } from "@/server/auth/guards";
import { readJson, searchParamsOf } from "@/server/http/request";
import { route } from "@/server/http/route";
import { createStudent, listStudents } from "@/server/students/service";

/** Staff: list students, with optional `q`, `programmeId`, and `status` filters. */
export const GET = route(async (request) => {
  await requireStaff();
  const students = await listStudents(searchParamsOf(request));
  return Response.json({ students });
});

/** Staff: create a student record and its Student account. */
export const POST = route(async (request) => {
  await requireStaff();
  const student = await createStudent(await readJson(request));
  return Response.json({ student }, { status: 201 });
});
