import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileStorage } from "./file-storage";

const KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Stores files in one folder, each under a random UUID, so names from users never reach the file system. */
export class LocalDiskStorage implements FileStorage {
  constructor(private readonly root: string) {}

  private pathFor(key: string): string {
    if (!KEY_PATTERN.test(key)) throw new Error(`Invalid storage key: ${JSON.stringify(key)}`);
    return path.join(this.root, key);
  }

  async put(bytes: Uint8Array): Promise<string> {
    await mkdir(this.root, { recursive: true });
    const key = randomUUID();
    await writeFile(this.pathFor(key), bytes, { flag: "wx" });
    return key;
  }

  async read(key: string): Promise<Uint8Array> {
    return readFile(this.pathFor(key));
  }

  async remove(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }
}
