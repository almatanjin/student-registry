import { prisma } from "@/server/db";

export type ProgrammeOption = { id: string; code: string; name: string };

/** Programmes for pickers and filters, in a stable order. */
export function listProgrammeOptions(): Promise<ProgrammeOption[]> {
  return prisma.programme.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } });
}

export type ProgrammeDetail = ProgrammeOption & {
  annualFeeMinor: number;
  feePlan: { sequence: number; amountMinor: number; dueMonth: number; dueDay: number }[];
  modules: { id: string; code: string; title: string }[];
};

/** Programmes with their fee plans and modules, for the read-only Programmes page. */
export function listProgrammeDetails(): Promise<ProgrammeDetail[]> {
  return prisma.programme.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      annualFeeMinor: true,
      feePlan: { select: { sequence: true, amountMinor: true, dueMonth: true, dueDay: true }, orderBy: { sequence: "asc" } },
      modules: { select: { id: true, code: true, title: true }, orderBy: { code: "asc" } },
    },
  });
}
