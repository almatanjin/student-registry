import { getAssessmentRoster, updateAssessment } from "@/server/assessments/service";
import { requireStaff } from "@/server/auth/guards";
import { readJson } from "@/server/http/request";
import { route } from "@/server/http/route";

type Context = { params: Promise<{ id: string }> };

/** Staff: the assessment with every student on its programme and their submission. */
export const GET = route(async (_request, { params }: Context) => {
  await requireStaff();
  const { id } = await params;
  return Response.json(await getAssessmentRoster(id));
});

/** Staff: change the title or deadline, or close or reopen the assessment. */
export const PATCH = route(async (request, { params }: Context) => {
  await requireStaff();
  const { id } = await params;
  return Response.json({ assessment: await updateAssessment(id, await readJson(request)) });
});
