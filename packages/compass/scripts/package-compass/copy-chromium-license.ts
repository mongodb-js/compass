import fs from 'fs';
import path from 'path';

export function copyChromiumLicense(context: { appDir: string }): void {
  const chromiumLicenseSourcePath = require.resolve(
    'electron/dist/LICENSES.chromium.html'
  );
  const chromiumLicense = fs.readFileSync(chromiumLicenseSourcePath, 'utf8');

  // Remove a malicious link from chromium license. See: COMPASS-5333
  fs.writeFileSync(
    path.resolve(context.appDir, 'LICENSES.chromium.html'),
    chromiumLicense.replace(/www\.opsycon\.(se|com)/g, '')
  );
}
