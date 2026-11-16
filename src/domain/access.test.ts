import { describe, expect, test } from "vitest";
import { apiAccess, homeFor, pageRedirect } from "./access";

describe("homeFor", () => {
  test("Staff land on the Registry dashboard and Students on their assessments", () => {
    expect(homeFor("STAFF")).toBe("/staff/dashboard");
    expect(homeFor("STUDENT")).toBe("/student/assessments");
  });
});

describe("pageRedirect while a password must be changed", () => {
  test("Trying to skip the change", () => {
    expect(pageRedirect("/student/assessments", "STUDENT", true)).toBe("/change-password");
    expect(pageRedirect("/staff/dashboard", "STAFF", true)).toBe("/change-password");
    expect(pageRedirect("/", "STUDENT", true)).toBe("/change-password");
    expect(pageRedirect("/sign-in", "STUDENT", true)).toBe("/change-password");
  });

  test("the change-password page itself stays open", () => {
    expect(pageRedirect("/change-password", "STUDENT", true)).toBeNull();
  });

  test("the change-password page is open to anyone signed in, and closed to signed-out visitors", () => {
    expect(pageRedirect("/change-password", "STAFF")).toBeNull();
    expect(pageRedirect("/change-password", "STUDENT", false)).toBeNull();
    expect(pageRedirect("/change-password", null)).toBe("/sign-in");
  });
});

describe("pageRedirect for a session that has ended", () => {
  test("the session-ended page is reachable whatever the session says, so the cookie can be cleared", () => {
    expect(pageRedirect("/session-ended", "STUDENT")).toBeNull();
    expect(pageRedirect("/session-ended", "STAFF", true)).toBeNull();
  });

  test("signed-out visitors go straight to sign-in", () => {
    expect(pageRedirect("/session-ended", null)).toBe("/sign-in");
  });
});

describe("pageRedirect", () => {
  test("Visiting a page while signed out", () => {
    expect(pageRedirect("/staff/students", null)).toBe("/sign-in");
    expect(pageRedirect("/student/fees", null)).toBe("/sign-in");
    expect(pageRedirect("/", null)).toBe("/sign-in");
  });

  test("the sign-in page is open to signed-out visitors", () => {
    expect(pageRedirect("/sign-in", null)).toBeNull();
  });

  test("a signed-in person on the sign-in page goes to their home page", () => {
    expect(pageRedirect("/sign-in", "STAFF")).toBe("/staff/dashboard");
    expect(pageRedirect("/sign-in", "STUDENT")).toBe("/student/assessments");
  });

  test("the root sends each role to its home page", () => {
    expect(pageRedirect("/", "STAFF")).toBe("/staff/dashboard");
    expect(pageRedirect("/", "STUDENT")).toBe("/student/assessments");
  });

  test("Student opens a staff page", () => {
    expect(pageRedirect("/staff/students", "STUDENT")).toBe("/student/assessments");
    expect(pageRedirect("/staff", "STUDENT")).toBe("/student/assessments");
  });

  test("Staff opening a student page go to their own home page", () => {
    expect(pageRedirect("/student/marksheet", "STAFF")).toBe("/staff/dashboard");
  });

  test("each role may stay on its own pages", () => {
    expect(pageRedirect("/staff/students/abc", "STAFF")).toBeNull();
    expect(pageRedirect("/student/fees", "STUDENT")).toBeNull();
  });

  test("a path that only starts with the same letters is not a staff page", () => {
    expect(pageRedirect("/staffroom", "STUDENT")).toBeNull();
  });
});

describe("apiAccess", () => {
  test("Calling an API route while signed out", () => {
    expect(apiAccess("/api/students", false)).toBe("unauthorized");
  });

  test("the sign-in routes stay open while signed out", () => {
    expect(apiAccess("/api/auth/callback/credentials", false)).toBe("allow");
    expect(apiAccess("/api/auth/session", false)).toBe("allow");
  });

  test("a signed-in session may call API routes, which check roles themselves", () => {
    expect(apiAccess("/api/students", true)).toBe("allow");
  });
});
