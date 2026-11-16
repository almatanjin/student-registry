import type { Metadata } from "next";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in · Student Registry" };

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-muted/40 px-4 pt-[12vh] pb-12">
      <div className="flex flex-col items-center gap-3">
        {/* Decorative: the name is written next to the mark. */}
        <Image src="/pen-mark.svg" alt="" width={64} height={64} unoptimized priority />
        <p className="text-lg font-semibold">Student Registry</p>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            <h1>Sign in</h1>
          </CardTitle>
          <CardDescription>Sign in with your registry account.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </main>
  );
}
