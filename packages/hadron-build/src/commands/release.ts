import Target from '../lib/target';
import createCLI from 'mongodb-js-cli';
import util from 'util';
import path from 'path';
import { promises as fs } from 'fs';
import del from 'del';
import _ from 'lodash';
import asar from 'asar';
import packager from 'electron-packager';
import createApplicationZip from '../lib/zip';
import { runCommand } from '../lib/run';
import { rebuild } from '@electron/rebuild';
import { signArchive } from '../lib/signtool';

const format = util.format;
const cli = createCLI('hadron-build:release');

export const command = 'release';

export const describe = ':shipit:';

const createBrandedApplication = async (CONFIG: Target): Promise<void> => {
  cli.debug('running electron-packager');
  const res = await packager(CONFIG.packagerOptions);
  cli.debug('Packager result is: ' + JSON.stringify(res, null, 2));

  if (CONFIG.platform !== 'darwin') {
    return;
  }

  const atomIcns = path.join(CONFIG.resources, 'atom.icns');
  const electronIcns = path.join(CONFIG.resources, 'electron.icns');

  try {
    await fs.stat(atomIcns);
  } catch {
    return;
  }

  await fs.rm(electronIcns, { force: true });
  await fs.rename(atomIcns, electronIcns);
};

const symlinkExecutable = async (CONFIG: Target): Promise<void> => {
  if (CONFIG.platform !== 'darwin') {
    return;
  }
  cli.debug('Ensuring `Contents/MacOS/Electron` is symlinked');
  const cwd = process.cwd();
  const newPath = path.join(CONFIG.appPath, 'Contents', 'MacOS');
  cli.debug('chdir', newPath);
  process.chdir(newPath);
  try {
    await fs.symlink(CONFIG.productName, 'Electron');
  } finally {
    process.chdir(cwd);
  }
};

const cleanupBrandedApplicationScaffold = async (
  CONFIG: Target
): Promise<void> => {
  const globsToDelete: string[] = [];
  if (CONFIG.platform === 'win32') {
    globsToDelete.push(path.join(CONFIG.resources, '*.pak'));
  } else {
    globsToDelete.push(path.join(CONFIG.resources, '*.lproj'));
  }

  cli.debug('cleaning up extraneous files from template');
  const paths = await del(globsToDelete, { force: true });
  cli.debug(format('%d extraneous files removed', paths.length));
};

const writeLicenseFile = async (CONFIG: Target): Promise<void> => {
  const contents = await fs.readFile(path.join(CONFIG.dir, 'LICENSE'));
  await CONFIG.write('LICENSE', contents);
  cli.debug(format('LICENSE written'));
};

const copy3rdPartyNoticesFile = async (CONFIG: Target): Promise<void> => {
  const noticesPath = path.join(CONFIG.dir, 'THIRD-PARTY-NOTICES.md');
  const contents = await fs.readFile(noticesPath);
  await CONFIG.write('THIRD-PARTY-NOTICES.md', contents);
  cli.debug(format('THIRD-PARTY-NOTICES.md written'));
};

const copySBOMFile = async (CONFIG: Target): Promise<void> => {
  const sbomPath = path.join(CONFIG.dir, '..', '..', '.sbom', 'sbom.json');
  try {
    const contents = await fs.readFile(sbomPath);
    await CONFIG.write('.sbom.json', contents);
    cli.debug(format('.sbom.json written'));
  } catch (err) {
    if (
      (err as NodeJS.ErrnoException).code === 'ENOENT' &&
      !process.env.COMPASS_WAS_COMPILED_AND_HAS_SBOM
    ) {
      cli.debug(
        format('Skipping sbom.json writing because the file is missing')
      );
      return;
    }
    throw err;
  }
};

const fixCompass5333 = async (CONFIG: Target): Promise<void> => {
  const chromiumLicensePath = path.join(
    CONFIG.distRoot(),
    'LICENSES.chromium.html'
  );

  const chromiumLicense = await fs.readFile(chromiumLicensePath, 'utf8');
  await fs.writeFile(
    chromiumLicensePath,
    chromiumLicense.replace(/www\.opsycon\.(se|com)/g, '')
  );
};

const writeVersionFile = async (CONFIG: Target): Promise<void> => {
  const version = CONFIG.packagerOptions.electronVersion!;
  const dest = await CONFIG.write('version', version);
  cli.debug(format('version `%s` written to `%s`', version, dest));
};

const transformPackageJson = async (CONFIG: Target): Promise<void> => {
  const PACKAGE_JSON_DEST = path.join(CONFIG.resourcesAppDir, 'package.json');
  const packageKeysToRemove = [
    'devDependencies',
    'dependency-check',
    'repository',
    'check',
    'config.hadron.build',
    'scripts.install',
  ];

  const contents = _.omit(CONFIG.pkg, packageKeysToRemove) as Record<
    string,
    unknown
  >;

  _.assign(contents, {
    channel: CONFIG.channel,
    version: CONFIG.version,
    distribution: CONFIG.distribution,
  });

  const distributions = (contents.config as Record<string, unknown>)
    .hadron as Record<string, unknown>;
  const distMap = distributions.distributions as Record<
    string,
    Record<string, unknown>
  >;
  _.assign(contents, {
    productName: CONFIG.productName,
  });
  distMap[contents.distribution as string].productName = CONFIG.productName;
  distMap[contents.distribution as string].metrics_intercom_app_id =
    process.env.HADRON_METRICS_INTERCOM_APP_ID;

  const monorepoRoot = path.resolve(CONFIG.dir, '..', '..');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Arborist = require('@npmcli/arborist');
  const tree = new Arborist({ path: monorepoRoot });
  await tree.loadActual();
  const packageInventoryPath = path
    .relative(monorepoRoot, CONFIG.dir)
    .replaceAll(path.sep, path.posix.sep);
  const packageNode = tree.actualTree.inventory.get(packageInventoryPath);

  if (!packageNode) {
    throw new Error("Couldn't find package node in arborist tree");
  }

  for (const depType of [
    'dependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    for (const depName of Object.keys(
      (contents[depType] as Record<string, string>) || {}
    )) {
      const depEdge = packageNode.edgesOut.get(depName);
      if (!depEdge.to && !depEdge.optional) {
        throw new Error(
          `Couldn't find node for package ${depName} in arborist tree`
        );
      }
      if (depEdge.to) {
        (contents[depType] as Record<string, string>)[depName] =
          depEdge.to.version;
      }
    }
  }

  cli.debug(JSON.stringify(contents, null, 2));
  await fs.writeFile(PACKAGE_JSON_DEST, JSON.stringify(contents, null, 2));
};

const installDependencies = async (CONFIG: Target): Promise<void> => {
  const originalPackagePath = CONFIG.resourcesAppDir;
  let appPackagePath = originalPackagePath;

  if (process.platform === 'win32' && process.env.EVERGREEN_WORKDIR) {
    appPackagePath = path.join(
      process.env.EVERGREEN_WORKDIR.replace(/^\/cygdrive\/(\w)\//, '$1:\\'),
      'src',
      'app'
    );
    cli.debug(
      `Moving app package path from ${originalPackagePath} to ${appPackagePath}`
    );
    await fs.rename(originalPackagePath, appPackagePath);
  }

  cli.debug('Installing dependencies and rebuilding native modules');

  const opts = {
    cwd: appPackagePath,
    shell: true,
  };

  await runCommand('npm', ['install', '--production'], opts);

  cli.debug('Production dependencies installed');

  const sharedRebuildConfig = {
    arch: CONFIG.arch,
    electronVersion: CONFIG.packagerOptions.electronVersion!,
    buildPath: appPackagePath,
    projectRootPath: appPackagePath,
    force: true,
  };

  const forceRebuildFromSourceOptions =
    process.platform === 'linux'
      ? {
          prebuildTagPrefix: 'not-real-prefix-to-force-rebuild',
        }
      : {};

  const allModulesRebuildConfig = {
    ...sharedRebuildConfig,
    ...CONFIG.rebuild,
    ...forceRebuildFromSourceOptions,
  };

  const clientEncryptionRebuildConfig = {
    ...sharedRebuildConfig,
    onlyModules: ['mongodb-client-encryption'],
  };

  await rebuild(allModulesRebuildConfig);
  await rebuild(clientEncryptionRebuildConfig);

  cli.debug('Native modules rebuilt against Electron.');
  if (originalPackagePath !== appPackagePath) {
    cli.debug(
      `Moving app package back to ${originalPackagePath} from ${appPackagePath}`
    );
    await fs.rename(appPackagePath, originalPackagePath);
  }
};

const removeDevelopmentFiles = async (CONFIG: Target): Promise<void> => {
  const DOT_FILES = [
    'expansions.raw.yml',
    'expansions.yml',
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
    path.join(CONFIG.resourcesAppDir, 'test'),
    path.join(CONFIG.resourcesAppDir, 'scripts'),
    path.join(CONFIG.resourcesAppDir, 'src'),
    path.join(CONFIG.resourcesAppDir, 'release'),
    path.join(CONFIG.resourcesAppDir, '**', 'Debug', 'obj'),
    path.join(CONFIG.resourcesAppDir, '**', 'Release', 'obj'),
    path.join(CONFIG.resourcesAppDir, '{' + DOT_FILES.join(',') + '}'),
    path.join(CONFIG.resourcesAppDir, '**', 'node_gyp_bins'),
  ];

  cli.debug(
    'Checking for extraneous files to remove:\n' +
      JSON.stringify(globsToDelete, null, 2)
  );

  const paths = await del(globsToDelete);
  if (paths.length === 0) {
    cli.debug('No extraneous files to remove');
  } else {
    cli.debug(format('%s extraneous files removed', paths.length));
  }
};

const createApplicationAsar = async (CONFIG: Target): Promise<void> => {
  const opts = {
    ...CONFIG.asar,
    unpack: `{${['*.node', '**/vendor/**']
      .concat(CONFIG.asar.unpack ?? [])
      .join(',')}}`,
  };

  const src = CONFIG.resourcesAppDir;
  const dest = `${CONFIG.resourcesAppDir}.asar`;

  try {
    await asar.createPackageWithOptions(src, dest, opts);
    await del([src], { force: true });
  } catch (err) {
    if (err) {
      cli.error(err as unknown as string);
    }
  }
};

const createBrandedInstaller = async (CONFIG: Target): Promise<void> => {
  cli.debug('Creating installer');
  await CONFIG.createInstaller();
};

const writeConfigToJson = async (CONFIG: Target): Promise<void> => {
  await fs.writeFile(
    path.join(CONFIG.out, 'target.json'),
    JSON.stringify(CONFIG, null, 2)
  );
};

export const builder = {
  dir: {
    description: 'Project root directory',
    default: process.cwd(),
  },
  skip_installer: {
    description: 'Skip installer generation',
    default: false,
  },
  no_asar: {
    description: 'Do not package application source to .asar bundle',
    default: false,
  },
};

interface ReleaseArgv {
  dir: string;
  skip_installer?: boolean;
  no_asar?: boolean;
}

type TaskFn = (config: Target) => Promise<void>;

const run = async (argv: ReleaseArgv): Promise<Target> => {
  cli.argv = argv;

  const target = new Target(argv.dir);

  cli.debug(`Building distribution: ${target.distribution}`);

  const task = (name: string, fn: TaskFn) => {
    return async (): Promise<void> => {
      cli.debug(`start: ${name}`);
      await fn(target);
      cli.debug(`completed: ${name}`);
    };
  };

  const skipInstaller =
    process.env.HADRON_SKIP_INSTALLER === 'true' || argv.skip_installer;

  const noAsar = process.env.NO_ASAR === 'true' || argv.no_asar;

  const tasks = _.flatten(
    [
      task('copy npmrc from root', async ({ dir }) => {
        await fs.copyFile(
          path.resolve(dir, '..', '..', '.npmrc'),
          path.resolve(dir, '.npmrc')
        );
      }),
      task('create branded application', createBrandedApplication),
      task('create executable symlink', symlinkExecutable),
      task(
        'cleanup branded application scaffold',
        cleanupBrandedApplicationScaffold
      ),
      task('write version file', writeVersionFile),
      task('transform package.json', transformPackageJson),
      task('install dependencies', installDependencies),
      task('fix COMPASS-5333', fixCompass5333),
      task('write license file', writeLicenseFile),
      task('write 3rd party notices file', copy3rdPartyNoticesFile),
      task('write sbom file', copySBOMFile),
      task('remove development files', removeDevelopmentFiles),
      !noAsar && task('create application asar', createApplicationAsar),
      !skipInstaller &&
        task('create branded installer', createBrandedInstaller),
      task('create application zip', createApplicationZip),
      task('sign zip', signArchive),
      task('store build configuration as json', writeConfigToJson),
    ].filter(Boolean)
  ) as Array<() => Promise<void>>;

  try {
    for (const t of tasks) {
      await t();
    }
    return target;
  } finally {
    void fs
      .rm(path.resolve(target.dir, '.npmrc'), { force: true })
      .catch((err) => {
        cli.warn((err as Error).message);
      });
  }
};

export const handler = async (argv: ReleaseArgv): Promise<void> => {
  const target = await run(argv);
  cli.ok(`${target.assets.length} assets successfully built`);
  target.assets.map(function (asset) {
    cli.info(asset.path);
  });
};
