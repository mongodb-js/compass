import type { Configuration } from 'electron-builder';
import { build, Platform } from 'electron-builder';
import { rmSync, mkdirpSync, copySync } from 'fs-extra';
import path from 'path';
import fs from 'fs';

import { installProductionDeps } from './install-production-deps';
import { rebuildNativeModules } from './rebuild-native-modules';
import { replaceLibffmpeg } from './replace-ffmpeg';
import packageJson from '../../package.json';
import { copyChromiumLicense } from './copy-chromium-license';

const compassPackageRoot = path.resolve(__dirname, '..', '..');
const electronBuilderWorkingDir = path.resolve(
  compassPackageRoot,
  'electron_builder'
);
const distDir = path.resolve(electronBuilderWorkingDir, 'dist');
const projectDir = path.resolve(electronBuilderWorkingDir, 'project');
const bulidResourcesDir = path.resolve(electronBuilderWorkingDir, 'build');

async function prepareProjectDir(distributionInfo: { productName: string }) {
  console.log('Creating project dir', projectDir);
  mkdirpSync(projectDir);

  console.log('Copying project files to', projectDir);
  for (const file of ['LICENSE', 'build']) {
    copySync(file, path.join(projectDir, file));
  }

  // We clean up the package.json as it may contain settings
  // that would affect electron-builder
  const {
    name,
    main,
    version,
    dependencies,
    engines,
    author,
    description,
    license,
    devDependencies,
    repository,
  } = packageJson;

  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify({
      name,
      version,
      productName: distributionInfo.productName,
      description,
      author,
      engines,
      license,
      dependencies,
      main,
      repository,
      devDependencies: {
        electron: devDependencies.electron,
      },
    })
  );

  console.log('Installing production deps');
  await installProductionDeps({ appDir: projectDir });

  console.log('Rebuilding native modules');
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
  console.log('Cleaning up working dir', electronBuilderWorkingDir);

  rmSync(path.resolve(electronBuilderWorkingDir), {
    recursive: true,
    force: true,
  });

  // Since we are going to run npm install we will use a different project dir
  // just for running electron-builder so it won't confuse the configuration
  // of the monorepo.
  await prepareProjectDir(distributionInfo);

  const electronBuilderConfig: Configuration = {
    publish: [],
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
      remoteReleases: false,
      iconUrl: 'https://compass.mongodb.com/favicon.ico',
      loadingGif: path.resolve(
        __dirname,
        '../../app-icons/win32/mongodb-compass-installer-loading.gif'
      ),
      name: distributionInfo.productName.replace(/ /g, ''),
    },
    appId: distributionInfo.bundleId,
    productName: distributionInfo.productName,
    protocols: [],
    asar: true,
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
  };

  console.log(
    'Running electron-builder',
    JSON.parse(JSON.stringify(electronBuilderConfig))
  );

  const target =
    process.platform === 'darwin'
      ? Platform.MAC.createTarget()
      : process.platform === 'win32'
      ? Platform.WINDOWS.createTarget()
      : Platform.LINUX.createTarget();

  await build({
    publish: 'never',
    projectDir: projectDir,
    targets: target,
    config: electronBuilderConfig,
  });
}
