/* eslint-disable no-console */
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const readline = require('readline');

const compassDepsList = require('./compass-deps-list');
const { runInDir } = require('../run-in-dir');
const { withProgress } = require("./with-progress");

async function questionAsync(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.question(`${query} `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

const globAsync = promisify(glob);

const ROOT = path.resolve(__dirname, '..', '..');

const LERNA_BIN = path.join(ROOT, 'node_modules', '.bin', 'lerna');

const { IMPORT_STRATEGY, TARGET_DIR, CLONE_DIR } = process.env;

let [
  ,
  ,
  // Directory we create the lerna monorepo in.
  // Eventually we'll run this script with the main compass
  // folder as target. For now putting things in one nested place
  // helps development and teardown.
  targetDir = TARGET_DIR || ROOT,
  // The CLONE_DIR is where we clone repos before we import them in lerna.
  // We use it to cache the clones while we develop as well.
  cloneDir = CLONE_DIR || path.join(ROOT, '.migration-cache'),
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

function lerna(command, dir) {
  return runInDir(`${LERNA_BIN} ${command}`, dir);
}

function git(command, dir) {
  return runInDir(`git ${command}`, dir);
}

async function initializeMonorepo(cloneCacheDir, monorepoTargetDir) {
  await fs.mkdirp(cloneCacheDir);

  // If path already exists check that user is sure that they want to continue
  if (
    (await fs.pathExists(monorepoTargetDir)) &&
    (await fs.readdir(monorepoTargetDir)).length > 0
  ) {
    let turnSpinnerBack = false;

    if (this && this.isSpinning) {
      this.stop();
      turnSpinnerBack = true;
    }

    const answer = await questionAsync(
      `Directory ${prettyPath(
        process.cwd(),
        monorepoTargetDir
      )} already exists and is populated. Are you sure you want to continue? [y/N]`
    );

    if (!/^(y|yes)$/i.test(answer)) {
      throw new Error('Migration interrupted');
    }

    if (turnSpinnerBack) {
      console.log();
      this.start();
    }
  } else {
    await fs.mkdirp(monorepoTargetDir);
  }

  // If lerna config exists in the dir, lerna is already initialized
  if (!(await fs.pathExists(path.join(monorepoTargetDir, 'lerna.json')))) {
    // https://github.com/lerna/lerna/blob/main/commands/init
    await lerna('init --independent', monorepoTargetDir);
  }

  // Lerna needs git to be initialized for the import to happen correctly
  try {
    await git('rev-parse HEAD', monorepoTargetDir);
  } catch (e) {
    // If rev-parse failed, we know that there is not git repo here or first
    // commit wasn't made yet
    if (!(await fs.pathExists(path.join(monorepoTargetDir, '.git')))) {
      await git('init', monorepoTargetDir);
    }
    await git('add -A', monorepoTargetDir);
    await git('commit -m "Initial commit" --no-verify', monorepoTargetDir);
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
    await git('add -A', monorepoTargetDir);
    await runInDir(
      `git commit -m "chore(monorepo): Import ${repoUrl} into main monorepo" --no-verify`,
      monorepoTargetDir
    );
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
      `Importing ${packagesToImport} from ${repoGitUrl} using "${importStrategy}" strategy`,
      importSinglePackage,
      repoGitUrl,
      importStrategy,
      monorepoTargetDir,
      cloneCacheDir
    );
  }
}

function prettyPath(from, to) {
  return path.relative(from, to) || '.';
}

async function cloneOrUpdate(repoUrl, cloneCacheDir) {
  const repoName = path.basename(repoUrl, '.git');
  const repoDir = path.join(cloneCacheDir, repoName);

  if (!(await fs.pathExists(repoDir))) {
    await runInDir(`git clone ${repoUrl} ${repoDir}`);
    await sleep(1000);
  } else {
    await git('pull', repoDir);
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
      `Unwrapping nested package(s) in monorepo ${monorepoName}`,
      async () => {
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

        await git('add -A', monorepoTargetDir);
        await runInDir(
          `git commit -m "chore(monorepo): Unwrap packages ${unwrapped} in nested monorepo at ${prettyPath(
            monorepoTargetDir,
            monorepoRoot
          )}" --no-verify`,
          monorepoTargetDir
        );
      }
    );
  }
}

async function runMonorepo() {
  console.log();
  console.log('Migrating Compass to monorepo ...');
  console.log();

  // 1. Setup lerna and the monorepo structure.
  await withProgress(
    `Initializing monorepo at ${prettyPath(process.cwd(), targetDir)}`,
    initializeMonorepo,
    cloneDir,
    targetDir
  );

  // Some of the repositories are monorepos, we will import based on repository
  // URL and then flatten them after we are done (that way we can import with
  // git history preserved when possible)
  const mergedRepoImportConfig = (() => {
    // const allDeps = [COMPASS].concat(compassDepsList);
    const allDeps = compassDepsList;
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
          importStrategy: strategy || defaultImportStrategy
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
