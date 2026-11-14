import { z } from "zod";
import type { IsoDate } from "../dates";
import { parseMoneyToMinor } from "../money";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** A payment as staff enter it: amount as text ("2,500.00"), the date paid, and the bank or receipt reference. */
export function recordPaymentSchema(today: IsoDate) {
  return z.object({
    amount: z
      .union([z.string(), z.number()], "Enter the amount")
      .transform((value) => parseMoneyToMinor(String(value)))
      .refine((minor) => minor !== null, "Enter an amount with at most two decimal places, such as 250.00")
      .refine((minor) => (minor ?? 0) > 0, "The amount must be greater than zero")
      .transform((minor) => minor as number),
    paidOn: z
      .string("Enter the payment date")
      .regex(isoDate, "Enter the payment date")
      .refine(isRealDate, "Enter a real date")
      .refine((value) => value <= today, "The payment date cannot be in the future"),
    reference: z
      .string("Enter the reference number")
      .trim()
      .min(1, "Enter the reference number")
      .max(100, "Use 100 characters or fewer"),
  });
}

export type RecordPaymentInput = z.infer<ReturnType<typeof recordPaymentSchema>>;
