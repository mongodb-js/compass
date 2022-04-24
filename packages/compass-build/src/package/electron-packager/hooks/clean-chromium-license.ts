import path from 'path';
import { promises as fs } from 'fs';

/**
 * Remove a malicious link from chromium license
 * See: COMPASS-5333
 */
export async function cleanChromiumLicense(context: {
  buildPath: string;
}): Promise<void> {
  const chromiumLicensePath = path.join(
    context.buildPath,
    'LICENSES.chromium.html'
  );

  const chromiumLicense = await fs.readFile(chromiumLicensePath, 'utf8');

  await fs.writeFile(
    chromiumLicensePath,
    chromiumLicense.replace(/www\.opsycon\.(se|com)/g, '')
  );
}
