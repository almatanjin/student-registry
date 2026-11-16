"use client";

import { useActionState } from "react";
import { errorProps, FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePasswordAction, type ChangePasswordState } from "./actions";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(changePasswordAction, {});
  const fields = state.fields ?? {};

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <FormField id="currentPassword" label="Current password" error={fields.currentPassword}>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          {...errorProps("currentPassword", fields.currentPassword)}
        />
      </FormField>
      <FormField id="newPassword" label="New password" hint="At least 8 characters." error={fields.newPassword}>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          {...errorProps("newPassword", fields.newPassword)}
        />
      </FormField>
      <FormField id="confirmPassword" label="Confirm new password" error={fields.confirmPassword}>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...errorProps("confirmPassword", fields.confirmPassword)}
        />
      </FormField>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Changing password…" : "Change password"}
      </Button>
    </form>
  );
}
