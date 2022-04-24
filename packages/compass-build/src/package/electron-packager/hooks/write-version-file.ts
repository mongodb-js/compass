import path from 'path';
import { promises as fs } from 'fs';
import createDebug from 'debug';

const debug = createDebug('mongodb-compass:compass-build:write-version-file');

export async function writeVersionFile(
  version: string,
  context: { buildPath: string }
): Promise<void> {
  const dest = path.join(context.buildPath, 'version');
  await fs.writeFile(dest, version);
  debug('version written to ', dest);
}
