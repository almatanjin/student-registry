import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2, LogOut } from "lucide-react";
import { signOutAction } from "@/app/sign-in/actions";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ROLE_NAV } from "@/components/role-nav";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { homeFor } from "@/domain/access";
import { requireSignedInPage } from "@/server/auth/pages";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Change password · Student Registry" };

export default async function ChangePasswordPage({ searchParams }: PageProps<"/change-password">) {
  const user = await requireSignedInPage();

  // A forced change shows only the form: every other page is closed until the password is changed.
  if (user.mustChangePassword) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-6 bg-muted/40 px-4 pt-[12vh] pb-12">
        <div className="flex flex-col items-center gap-3">
          {/* Decorative: the name is written next to the mark. */}
          <Image src="/pen-mark.svg" alt="" width={56} height={56} unoptimized priority />
          <p className="text-lg font-semibold">Student Registry</p>
        </div>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl">
              <h1>Change password</h1>
            </CardTitle>
            <CardDescription>
              Choose a new password before you continue. The one you signed in with was set by the Registry team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
          <CardFooter className="justify-center">
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut />
                Sign out
              </Button>
            </form>
          </CardFooter>
        </Card>
      </main>
    );
  }

  const changed = (await searchParams).changed === "1";
  const role = ROLE_NAV[user.role];
  return (
    <AppShell homeHref={homeFor(user.role)} roleLabel={role.label} nav={role.items} email={user.email}>
      <PageHeader title="Change password" description={`Signed in as ${user.email}`} />
      <Card className="max-w-md">
        <CardContent className="grid gap-4">
          {changed ? (
            <Alert>
              <CheckCircle2 />
              <AlertDescription>Your password has been changed.</AlertDescription>
            </Alert>
          ) : null}
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </AppShell>
  );
}
