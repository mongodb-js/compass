import { build, Platform } from 'electron-builder';
import { rmSync, mkdirpSync, copySync } from 'fs-extra';
import path from 'path';

import { installProductionDeps } from './hooks/install-production-deps';
import { rebuildNativeModules } from './hooks/rebuild-native-modules';
import { replaceLibffmpeg } from './hooks/replace-ffmpeg';
import packageJson from './../../package.json';
import { copyChromiumLicense } from './hooks/copy-chromium-license';

const compassPackageRoot = path.resolve(__dirname, '..', '..');
const electronBuilderWorkingDir = path.resolve(
  compassPackageRoot,
  'electron_builder'
);
const distDir = path.resolve(electronBuilderWorkingDir, 'dist');
const projectDir = path.resolve(electronBuilderWorkingDir, 'project');
const bulidResourcesDir = path.resolve(electronBuilderWorkingDir, 'build');

async function prepareProjectDir() {
  mkdirpSync(projectDir);

  for (const file of ['package.json', 'LICENSE', 'build']) {
    copySync(file, path.join(projectDir, file));
  }

  await installProductionDeps({ appDir: projectDir });
  await rebuildNativeModules({
    appDir: projectDir,
    electronVersion: packageJson.devDependencies.electron,
  });

  copyChromiumLicense({ appDir: projectDir });
}

export async function runElectronBuilder(distributionInfo: {
  bundleId: string;
  productName: string;
}): Promise<void> {
  rmSync(path.resolve(electronBuilderWorkingDir), {
    recursive: true,
    force: true,
  });

  // Since we are going to run npm install we will use a different project dir
  // just for running electron-builder so it won't confuse the configuration
  // of the monorepo.
  await prepareProjectDir();

  await build({
    publish: 'never',
    projectDir: projectDir,
    targets: Platform.MAC.createTarget(),
    config: {
      directories: {
        output: distDir,
        buildResources: bulidResourcesDir,
      },
      copyright: `${new Date().getFullYear()} MongoDB Inc`,
      mac: {
        // skip codesign
        identity: null,
        icon: path.resolve(
          __dirname,
          '../../app-icons/darwin/mongodb-compass.icns'
        ),
        category: 'public.app-category.productivity',
        target: ['dmg', 'zip', 'dir'],
      },
      win: {
        icon: path.resolve(
          __dirname,
          '../../app-icons/win32/mongodb-compass.ico'
        ),
        target: ['squirrel', 'zip'],
      },
      linux: {
        icon: path.resolve(
          __dirname,
          '../../app-icons/linux/mongodb-compass.png'
        ),
        target: ['deb', 'rpm', 'tar.gz'],
      },
      dmg: {
        background: path.resolve(
          __dirname,
          '../../app-icons/darwin/background.png'
        ),
      },
      squirrelWindows: {
        msi: false,
        iconUrl: 'https://compass.mongodb.com/favicon.ico',
        loadingGif: path.resolve(
          __dirname,
          '../../app-icons/win32/mongodb-compass-installer-loading.gif'
        ),
      },
      appId: distributionInfo.bundleId,
      productName: distributionInfo.productName,
      protocols: [],
      asar: false,
      files: [
        'LICENSE',
        'build/**/*',
        'package.json',
        'node_modules',
        '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
        '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
        '!**/node_modules/*.d.ts',
        '!**/node_modules/.bin',
      ],
      asarUnpack: [
        '**/@mongosh/node-runtime-worker-thread/**',
        '**/interruptor/**',
        '**/kerberos/**',
        '**/snappy/**',
        '**/mongodb-client-encryption/index.js',
        '**/mongodb-client-encryption/package.json',
        '**/mongodb-client-encryption/lib/**',
        '**/mongodb-client-encryption/build/**',
        '**/bl/**',
        '**/nan/**',
        '**/node_modules/bindings/**',
        '**/file-uri-to-path/**',
        '**/bson/**',
      ],
      beforeBuild: async (context) => {
        await installProductionDeps(context);
        await rebuildNativeModules(context);
      },
      afterPack: replaceLibffmpeg,
      nodeGypRebuild: false,
      npmRebuild: false,
      buildDependenciesFromSource: false,
    },
  });
}
