/* eslint-disable no-sync */
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const execa = require('execa');
const { expect } = require('chai');

const running = [];

const MAIN_BRANCH = 'main';

async function runReleaseCommand(args, options = {}) {
  const execOptions = {
    ...options,
    env: {
      ...options.env,
      MONGODB_COMPASS_RELEASE_MAX_WAIT_TIME: '0',
    },
  };

  const proc = execa(
    'node',
    [path.resolve(__dirname, 'index.intercept.js'), ...args],
    execOptions
  );

  running.push(proc);
  return await proc;
}

function readPackageJsonVersion(packageJsonPath) {
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')).version;
}

async function checkoutBranch(branchName, options) {
  try {
    await execa('git', ['checkout', branchName], options);
  } catch {
    await execa('git', ['checkout', '-b', branchName], options);
  }
}

describe('release', function () {
  if (!!process.env.EVERGREEN && process.platform === 'darwin') {
    // These tests are not working well on Evergreen macOS machines and we will
    // skip them for now (they will run in GitHub CI)
    // eslint-disable-next-line no-console
    console.warn('Skipping release tests on Evergreen macOS machine');
    return;
  }

  afterEach(function () {
    while (running.length) {
      running.shift().kill('SIGTERM', { forceKillAfterTimeout: 100 });
    }
  });

  let tempDir;
  let remote;
  let repoPath;

  beforeEach(async function () {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compass-release-tests-'));

    // create fake git remote:
    remote = path.resolve(tempDir, 'remote');
    fs.mkdirpSync(remote);
    process.chdir(remote);
    await execa('git', ['init', '--bare']);
    await execa('git', ['config', '--local', 'user.name', 'user']);
    await execa('git', ['config', '--local', 'user.email', 'user@example.com']);

    // setup repo and package:
    repoPath = path.resolve(tempDir, 'compass-release-test-repo');
    fs.mkdirpSync(repoPath);
    process.chdir(repoPath);

    await execa('npm', ['init', '-y']);
    await execa('npm', ['install']); // generates package-lock.json

    await execa('git', ['init']);
    await execa('git', ['config', '--local', 'user.name', 'user']);
    await execa('git', ['config', '--local', 'user.email', 'user@example.com']);
    await execa('git', ['checkout', '-b', MAIN_BRANCH]);
    await execa('git', ['remote', 'add', 'origin', remote]);
    await execa('git', ['add', '.']);
    await execa('git', ['commit', '-am', 'init']);
    await execa('git', ['push', '--set-upstream', 'origin', MAIN_BRANCH]);
  });

  // eslint-disable-next-line mocha/no-sibling-hooks
  afterEach(function () {
    try {
      fs.removeSync(tempDir);
    } catch (e) {
      // windows fails to clean those up sometimes, let's just skip it and move
      // forward with runnning the tests
    }
  });

  it('prints usage if no argument is passed', async function () {
    const { stdout, failed } = await runReleaseCommand(['']).catch((e) => e);
    expect(failed).to.be.true;
    expect(stdout).to.contain('USAGE');
  });

  describe('checkout', function () {
    it('creates a new branch if not exists', async function () {
      await runReleaseCommand(['checkout', '1.12']);
      const { stdout } = await execa('git', [
        'rev-parse',
        '--abbrev-ref',
        'HEAD',
      ]);
      expect(stdout).to.equal('1.12-releases');
    });

    it('checks out an existing branch', async function () {
      await checkoutBranch('1.12-releases');
      await checkoutBranch(MAIN_BRANCH);
      await runReleaseCommand(['checkout', '1.12']);
      const { stdout } = await execa('git', [
        'rev-parse',
        '--abbrev-ref',
        'HEAD',
      ]);
      expect(stdout).to.equal('1.12-releases');
    });

    it('prints usage if no version is passed', async function () {
      const { stdout, failed } = await runReleaseCommand(['checkout']).catch(
        (e) => e
      );
      expect(failed).to.be.true;
      expect(stdout).to.contain('USAGE');
    });

    it(`fails if branch is not ${MAIN_BRANCH}`, async function () {
      await checkoutBranch('some-branch');
      const { stderr, failed } = await runReleaseCommand([
        'checkout',
        '1.12',
      ]).catch((e) => e);
      expect(failed).to.be.true;
      expect(stderr).to.contain(
        `The current branch is not the ${MAIN_BRANCH} branch`
      );
    });
  });

  [
    ['beta', '1.12.0-beta.0'],
    ['ga', '1.12.0'],
  ].forEach(([command, expectedVersion]) => {
    describe(command, function () {
      it(`fails from ${MAIN_BRANCH}`, async function () {
        await checkoutBranch(MAIN_BRANCH);
        const { stderr, failed } = await runReleaseCommand([command]).catch(
          (e) => e
        );
        expect(failed).to.be.true;
        expect(stderr).to.contain(
          `The current branch (${MAIN_BRANCH}) is not a release branch`
        );
      });

      it('fails if branch is not a release branch', async function () {
        await checkoutBranch('some-branch');
        const { stderr, failed } = await runReleaseCommand([command]).catch(
          (e) => e
        );
        expect(failed).to.be.true;
        expect(stderr).to.contain(
          'The current branch (some-branch) is not a release branch'
        );
      });

      it('fails with untracked files', async function () {
        fs.writeFileSync('README.md', '');
        await checkoutBranch('1.12-releases');
        const { stderr, failed } = await runReleaseCommand([command]).catch(
          (e) => e
        );
        expect(failed).to.be.true;
        expect(stderr).to.contain('You have untracked or staged changes');
      });

      it('fails with staged files', async function () {
        fs.writeFileSync('README.md', '');
        await checkoutBranch('1.12-releases');
        await execa('git', ['add', '.']);
        const { stderr, failed } = await runReleaseCommand([command]).catch(
          (e) => e
        );
        expect(failed).to.be.true;
        expect(stderr).to.contain('You have untracked or staged changes');
      });

      it('works with committed files', async function () {
        fs.writeFileSync('README.md', '');
        await checkoutBranch('1.12-releases');
        await execa('git', ['add', '.']);
        await execa('git', ['commit', '-am', 'test']);
        await runReleaseCommand([command], { input: 'N\n' });
      });

      it('asks for confirmation and skips if not confirmed', async function () {
        expect(
          readPackageJsonVersion(path.resolve(repoPath, './package.json'))
        ).to.equal('1.0.0');

        await checkoutBranch('1.12-releases');
        const { stderr } = await runReleaseCommand([command], {
          input: 'N\n',
        });

        expect(stderr).to.contain(
          `Are you sure you want to bump from 1.0.0 to ${expectedVersion} and release?`
        );

        expect(
          readPackageJsonVersion(path.resolve(repoPath, './package.json'))
        ).to.equal('1.0.0');
      });

      describe('from a release branch', function () {
        let clonePath;

        beforeEach(async function () {
          await checkoutBranch('1.12-releases');
          await runReleaseCommand([command], {
            input: 'Y\n',
            stdout: 'inherit',
            stderr: 'inherit',
          });

          clonePath = path.resolve(tempDir, command);
          await execa('git', [
            'clone',
            '--branch',
            MAIN_BRANCH,
            remote,
            clonePath,
          ]);
        });

        it(`does not affect ${MAIN_BRANCH}`, function () {
          const version = readPackageJsonVersion(
            path.resolve(clonePath, 'package.json')
          );
          expect(version).to.equal('1.0.0');
        });

        it('bumps the package version', async function () {
          await checkoutBranch('1.12-releases', { cwd: clonePath });
          const version = readPackageJsonVersion(
            path.resolve(clonePath, 'package.json')
          );
          expect(version).to.equal(expectedVersion);
        });

        it('pushes tags', async function () {
          await checkoutBranch('1.12-releases', { cwd: clonePath });
          await execa('git', ['fetch', '--all', '--tags']);

          const { stdout } = await execa('git', ['tag'], { cwd: clonePath });
          expect(stdout.split('\n')).to.deep.equal([`v${expectedVersion}`]);
        });
      });
    });
  });
});
