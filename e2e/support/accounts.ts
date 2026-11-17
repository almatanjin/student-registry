import { STAFF_ACCOUNTS } from "../../prisma/seed/staff";
import { SEED_STUDENTS } from "../../prisma/seed/students";

/** Seeded demo accounts; every one uses SEED_USER_PASSWORD from .env. */
export const STAFF_EMAIL = STAFF_ACCOUNTS[0].email;

/** The student the saved student session signs in as: Alma Tanjin, BSc, enrolled this year. */
export const STUDENT = SEED_STUDENTS[0];

export function seedPassword(): string {
  const password = process.env.SEED_USER_PASSWORD;
  if (!password) throw new Error("SEED_USER_PASSWORD is not set; add it to .env.");
  return password;
}

/** Saved sign-in sessions written by auth.setup.ts. */
export const STAFF_SESSION = "e2e/.auth/staff.json";
export const STUDENT_SESSION = "e2e/.auth/student.json";
