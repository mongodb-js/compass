import { rebuild } from 'electron-rebuild';
import type { BeforeBuildContext } from 'electron-builder';

export async function rebuildNativeModules(context: {
  appDir: string;
  electronVersion?: string | null;
}): Promise<void> {
  const { appDir, electronVersion } = context;

  if (typeof electronVersion !== 'string') {
    throw new Error('Missing electronVersion');
  }

  await rebuild({
    onlyModules: [
      'interruptor',
      'keytar',
      'kerberos',
      'os-dns-native',
      'win-export-certificate-and-key',
      'macos-export-certificate-and-key',
    ],
    electronVersion: electronVersion,
    buildPath: appDir,
    // `projectRootPath` is undocumented, but changes modules resolution quite
    // a bit and required for the electron-rebuild to be able to pick up
    // dependencies inside project root, but outside of their dependants (e.g.
    // a transitive dependency that was hoisted by npm installation process)
    projectRootPath: appDir,
    force: true,
    // We want to ensure that we are actually rebuilding native modules on the
    // platform we are packaging. There is currently no direct way of passing a
    // --build-from-source flag to rebuild-install package, but we can force
    // rebuild by providing a tag prefix that will make prebuild think that
    // prebuilt files don't exist
    prebuildTagPrefix: 'totally-not-a-real-prefix-to-force-rebuild',
  });
}
