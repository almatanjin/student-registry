import { requireStaff } from "@/server/auth/guards";
import { recordPayment } from "@/server/fees/service";
import { readJson } from "@/server/http/request";
import { route } from "@/server/http/route";

type Context = { params: Promise<{ id: string }> };

/** Staff: record a payment against a student. */
export const POST = route(async (request, { params }: Context) => {
  const user = await requireStaff();
  const { id } = await params;
  const payment = await recordPayment(id, await readJson(request), user.id);
  return Response.json({ payment }, { status: 201 });
});
