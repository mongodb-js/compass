/* eslint-disable @typescript-eslint/no-require-imports */
const attempts = [
  [() => require('interruptor'), 'interruptor'],
  [() => require('keytar'), 'keytar'],
  [() => require('kerberos'), 'kerberos'],
  [() => require('os-dns-native'), 'os-dns-native'],
  [
    () =>
      process.platform === 'win32' && require('win-export-certificate-and-key'),
    'win-export-certificate-and-key',
  ],
  [
    () =>
      process.platform === 'darwin' &&
      require('macos-export-certificate-and-key'),
    'macos-export-certificate-and-key',
  ],
] as const;
const expectedPackages: string[] =
  require('../../package.json').config.hadron.rebuild.onlyModules;
if (
  expectedPackages.some((pkg) => !attempts.find(([, pkg2]) => pkg === pkg2))
) {
  throw new Error('Missing optional dependency in optional-deps.ts');
}

export function missingOptionalDeps() {
  const missing: { pkg: string; error: string }[] = [];
  for (const [tryRequire, pkg] of attempts) {
    try {
      tryRequire();
    } catch (err) {
      missing.push({ pkg, error: String(err) });
    }
  }
  return missing;
}
