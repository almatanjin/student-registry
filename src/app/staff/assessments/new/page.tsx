import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { listModuleOptions } from "@/server/assessments/service";
import { requireStaffPage } from "@/server/auth/pages";
import { appTimeZone } from "@/server/config";
import { AssessmentForm, type ModuleOption } from "../assessment-form";

export const metadata: Metadata = { title: "New assessment · Student Registry" };

export default async function NewAssessmentPage() {
  await requireStaffPage();
  const modules = await listModuleOptions();
  const groups = new Map<string, ModuleOption[]>();
  for (const option of modules) {
    const list = groups.get(option.programme.name) ?? [];
    list.push({
      id: option.id,
      code: option.code,
      label: `${option.code} ${option.title}`,
      publishedCount: option._count.moduleResults,
    });
    groups.set(option.programme.name, list);
  }

  return (
    <>
      <PageHeader title="New assessment" back={{ href: "/staff/assessments", label: "Assessments" }} />
      <AssessmentForm
        mode="create"
        timeZone={appTimeZone()}
        moduleGroups={[...groups].map(([programme, list]) => ({ programme, modules: list }))}
      />
    </>
  );
}
