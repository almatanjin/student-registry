import { requireStudent } from "@/server/auth/guards";
import { route } from "@/server/http/route";
import { readUpload, submitFile } from "@/server/submissions/service";

type Context = { params: Promise<{ id: string }> };

/** Students: upload (or, before the deadline, replace) their PDF or DOCX file for an assessment. */
export const POST = route(async (request, { params }: Context) => {
  const user = await requireStudent();
  const { id } = await params;
  const file = await readUpload(request);
  const submission = await submitFile(id, user.studentId, file);
  return Response.json({ submission }, { status: 201 });
});
