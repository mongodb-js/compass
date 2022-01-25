import path from 'path';
import os from 'os';
import fs from 'fs';

const initialStorageMixinValue = process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST_BASE_PATH;

const tmpDir = fs.mkdtempSync(
  path.join(os.tmpdir(), 'saved-aggregations-queries-test')
);
process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST_BASE_PATH = tmpDir;

export const cleanUp = (): void => {
  process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST_BASE_PATH = initialStorageMixinValue;
  fs.rmdirSync(tmpDir, { recursive: true });
};
