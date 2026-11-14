import path from "node:path";
import type { FileStorage } from "./file-storage";
import { LocalDiskStorage } from "./local-disk";

/** The storage for submission files, under UPLOAD_DIR (default ./uploads). */
export function fileStorage(): FileStorage {
  return new LocalDiskStorage(path.resolve(process.env.UPLOAD_DIR || "./uploads"));
}
