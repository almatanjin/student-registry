import os from "node:os";
import path from "node:path";

/** Upload folder shared by the app under test and the seed that Playwright's global setup runs. */
export const E2E_UPLOAD_DIR = path.join(os.tmpdir(), "student-registry-e2e-uploads");
