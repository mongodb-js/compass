import path from "path";
import fs from "fs/promises";
import os from "os";

type CallbackWithTempPath = (tempPath: string) => void | Promise<void>;

export function withTempFile(fn: CallbackWithTempPath): Promise<void> {
  return withTempDir((dir) => fn(path.join(dir, "file")));
}

async function withTempDir(fn: CallbackWithTempPath): Promise<void> {
  const dir = await fs.mkdtemp((await fs.realpath(os.tmpdir())) + path.sep);
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, {
      recursive: true,
      force: true,
    });
  }
}
