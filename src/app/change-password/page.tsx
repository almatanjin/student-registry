import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LogOut } from "lucide-react";
import { signOutAction } from "@/app/sign-in/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { homeFor } from "@/domain/access";
import { requireSignedInPage } from "@/server/auth/pages";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Change password · Student Registry" };

export default async function ChangePasswordPage({ searchParams }: PageProps<"/change-password">) {
  const user = await requireSignedInPage();
  const changed = (await searchParams).changed === "1" && !user.mustChangePassword;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            <h1>Change password</h1>
          </CardTitle>
          <CardDescription>
            {user.mustChangePassword
              ? "Choose a new password before you continue. The one you signed in with was set by the Registry team."
              : `Signed in as ${user.email}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {changed ? (
            <Alert>
              <CheckCircle2 />
              <AlertDescription>Your password has been changed.</AlertDescription>
            </Alert>
          ) : null}
          <ChangePasswordForm />
        </CardContent>
        <CardFooter className="justify-center">
          {user.mustChangePassword ? (
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut />
                Sign out
              </Button>
            </form>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href={homeFor(user.role)}>
                <ArrowLeft />
                Back to the registry
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
