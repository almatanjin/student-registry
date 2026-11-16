import { z } from "zod";

/** A password chosen by a person or set by staff: 8 to 200 characters. */
const password = z
  .string("Use at least 8 characters")
  .min(8, "Use at least 8 characters")
  .max(200, "Use 200 characters or fewer");

/** A signed-in person changing their own password. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string("Enter your current password").min(1, "Enter your current password"),
    newPassword: password,
    confirmPassword: z.string("Enter the new password again").min(1, "Enter the new password again"),
  })
  .superRefine((input, context) => {
    if (input.confirmPassword !== input.newPassword) {
      context.addIssue({ code: "custom", path: ["confirmPassword"], message: "The passwords do not match" });
    } else if (input.newPassword === input.currentPassword) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Choose a password different from your current one",
      });
    }
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Staff setting a temporary password for a student. */
export const resetPasswordSchema = z.object({ temporaryPassword: password });
