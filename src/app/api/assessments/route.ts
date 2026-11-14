import { createAssessment, listAssessmentsForStaff, listAssessmentsForStudent } from "@/server/assessments/service";
import { requireStaff, requireUser } from "@/server/auth/guards";
import { readJson } from "@/server/http/request";
import { route } from "@/server/http/route";

/** Staff: every assessment with submission counts. Students: their programme's assessments with their own state. */
export const GET = route(async () => {
  const user = await requireUser();
  const assessments =
    user.role === "STAFF" ? await listAssessmentsForStaff() : await listAssessmentsForStudent(user.studentId ?? "");
  return Response.json({ assessments });
});

/** Staff: create an assessment for a module. */
export const POST = route(async (request) => {
  await requireStaff();
  const assessment = await createAssessment(await readJson(request));
  return Response.json({ assessment }, { status: 201 });
});
