"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { callApi } from "@/lib/api-client";

/** Closes or reopens an assessment for submissions. */
export function OpenToggle({ assessmentId, isOpen }: { assessmentId: string; isOpen: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setPending(true);
    setError(null);
    const result = await callApi(`/api/assessments/${assessmentId}`, { method: "PATCH", json: { isOpen: !isOpen } });
    setPending(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" onClick={toggle} disabled={pending}>
        {isOpen ? <Lock /> : <LockOpen />}
        {isOpen ? "Close for submissions" : "Reopen for submissions"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </>
  );
}
