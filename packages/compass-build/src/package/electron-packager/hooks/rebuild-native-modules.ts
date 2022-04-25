import { rebuild } from 'electron-rebuild';

export async function rebuildNativeModules(
  options: {
    onlyModules?: string[];
  },
  context: { buildPath: string; electronVersion: string }
): Promise<void> {
  console.info('Rebuilding native modules', { options, context });

  await rebuild({
    ...options,
    electronVersion: context.electronVersion,
    buildPath: context.buildPath,
    // `projectRootPath` is undocumented, but changes modules resolution quite
    // a bit and required for the electron-rebuild to be able to pick up
    // dependencies inside project root, but outside of their dependants (e.g.
    // a transitive dependency that was hoisted by npm installation process)
    projectRootPath: context.buildPath,
    force: true,
    // We want to ensure that we are actually rebuilding native modules on the
    // platform we are packaging. There is currently no direct way of passing a
    // --build-from-source flag to rebuild-install package, but we can force
    // rebuild by providing a tag prefix that will make prebuild think that
    // prebuilt files don't exist
    prebuildTagPrefix: 'totally-not-a-real-prefix-to-force-rebuild',
  });
}
