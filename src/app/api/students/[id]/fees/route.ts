import { requireStudentOwner } from "@/server/auth/guards";
import { getStudentFees } from "@/server/fees/service";
import { route } from "@/server/http/route";

type Context = { params: Promise<{ id: string }> };

/** Staff, or the student themself: the bill, balance, and payment history. */
export const GET = route(async (_request, { params }: Context) => {
  const { id } = await params;
  await requireStudentOwner(id);
  return Response.json({ fees: await getStudentFees(id) });
});
