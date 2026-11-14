import { requireStudentOwner } from "@/server/auth/guards";
import { route } from "@/server/http/route";
import { getStudentResults } from "@/server/results/service";

type Context = { params: Promise<{ id: string }> };

/** The student's marksheet, or staff viewing it: grades appear only for Published modules. */
export const GET = route(async (_request, { params }: Context) => {
  const { id } = await params;
  await requireStudentOwner(id);
  return Response.json({ modules: await getStudentResults(id) });
});
