import path from 'path';
import { rebuild } from 'electron-rebuild';
import { fromElectronVersion as getNapiVersionFromElectron } from 'node-api-version';
import { promises as fs } from 'fs';

export async function getElectronVersion(dest: string): Promise<string> {
  return JSON.parse(
    await fs.readFile(
      require.resolve('electron/package.json', { paths: [dest] }),
      'utf-8'
    )
  ).version;
}

export async function rebuildNativeModules(
  buildPath: string,
  options: { projectRootPath?: string }
): Promise<void> {
  buildPath = path.resolve(buildPath);

  console.info('Rebuilding native modules', { buildPath, options });

  const electronVersion = await getElectronVersion(buildPath);
  const napiVersion = getNapiVersionFromElectron(electronVersion);

  if (!napiVersion) {
    throw new Error(
      `Unable to identify NAPI version for electron ${electronVersion}`
    );
  }

  console.info(`Setting napi version to ${napiVersion}`);
  process.env.npm_config_napi_build_version = `${napiVersion}`;

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
    buildPath: buildPath,
    // `projectRootPath` is undocumented, but changes modules resolution quite
    // a bit and required for the electron-rebuild to be able to pick up
    // dependencies inside project root, but outside of their dependants (e.g.
    // a transitive dependency that was hoisted by npm installation process)
    projectRootPath: options.projectRootPath
      ? path.resolve(buildPath, options.projectRootPath)
      : undefined,
    force: true,
    // We want to ensure that we are actually rebuilding native modules on the
    // platform we are packaging. There is currently no direct way of passing a
    // --build-from-source flag to rebuild-install package, but we can force
    // rebuild by providing a tag prefix that will make prebuild think that
    // prebuilt files don't exist
    prebuildTagPrefix: 'totally-not-a-real-prefix-to-force-rebuild',
  });
}
