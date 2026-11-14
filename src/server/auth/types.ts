export type Role = "STAFF" | "STUDENT";

/** The signed-in person, as carried in the session. */
export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
  /** Set for Student accounts only. */
  studentId: string | null;
};
