import { requireStaff } from "@/server/auth/guards";
import { readJson } from "@/server/http/request";
import { route } from "@/server/http/route";
import { setResultState } from "@/server/results/service";

type Context = { params: Promise<{ id: string; moduleId: string }> };

/** Staff: publish, withhold, or return to Pending one student's results for one module. */
export const PUT = route(async (request, { params }: Context) => {
  await requireStaff();
  const { id, moduleId } = await params;
  return Response.json({ result: await setResultState(id, moduleId, await readJson(request)) });
});
