import { describe, expect, test } from "vitest";
import { formatMoney, parseMoneyToMinor } from "./money";

describe("formatMoney", () => {
  test("shows minor units with two decimals, thousands separators, and the currency", () => {
    expect(formatMoney(900_000, "GBP")).toBe("£9,000.00");
  });

  test("keeps pence exactly", () => {
    expect(formatMoney(250_005, "GBP")).toBe("£2,500.05");
    expect(formatMoney(1, "GBP")).toBe("£0.01");
  });

  test("shows zero as 0.00", () => {
    expect(formatMoney(0, "GBP")).toBe("£0.00");
  });

  test("uses the configured currency", () => {
    expect(formatMoney(150_000, "EUR")).toBe("€1,500.00");
  });
});

describe("parseMoneyToMinor", () => {
  test("reads whole amounts and up to two decimals, with or without thousands separators", () => {
    expect(parseMoneyToMinor("2500")).toBe(250_000);
    expect(parseMoneyToMinor("2,500.00")).toBe(250_000);
    expect(parseMoneyToMinor(" 1200.5 ")).toBe(120_050);
    expect(parseMoneyToMinor("0.01")).toBe(1);
  });

  test("avoids floating-point rounding", () => {
    expect(parseMoneyToMinor("0.29")).toBe(29);
    expect(parseMoneyToMinor("1234567.89")).toBe(123_456_789);
  });

  test("rejects three decimals, negatives, signs, and text", () => {
    for (const bad of ["1.234", "-5", "+5", "abc", "", "1,00.00", "1.", ".5", "1e3"]) {
      expect(parseMoneyToMinor(bad), bad).toBeNull();
    }
  });
});
