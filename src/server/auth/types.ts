export type Role = "STAFF" | "STUDENT";

/** The signed-in person, as carried in the session. */
export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
  /** Set for Student accounts only. */
  studentId: string | null;
  /** True until the person replaces a password that staff set for them. */
  mustChangePassword: boolean;
};

/** An account whose email and password have just been checked, with the password version the session records. */
export type VerifiedAccount = CurrentUser & { passwordVersion: number };
