/* eslint-disable no-console */
import childProcess from 'child_process';
import util, { format } from 'util';
import path from 'path';
import { deleteAsync as del } from 'del';
import { promises as fs, constants as fsConstants } from 'fs';
import _ from 'lodash';
import asar from '@electron/asar';
import { rebuild } from '@electron/rebuild';
import packager from 'electron-packager';
import type { ArgumentsCamelCase, CommandModule } from 'yargs';
import { Target } from '../lib/target';
import Arborist from '@npmcli/arborist';

import { createZipPackage } from '../lib/zip';

const execFile = util.promisify(childProcess.execFile);

export const compileAssets = async (target: Target) => {
  await execFile('npm', ['run', 'compile'], { cwd: target.dir });
};

const createBrandedApplication = async (target: Target) => {
  console.debug('running electron-packager');

  const electronPackagerResult = await packager(target.packagerOptions as any);

  console.debug(
    'Packager result is: ' + JSON.stringify(electronPackagerResult, null, 2)
  );

  await fixOsxIcon(target);
};

/**
 * Replaces 'electron.icns' with the content of 'atom.icns' in osx.
 * This is a fix to a very old issue, which most likely is not needed anymore.
 */
async function fixOsxIcon(target: Target) {
  if (target.platform !== 'darwin') {
    return;
  }

  /**
   * @see https://jira.mongodb.org/browse/INT-1836
   */
  const atomIcns = path.join(target.resources, 'atom.icns');
  const electronIcns = path.join(target.resources, 'electron.icns');

  try {
    await fs.access(atomIcns, fsConstants.F_OK);
  } catch (error) {
    return;
  }

  await fs.unlink(electronIcns);
  await fs.rename(atomIcns, electronIcns);
}

/**
 * Symlinks the Electron executable to the product name on OSX.
 */
const symlinkOsxExecutable = async (target: Target) => {
  if (target.platform !== 'darwin') {
    return;
  }

  console.debug('Ensuring `Contents/MacOS/Electron` is symlinked');
  const newPath = path.join(
    target.appPath,
    'Contents',
    'MacOS',
    target.productName
  );
  const targetPath = path.join(target.appPath, 'Contents', 'MacOS', 'Electron');

  await fs.symlink(newPath, targetPath);
  console.debug('Symlink created');
};

/**
 * For some platforms, there will be extraneous (to us) folders generated
 * we can remove to make the generated branded app less cluttered and easier
 * to debug.
 */
const cleanupBrandedApplicationScaffold = async (target: Target) => {
  const globsToDelete = [];
  if (target.platform === 'win32') {
    globsToDelete.push(path.join(target.resources, '*.pak'));
  } else {
    globsToDelete.push(path.join(target.resources, '*.lproj'));
  }

  console.debug('cleaning up extraneous files from template');

  const paths = await del(globsToDelete, {
    force: true,
  });

  console.debug(format('%d extraneous files removed', paths.length));
};

/**
 * Replace the LICENSE file `electron-packager` creates w/ a LICENSE
 * file specific to the project.
 */
const writeLicenseFile = async (target: Target) => {
  const contents = await fs.readFile(path.join(target.dir, 'LICENSE'), 'utf-8');
  await target.write('LICENSE', contents);
  console.debug(format('LICENSE written'));
};

/**
 * Copies the THIRD-PARTY-NOTICES from the compass dir to the root of the archive.
 * This replicates the previous behavior where the `electron-license` package was used to produce
 * a single LICENSE file on the root of the archive containing both the Compass license
 * and any other 3rd-party licenses.
 */
const copy3rdPartyNoticesFile = async (target: Target) => {
  const noticesPath = path.join(target.dir, 'THIRD-PARTY-NOTICES.md');

  const contents = await fs.readFile(noticesPath, 'utf-8');
  await target.write('THIRD-PARTY-NOTICES.md', contents);

  console.debug(format('THIRD-PARTY-NOTICES.md written'));
};

/**
 * Remove a malicious link from chromium license
 * See: COMPASS-5333
 */
const fixCompass5333 = async (config: Target) => {
  const chromiumLicensePath = path.join(
    config.distRoot(),
    'LICENSES.chromium.html'
  );

  const chromiumLicense = await fs.readFile(chromiumLicensePath, 'utf8');

  await fs.writeFile(
    chromiumLicensePath,
    chromiumLicense.replace(/www\.opsycon\.(se|com)/g, '')
  );
};

/**
 * Replace the version file `electron-packager` creates w/ a version
 * file specific to the project.
 */
const writeVersionFile = async (target: Target) => {
  // This version will be used by electron-installer-common to determine which
  // dependencies of electron to include.
  const version = target.packagerOptions.electronVersion;

  const dest = await target.write('version', version);
  console.debug(format('version `%s` written to `%s`', version, dest));
};

/**
 * Update the project's `./package.json` (like npm does when it
 * installs a package) for inclusion in the application
 * `electron-packager` creates.
 */
const transformPackageJson = async (target: Target) => {
  const PACKAGE_JSON_DEST = path.join(target.resourcesAppDir, 'package.json');
  const packageKeysToRemove = [
    'devDependencies',
    'dependency-check',
    'repository',
    'check',
    'config.hadron.build',
  ];

  const newPackageJson = {
    ..._.omit(target.pkg, packageKeysToRemove),
    channel: target.channel,
    version: target.version,
    distribution: target.distribution,
    productName: target.productName,
  };

  /**
   * This section of code strips packages from the package.json
   * that are not part of the distribution.
   */

  if (!newPackageJson.config) {
    throw new Error('invalid package json content');
  }

  const distributions = newPackageJson.config.hadron.distributions;
  distributions[newPackageJson.distribution].productName = target.productName;
  distributions[newPackageJson.distribution].metrics_intercom_app_id =
    process.env.HADRON_METRICS_INTERCOM_APP_ID;

  // As we are inside the monorepo, the package lock will not apply to the
  // Compass dependencies, to make sure we are installing exactly what is in the
  // package-lock, we will override package.json dependency versions to match
  // exact versions from package-lock
  const monorepoRoot = path.resolve(target.dir, '..', '..');

  const tree = new Arborist({ path: monorepoRoot });
  await tree.loadActual();
  const packageInventoryPath = path
    .relative(monorepoRoot, target.dir)
    // Normalize separator for cygwin
    .replaceAll(path.sep, path.posix.sep);
  const packageNode = tree.actualTree?.inventory.get(packageInventoryPath);

  if (!packageNode) {
    throw new Error("Couldn't find package node in arborist tree");
  }

  const depTypes: (
    | 'dependencies'
    | 'peerDependencies'
    | 'optionalDependencies'
  )[] = ['dependencies', 'peerDependencies', 'optionalDependencies'];

  for (const depType of depTypes) {
    for (const depName of Object.keys(newPackageJson[depType] || {})) {
      // @ts-expect-error The types for Arborist here seems to be outdated `get` is available on edgesOut
      const depEdge = packageNode.edgesOut.get(depName);

      if (!depEdge.to && !depEdge.optional) {
        throw new Error(
          `Couldn't find node for package ${depName} in arborist tree`
        );
      }
      if (depEdge.to) {
        newPackageJson[depType]![depName] = depEdge.to.version;
      }
    }
  }

  await fs.writeFile(
    PACKAGE_JSON_DEST,
    JSON.stringify(newPackageJson, null, 2)
  );

  console.debug(JSON.stringify(newPackageJson, null, 2));
};

const installDependencies = async (target: Target) => {
  const appPackagePath = target.resourcesAppDir;

  console.debug('Installing dependencies and rebuilding native modules');

  const opts = {
    cwd: appPackagePath,
  };

  await execFile('npm', ['install', '--production'], opts);

  console.debug('Production dependencies installed');

  const rebuildConfig = {
    ...target.rebuild,
    arch: target.arch,
    electronVersion: target.packagerOptions.electronVersion,
    buildPath: appPackagePath,
    // `projectRootPath` is undocumented, but changes modules resolution quite
    // a bit and required for the @electron/rebuild to be able to pick up
    // dependencies inside project root, but outside of their dependants (e.g.
    // a transitive dependency that was hoisted by npm installation process)
    projectRootPath: appPackagePath,
    force: true,
    // We want to ensure that we are actually rebuilding native modules on the
    // platform we are packaging. There is currently no direct way of passing a
    // --build-from-source flag to rebuild-install package, but we can force
    // rebuild by providing a tag prefix that will make prebuild think that
    // prebuilt files don't exist
    prebuildTagPrefix: 'totally-not-a-real-prefix-to-force-rebuild',
  };

  await rebuild(rebuildConfig);

  // We can not force rebuild mongodb-client-encryption locally, but we need to
  // make sure that the binary is matching the platform we are packaging for and
  // so let's run rebuild again, but this time providing the tag name package
  // is using so that prebuild can download the matching version
  rebuildConfig.prebuildTagPrefix = 'node-v';
  rebuildConfig.onlyModules = ['mongodb-client-encryption'];
  await rebuild(rebuildConfig);

  console.debug('Native modules rebuilt against Electron.');
};

/**
 * Before creating installers for distribution to
 * customers, there are thousands of files
 * they don't need in order to run the application.
 *
 * TODO (imlucas) even more we can remove!  see
 * `EXCLUDE_FROM_RELEASE` in INT-1225.
 *
 * @see https://jira.mongodb.org/browse/INT-1225
 * @param {Object} target
 * @param {Function} done
 * @api public
 */
const removeDevelopmentFiles = async (target: Target) => {
  const DOT_FILES = [
    '.DS_Store',
    '.eslint*',
    '.evergreen*',
    '.travis*',
    '.npm*',
    '.jsfmt*',
    '.git*',
    'report*',
    '*.less',
  ];

  const globsToDelete = [
    path.join(target.resourcesAppDir, 'test'),
    path.join(target.resourcesAppDir, 'scripts'),
    path.join(target.resourcesAppDir, 'src'),
    path.join(target.resourcesAppDir, 'release'),
    path.join(target.resourcesAppDir, '**', 'Debug', 'obj'),
    path.join(target.resourcesAppDir, '**', 'Release', 'obj'),
    path.join(target.resourcesAppDir, '{' + DOT_FILES.join(',') + '}'),
    // node-gyp creates symlinks for build purposes, but doesn't clean them up
    // afterwards https://github.com/nodejs/node-gyp/issues/2713
    path.join(target.resourcesAppDir, '**', 'node_gyp_bins'),
  ];

  console.debug(
    'Checking for extraneous files to remove:\n' +
      JSON.stringify(globsToDelete, null, 2)
  );

  const paths = await del(globsToDelete);

  if (paths.length === 0) {
    console.debug('No extraneous files to remove');
  } else {
    console.debug(format('%s extraneous files removed', paths.length));
  }
};

/**
 * Package the application as a single `asar` file.
 *
 * @see [Atom's generate-asar-task.coffee](https://git.io/vaY4O)
 * @see https://gist.github.com/imlucas/7a8956cf153595168109
 * @see https://jira.mongodb.org/browse/INT-1225
 * @param {Object} target
 * @param {Function} done
 */
const createApplicationAsar = async (target: Target) => {
  const opts = {
    /**
     * TODO (imlucas) Find a good way to automate generating
     * the hints file using `ELECTRON_LOG_ASAR_READS=1`.
     *
     *  ordering: path.join(process.cwd(),
     *   'resources', 'asar-ordering-hint.txt'),
     */
    ...target.asar,
    unpack: `{${['*.node', '**/vendor/**']
      .concat(target.asar.unpack)
      .join(',')}}`,
  };

  const src = target.resourcesAppDir;
  const dest = `${target.resourcesAppDir}.asar`;

  await asar.createPackageWithOptions(src, dest, opts);
  await del(src, { force: true });
};

/**
 * Create the application installer.
 */
const createBrandedInstaller = async (target: Target) => {
  console.debug('Creating installer');
  await target.createInstaller();
};

const writeConfigToJson = async (target: Target) => {
  await fs.writeFile(
    path.join(target.out, 'target.json'),
    JSON.stringify(target, null, 2)
  );
};

async function copyNpmRcFromRoot(dir: string) {
  await fs.cp(
    path.resolve(dir, '..', '..', '.npmrc'),
    path.resolve(dir, '.npmrc')
  );
}

async function cleanupCopiedNpmRc(dir: string) {
  await fs.rm(path.resolve(dir, '.npmrc')).catch((err) => {
    // eslint-disable-next-line no-console
    console.warn(err);
  });
}

async function runRelease({
  dir,
  distribution,
  skipInstaller,
  noAsar,
}: {
  distribution: string;
  skipInstaller: boolean;
  noAsar: boolean;
  dir: string;
}) {
  const target = new Target(dir, { distribution });

  try {
    await copyNpmRcFromRoot(dir);

    await compileAssets(target);
    await createBrandedApplication(target);
    await symlinkOsxExecutable(target);
    await cleanupBrandedApplicationScaffold(target);
    await writeVersionFile(target);
    await transformPackageJson(target);
    await installDependencies(target);
    await fixCompass5333(target);
    await writeLicenseFile(target);
    await copy3rdPartyNoticesFile(target);
    await removeDevelopmentFiles(target);

    if (!noAsar) {
      await createApplicationAsar(target);
    }

    if (!skipInstaller) {
      await createBrandedInstaller(target);
    }

    await createZipPackage(target);
    await writeConfigToJson(target);
  } finally {
    await cleanupCopiedNpmRc(dir);
  }
}

export default {
  command: 'release',
  describe: 'Build a packaged version of Compass',
  builder: {
    dir: {
      description: 'Project root directory',
      type: 'string',
    },
    skip_installer: {
      description: 'Skip installer generation',
      type: 'boolean',
      default: false,
    },
    no_asar: {
      description: 'Do not package application source to .asar bundle',
      type: 'boolean',
      default: false,
    },
  },
  handler: async (
    args: ArgumentsCamelCase<{
      dir?: string;
      skipInstaller?: boolean;
      noAsar?: boolean;
    }>
  ) => {
    const distribution = String(args._[1]) ?? process.env.HADRON_DISTRIBUTION;

    // copy back distribution to HADRON_DISTRIBUTION in case it was set via command line
    if (distribution) {
      process.env.HADRON_DISTRIBUTION = distribution;
    }

    const dir = args.dir ?? process.cwd();
    const skipInstaller =
      process.env.HADRON_SKIP_INSTALLER === 'true' || !!args.skipInstaller;
    const noAsar = process.env.NO_ASAR === 'true' || !!args.noAsar;

    await runRelease({ distribution, skipInstaller, noAsar, dir });
  },
} as CommandModule;
