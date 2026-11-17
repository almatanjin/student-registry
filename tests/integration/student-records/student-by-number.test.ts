import { beforeEach, describe, expect, test } from "vitest";
import { NotFoundError } from "@/server/http/errors";
import { getStudentByNumber } from "@/server/students/service";
import { resetDatabase } from "../helpers/database";
import { createProgramme, createStudentRecord } from "../helpers/fixtures";

let programmeId: string;

beforeEach(async () => {
  await resetDatabase();
  programmeId = (await createProgramme({ code: "BSC-CS", name: "BSc Computer Science" })).id;
});

describe("Looking up a student by Student ID", () => {
  test("a known Student ID returns that student", async () => {
    await createStudentRecord({ programmeId, studentNumber: "SMS-2026-0001", fullName: "Someone Else" });
    const wanted = await createStudentRecord({ programmeId, studentNumber: "SMS-2026-0002", fullName: "Amara Okafor" });

    const student = await getStudentByNumber("SMS-2026-0002");

    expect(student).toMatchObject({
      id: wanted.id,
      studentNumber: "SMS-2026-0002",
      fullName: "Amara Okafor",
      programme: { id: programmeId, code: "BSC-CS" },
    });
  });

  test("an unknown Student ID is not found", async () => {
    await createStudentRecord({ programmeId, studentNumber: "SMS-2026-0001" });

    await expect(getStudentByNumber("SMS-2026-9999")).rejects.toBeInstanceOf(NotFoundError);
  });

  test("the internal database id is not accepted as a Student ID", async () => {
    const student = await createStudentRecord({ programmeId, studentNumber: "SMS-2026-0001" });

    await expect(getStudentByNumber(student.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
