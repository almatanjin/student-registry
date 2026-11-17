import { describe, expect, test } from "vitest";
import { classify, missingGrades, moduleResultStatus, parseGrade, type ModuleResultCounts } from "./results";

describe("classify", () => {
  test("Classification boundaries", () => {
    expect([39, 40, 59, 60, 69, 70].map(classify)).toEqual([
      "Fail",
      "Pass",
      "Pass",
      "Merit",
      "Merit",
      "Distinction",
    ]);
  });

  test("the ends of the scale", () => {
    expect(classify(0)).toBe("Fail");
    expect(classify(100)).toBe("Distinction");
  });
});

describe("parseGrade", () => {
  test("accepts whole numbers from 0 to 100, as numbers or text", () => {
    expect(parseGrade(72)).toBe(72);
    expect(parseGrade("0")).toBe(0);
    expect(parseGrade(" 100 ")).toBe(100);
  });

  test("Out-of-range or non-numeric grade", () => {
    for (const bad of [-1, 101, 65.5, "65.5", "text", "", "1e2", null, undefined, true]) {
      expect(parseGrade(bad), String(bad)).toBeNull();
    }
  });
});

describe("missingGrades", () => {
  const assessments = [
    { id: "a1", title: "Lab report" },
    { id: "a2", title: "Essay" },
  ];

  test("complete when every assessment in the module has a grade", () => {
    expect(missingGrades(assessments, new Set(["a1", "a2"]))).toEqual([]);
  });

  test("Missing grade", () => {
    expect(missingGrades(assessments, new Set(["a1"]))).toEqual(["Essay"]);
  });

  test("a module with no assessments has nothing to publish", () => {
    expect(missingGrades([], new Set())).toBeNull();
  });
});

describe("moduleResultStatus", () => {
  const counts = (overrides: Partial<ModuleResultCounts> = {}): ModuleResultCounts => ({
    students: 4,
    ready: 0,
    waiting: 0,
    withheld: 0,
    published: 0,
    ...overrides,
  });

  test("Module without assessments", () => {
    expect(moduleResultStatus(0, counts({ students: 0 }))).toEqual({ label: "No assessments yet", tone: "neutral" });
    expect(moduleResultStatus(0, counts({ waiting: 4 }))).toEqual({ label: "No assessments yet", tone: "neutral" });
  });

  test("Programme without students", () => {
    expect(moduleResultStatus(2, counts({ students: 0 }))).toEqual({ label: "No students yet", tone: "neutral" });
  });

  test("Results ready to publish", () => {
    expect(moduleResultStatus(2, counts({ ready: 2, waiting: 1, withheld: 1 }))).toEqual({
      label: "2 ready to publish",
      tone: "blue",
    });
    expect(moduleResultStatus(1, counts({ ready: 1, published: 3 }))).toEqual({ label: "1 ready to publish", tone: "blue" });
  });

  test("Only incomplete results left", () => {
    expect(moduleResultStatus(2, counts({ waiting: 2, withheld: 1, published: 1 }))).toEqual({
      label: "Waiting for grades",
      tone: "neutral",
    });
  });

  test("Nothing left except withheld results", () => {
    expect(moduleResultStatus(2, counts({ withheld: 1, published: 3 }))).toEqual({ label: "1 withheld", tone: "purple" });
  });

  test("Everything published", () => {
    expect(moduleResultStatus(2, counts({ published: 4 }))).toEqual({ label: "All published", tone: "green" });
  });
});
