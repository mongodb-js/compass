/* eslint-disable no-console */
const { promisify } = require('util');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const glob = require('glob');

const globAsync = promisify(glob);

const compassDepsList = require('./compass-deps-list');

const ROOT = path.resolve(__dirname, '..', '..');

const LERNA_BIN = path.join(ROOT, 'node_modules', '.bin', 'lerna');

const { IMPORT_STRATEGY, TARGET_DIR, CLONE_DIR } = process.env;

let [
  ,
  ,
  // Directory we create the lerna mono repo in.
  // Eventually we'll run this script with the main compass
  // folder as target. For now putting things in one nested place
  // helps development and teardown.
  targetDir = TARGET_DIR || path.join(ROOT, 'monorepo-compass'),
  // The CLONE_DIR is where we clone repos before we import them in lerna.
  // We use it to cache the clones while we develop as well.
  cloneDir = CLONE_DIR || path.join(ROOT, 'monorepo-clone'),
  // "lerna" or "copy"
  defaultImportStrategy = IMPORT_STRATEGY || 'copy'
] = process.argv;

targetDir = path.resolve(process.cwd(), targetDir);

cloneDir = path.resolve(process.cwd(), cloneDir);

const COMPASS = {
  name: 'compass',
  repository: 'https://github.com/mongodb-js/compass.git'
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ONE_HOUR = 1000 * 60 * 60;

async function runInDir(command, cwd = process.cwd(), timeout = ONE_HOUR) {
  const execPromise = promisify(exec)(command, {
    stdio: 'pipe',
    cwd,
    timeout
  });
  return await execPromise;
}

function lerna(command, dir) {
  return runInDir(`${LERNA_BIN} ${command}`, dir);
}

async function withProgress(promise, text) {
  const spinner = ora(text).start();
  try {
    const result = await promise;
    spinner.succeed();
    return result;
  } catch (e) {
    spinner.fail();
    throw e;
  }
}

async function initializeMonorepo(cloneCacheDir, monorepoTargetDir) {
  await fs.mkdirp(cloneCacheDir);

  await fs.mkdirp(monorepoTargetDir);

  // https://github.com/lerna/lerna/blob/main/commands/init
  await lerna('init --independent', monorepoTargetDir);

  // Lerna needs git to be initialized for the import to happen correctly
  try {
    await runInDir('git rev-parse HEAD', monorepoTargetDir);
  } catch (e) {
    // If rev-parse failed, we know that there is not git repo here
    if (!(await fs.pathExists(path.join(monorepoTargetDir, '.git')))) {
      await runInDir('git init', monorepoTargetDir);
    }
    await runInDir('git add -A', monorepoTargetDir);
    await runInDir('git commit -m "Initial commit"', monorepoTargetDir);
  }
}

async function importSinglePackage(
  repoUrl,
  importStrategy,
  monorepoTargetDir,
  cloneCacheDir
) {
  const clonedDir = await cloneOrUpdate(repoUrl, cloneCacheDir);
  const clonedRepoDirname = path.basename(clonedDir);
  const destDir = path.join(monorepoTargetDir, 'packages', clonedRepoDirname);

  if (importStrategy === 'lerna') {
    try {
      // https://github.com/lerna/lerna/tree/main/commands/import
      await lerna(
        `import -y --flatten --preserve-commit ${clonedDir}`,
        monorepoTargetDir
      );
    } catch (e) {
      // Lerna will exit with a code > 0 sometimes while actually succeding in
      // importing a package. We can identify this based on error message
      // (basically an stderr in this case) and continue the import
      if (!/^lerna success import finished/m.test(e.message)) {
        throw e;
      }
    }
  } else if (importStrategy === 'copy') {
    await fs.copy(clonedDir, destDir, { recursive: true, errorOnExist: true });
    await fs.remove(path.join(destDir, '.git'), { recursive: true });
    await runInDir('git add -A', monorepoTargetDir);
    await runInDir(`git commit -m "chore(monorepo): Import ${repoUrl} into main monorepo"`, monorepoTargetDir);
  }

  await sleep(100);
}

async function importCompassReposIntoLerna(
  repositories,
  monorepoTargetDir,
  cloneCacheDir
) {
  for (const { name, repository, importStrategy } of repositories) {
    const repoPath = new URL(repository).pathname
      .replace(/^\//, '')
      .replace(/\.git$/, '');

    const repoGitUrl = `git@github.com:${repoPath}.git`;

    const packagesToImport = Array.isArray(name) ? name.join(', ') : name;

    await withProgress(
      importSinglePackage(
        repoGitUrl,
        importStrategy,
        monorepoTargetDir,
        cloneCacheDir
      ),
      `Importing ${packagesToImport} from ${repoGitUrl} using "${importStrategy}" strategy`
    );
  }
}

async function cloneOrUpdate(repoUrl, cloneCacheDir) {
  const repoName = path.basename(repoUrl, '.git');
  const repoDir = path.join(cloneCacheDir, repoName);

  if (!(await fs.pathExists(repoDir))) {
    await runInDir(`git clone ${repoUrl} ${repoDir}`);
    await sleep(1000);
  } else {
    await runInDir('git pull', repoDir);
  }

  return repoDir;
}

async function unwrapNestedMonorepos(monorepoTargetDir, packagesToImport) {
  const monoreposToProcess = (
    await globAsync('packages/*/lerna.json', {
      cwd: monorepoTargetDir
    })
  ).map((configPath) => path.resolve(monorepoTargetDir, configPath));

  for (const configPath of monoreposToProcess) {
    const monorepoRoot = path.dirname(configPath);
    const monorepoPackageJson = path.join(monorepoRoot, 'package.json');
    const { name: monorepoName } = require(monorepoPackageJson);

    await withProgress(
      (async() => {
        const { packages } = require(configPath);

        if (!packages || packages.length === 0) {
          throw new Error(
            `Couldn't resolve packages in nested monorepo at ${monorepoRoot}`
          );
        }

        const pattern =
          packages.length > 1 ? `{${packages.join(',')}}` : packages[0];

        const packagesToMove = await globAsync(pattern, {
          cwd: monorepoRoot
        });

        let unwrapped = [];

        for (const packagePath of packagesToMove) {
          const pkgPath = path.join(monorepoRoot, packagePath);
          const pkgInfo = require(path.join(pkgPath, 'package.json'));

          if (packagesToImport.has(pkgInfo.name)) {
            unwrapped.push(pkgInfo.name);
            await fs.move(
              pkgPath,
              path.resolve(monorepoRoot, '..', path.basename(packagePath)),
              { overwrite: false }
            );
          }
        }

        await fs.rmdir(monorepoRoot, { recursive: true });

        unwrapped = unwrapped.join(', ');

        await runInDir('git add -A', monorepoTargetDir);
        await runInDir(
          `git commit -m "chore(monorepo): Unwrap packages ${unwrapped} in nested monorepo at ${path.relative(
            monorepoTargetDir,
            monorepoRoot
          )}"`,
          monorepoTargetDir
        );
      })(),
      `Unwrapping nested package(s) in monorepo ${monorepoName}`
    );
  }
}

async function runMonorepo() {
  console.log();
  console.log('Migrating Compass to monorepo ...');
  console.log();

  // 1. Setup lerna and the monorepo structure.
  await withProgress(
    initializeMonorepo(cloneDir, targetDir),
    `Initializing monorepo at ${path.relative(process.cwd(), targetDir)}`
  );

  // Some of the repositories are monorepos, we will import based on repository
  // URL and then flatten them after we are done (that way we can import with
  // git history preserved when possible)
  const mergedRepoImportConfig = (() => {
    const allDeps = [COMPASS].concat(compassDepsList);
    // .filter(({ name }) => /(compass-shell|hadron-react)/.test(name));
    const normalized = new Map();
    for (const { name, repository, importStrategy: strategy } of allDeps) {
      if (normalized.has(repository)) {
        const repo = normalized.get(repository);
        repo.name.push(name);
        // `copy` import strategy should be the main one, otherwise latest
        // found one takes the priority
        if (repo.importStrategy !== 'copy' && Boolean(strategy)) {
          repo.importStrategy = strategy;
        }
      } else {
        normalized.set(repository, {
          name: [name],
          repository,
          importStrategy: strategy ?? defaultImportStrategy
        });
      }
    }
    return Array.from(normalized.values());
  })();

  // 2. Move the packages into lerna.
  await importCompassReposIntoLerna(
    mergedRepoImportConfig,
    targetDir,
    cloneDir
  );

  const packagesToImport = new Set(
    mergedRepoImportConfig.map((pkg) => pkg.name).flat()
  );

  // 3. Move nested monorepos to the top-level packages/ folder
  await unwrapNestedMonorepos(targetDir, packagesToImport);

  console.log();
  console.log('All done');
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
});

runMonorepo();
