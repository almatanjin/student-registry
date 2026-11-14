import { existsSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { vi } from "vitest";
import { session } from "./helpers/session";

// Integration tests always run against the separate test database.
if (existsSync(".env")) process.loadEnvFile(".env");

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  throw new Error("TEST_DATABASE_URL is not set; copy .env.example to .env and fill it in.");
}
process.env.DATABASE_URL = testUrl;

// Uploaded files from integration tests go to a throwaway folder.
process.env.UPLOAD_DIR = mkdtempSync(path.join(os.tmpdir(), "registry-integration-uploads-"));

// Sessions: tests choose the signed-in user with actAs() from helpers/session.
vi.mock("@/server/auth/current-user", () => ({
  getCurrentUser: async () => session.user,
}));
