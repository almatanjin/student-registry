import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, test } from "vitest";
import { LocalDiskStorage } from "@/server/storage/local-disk";

const root = mkdtempSync(path.join(os.tmpdir(), "registry-storage-test-"));
const storage = new LocalDiskStorage(root);

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("LocalDiskStorage", () => {
  test("stores a file under a random UUID key and reads it back", async () => {
    const key = await storage.put(new TextEncoder().encode("%PDF-1.4 sample"));

    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(new TextDecoder().decode(await storage.read(key))).toBe("%PDF-1.4 sample");
    expect(readdirSync(root)).toContain(key);
  });

  test("two files never share a key", async () => {
    const a = await storage.put(new Uint8Array([1]));
    const b = await storage.put(new Uint8Array([1]));

    expect(a).not.toBe(b);
  });

  test("removes a file", async () => {
    const key = await storage.put(new Uint8Array([1, 2, 3]));

    await storage.remove(key);

    expect(existsSync(path.join(root, key))).toBe(false);
  });

  test("removing a file that is already gone is not an error", async () => {
    await expect(storage.remove("00000000-0000-4000-8000-000000000000")).resolves.toBeUndefined();
  });

  test("refuses keys that could reach outside the upload folder", async () => {
    for (const key of ["../secret", "/etc/passwd", "a/b", ""]) {
      await expect(storage.read(key), key).rejects.toThrow(/Invalid storage key/);
    }
  });

  test("creates the upload folder when it does not exist yet", async () => {
    const fresh = new LocalDiskStorage(path.join(root, "nested", "uploads"));

    const key = await fresh.put(new Uint8Array([9]));

    expect((await fresh.read(key))[0]).toBe(9);
  });
});
