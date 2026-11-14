import { requireUser } from "@/server/auth/guards";
import { route } from "@/server/http/route";
import { attachmentHeader, readSubmissionFile } from "@/server/submissions/service";

type Context = { params: Promise<{ id: string }> };

/** Staff, or the student who submitted it: download a submitted file. */
export const GET = route(async (_request, { params }: Context) => {
  const user = await requireUser();
  const { id } = await params;
  const file = await readSubmissionFile(id, user);
  return new Response(new Blob([new Uint8Array(file.bytes)]), {
    headers: {
      "content-type": file.mimeType,
      "content-disposition": attachmentHeader(file.name),
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
});
