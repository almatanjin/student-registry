import { describe, expect, test } from "vitest";
import { classify, missingGrades, parseGrade } from "./results";

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
