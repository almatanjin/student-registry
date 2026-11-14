/** Where submission files live. Handlers depend on this interface, so the local-disk store can be swapped for S3. */
export interface FileStorage {
  /** Saves the bytes under a new random key and returns the key. */
  put(bytes: Uint8Array): Promise<string>;
  read(key: string): Promise<Uint8Array>;
  /** Removes the file; a file that is already gone is not an error. */
  remove(key: string): Promise<void>;
}
