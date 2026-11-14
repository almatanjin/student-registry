/** Student ID such as SMS-2025-0001: the academic start year and a per-year sequence, at least 4 digits. */
export function formatStudentNumber(academicYearStart: number, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new RangeError(`Student ID sequence must be a positive whole number, got ${sequence}.`);
  }
  return `SMS-${academicYearStart}-${String(sequence).padStart(4, "0")}`;
}
