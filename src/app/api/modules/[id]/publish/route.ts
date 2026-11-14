import { requireStaff } from "@/server/auth/guards";
import { route } from "@/server/http/route";
import { publishModule } from "@/server/results/service";

type Context = { params: Promise<{ id: string }> };

/** Staff: publish every complete, Pending result on a module; reports how many were published and skipped. */
export const POST = route(async (_request, { params }: Context) => {
  await requireStaff();
  const { id } = await params;
  return Response.json(await publishModule(id));
});
