import { changePasswordSchema } from "@/domain/schemas/password";
import { prisma } from "@/server/db";
import { NotFoundError, ValidationError, fieldErrorsFromZod } from "@/server/http/errors";
import { hashPassword, verifyPassword } from "./password";

/**
 * Changes the signed-in person's own password after checking their current one.
 * Clears the must-change flag and moves the password version on, so sessions started
 * before the change stop working.
 */
export async function changeOwnPassword(userId: string, body: unknown): Promise<void> {
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError(fieldErrorsFromZod(parsed.error));
  const input = parsed.data;
  const newHash = await hashPassword(input.newPassword);

  await prisma.$transaction(async (tx) => {
    // Lock the account so two changes at once cannot both pass the current-password check.
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    if (!user) throw new NotFoundError();
    if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
      throw new ValidationError({ currentPassword: "Your current password is incorrect" });
    }
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash: newHash, mustChangePassword: false, passwordVersion: { increment: 1 } },
    });
  });
}
