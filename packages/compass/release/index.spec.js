/* eslint-disable no-sync */
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const execa = require('execa');
const { expect } = require('chai');
const npm = require('./npm');
const git = require('./git');

const running = [];

const MAIN_BRANCH = 'main';

async function runReleaseCommand(args, options = {}) {
  const execOptions = {
    ...options,
    env: {
      ...options.env,
      MONGODB_COMPASS_RELEASE_MAX_WAIT_TIME: '0'
    }
  };

  const proc = execa(
    'node',
    [path.resolve(__dirname, 'index.intercept.js'), ...args],
    execOptions
  );

  running.push(proc);
  return await proc;
}

async function runReleaseCommandWithKeys(args, options = {}) {
  return await runReleaseCommand(args, {
    ...options,
    env: {
      MONGODB_DOWNLOADS_AWS_ACCESS_KEY_ID: 'AWS_ACCESS_KEY_ID',
      MONGODB_DOWNLOADS_AWS_SECRET_ACCESS_KEY: 'AWS_SECRET_ACCESS_KEY'
    }
  });
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

async function commitAll(commitMessage, tag) {
  await fs.writeFile('README.md', Date.now().toString());
  await git.add('.');
  await git.commit(commitMessage);
  if (tag) {
    await git.tag(tag);
    await git.pushTags();
  }
}

describe('release', function() {
  if (!!process.env.EVERGREEN && process.platform === 'darwin') {
    // These tests are not working well on Evergreen macOS machines and we will
    // skip them for now (they will run in GitHub CI)
    // eslint-disable-next-line no-console
    console.warn('Skipping release tests on Evergreen macOS machine');
    return;
  }

  before(function() {
    if (process.env.MONGODB_DOWNLOADS_AWS_ACCESS_KEY_ID) {
      // eslint-disable-next-line no-console
      console.info(
        'MONGODB_DOWNLOADS_AWS_ACCESS_KEY_ID is set. Please re-run with MONGODB_DOWNLOADS_AWS_ACCESS_KEY_ID=""'
      );
      this.skip();
    }
  });

  afterEach(function() {
    while (running.length) {
      running.shift().kill('SIGTERM', { forceKillAfterTimeout: 100 });
    }
  });

  let tempDir;
  let remote;
  let repoPath;

  beforeEach(async function() {
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
  afterEach(function() {
    try {
      fs.removeSync(tempDir);
    } catch (e) {
      // windows fails to clean those up sometimes, let's just skip it and move
      // forward with runnning the tests
    }
  });

  it('prints usage if no argument is passed', async function() {
    const { stdout, failed } = await (runReleaseCommand(['']).catch(e => e));
    expect(failed).to.be.true;
    expect(stdout).to.contain('USAGE');
  });

  describe('checkout', function() {
    it('creates a new branch if not exists', async function() {
      await runReleaseCommand(['checkout', '1.12']);
      const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
      expect(stdout).to.equal('1.12-releases');
    });

    it('checks out an existing branch', async function() {
      await checkoutBranch('1.12-releases');
      await checkoutBranch(MAIN_BRANCH);
      await runReleaseCommand(['checkout', '1.12']);
      const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
      expect(stdout).to.equal('1.12-releases');
    });

    it('prints usage if no version is passed', async function() {
      const { stdout, failed } = await (runReleaseCommand(['checkout']).catch(e => e));
      expect(failed).to.be.true;
      expect(stdout).to.contain('USAGE');
    });

    it(`fails if branch is not ${MAIN_BRANCH}`, async function() {
      await checkoutBranch('some-branch');
      const { stderr, failed } = await (runReleaseCommand(['checkout', '1.12']).catch(e => e));
      expect(failed).to.be.true;
      expect(stderr).to.contain(`The current branch is not the ${MAIN_BRANCH} branch`);
    });
  });

  [
    ['beta', '1.12.0-beta.0'],
    ['ga', '1.12.0']
  ].forEach(([ command, expectedVersion ]) => {
    describe(command, function() {
      it('fails if missing required env vars', async function() {
        await checkoutBranch('1.1-releases');
        const { stderr, stdout, failed } = await (runReleaseCommand([command], {env: {
          MONGODB_DOWNLOADS_AWS_ACCESS_KEY_ID: ''
        }, input: 'Y\n'}).catch(e => e));
        expect(failed).to.be.true;
        expect(stderr + stdout).to.contain('The MONGODB_DOWNLOADS_AWS_ACCESS_KEY_ID envirnonment variable must be set.');
      });

      it(`fails from ${MAIN_BRANCH}`, async function() {
        await checkoutBranch(MAIN_BRANCH);
        const { stderr, failed } = await (runReleaseCommandWithKeys([command]).catch(e => e));
        expect(failed).to.be.true;
        expect(stderr).to.contain(`The current branch (${MAIN_BRANCH}) is not a release branch`);
      });

      it('fails if branch is not a release branch', async function() {
        await checkoutBranch('some-branch');
        const { stderr, failed } = await (runReleaseCommandWithKeys([command]).catch(e => e));
        expect(failed).to.be.true;
        expect(stderr).to.contain('The current branch (some-branch) is not a release branch');
      });

      it('fails with untracked files', async function() {
        fs.writeFileSync('README.md', '');
        await checkoutBranch('1.12-releases');
        const { stderr, failed } = await (runReleaseCommandWithKeys([command]).catch(e => e));
        expect(failed).to.be.true;
        expect(stderr).to.contain('You have untracked or staged changes');
      });

      it('fails with staged files', async function() {
        fs.writeFileSync('README.md', '');
        await checkoutBranch('1.12-releases');
        await execa('git', ['add', '.']);
        const { stderr, failed } = await (runReleaseCommandWithKeys([command]).catch(e => e));
        expect(failed).to.be.true;
        expect(stderr).to.contain('You have untracked or staged changes');
      });

      it('works with committed files', async function() {
        fs.writeFileSync('README.md', '');
        await checkoutBranch('1.12-releases');
        await execa('git', ['add', '.']);
        await execa('git', ['commit', '-am', 'test']);
        await runReleaseCommandWithKeys([command], {input: 'N\n'});
      });

      it('asks for confirmation and skips if not confirmed', async function() {
        expect(readPackageJsonVersion(
          path.resolve(repoPath, './package.json')
        )).to.equal('1.0.0');

        await checkoutBranch('1.12-releases');
        const { stderr } = await runReleaseCommandWithKeys([command], {
          input: 'N\n'
        });

        expect(stderr).to.contain(
          `Are you sure you want to bump from 1.0.0 to ${expectedVersion} and release?`);

        expect(readPackageJsonVersion(
          path.resolve(repoPath, './package.json')
        )).to.equal('1.0.0');
      });

      describe('from a release branch', function() {
        let clonePath;

        beforeEach(async function() {
          await checkoutBranch('1.12-releases');
          await runReleaseCommandWithKeys([command], {
            input: 'Y\n',
            stdout: 'inherit',
            stderr: 'inherit'
          });

          clonePath = path.resolve(tempDir, command);
          await execa('git', ['clone', '--branch', MAIN_BRANCH, remote, clonePath]);
        });

        it(`does not affect ${MAIN_BRANCH}`, function() {
          const version = readPackageJsonVersion(path.resolve(clonePath, 'package.json'));
          expect(version).to.equal('1.0.0');
        });

        it('bumps the package version', async function() {
          await checkoutBranch('1.12-releases', {cwd: clonePath});
          const version = readPackageJsonVersion(path.resolve(clonePath, 'package.json'));
          expect(version).to.equal(expectedVersion);
        });

        it('pushes tags', async function() {
          await checkoutBranch('1.12-releases', {cwd: clonePath});
          await execa('git', ['fetch', '--all', '--tags']);

          const { stdout } = await execa('git', ['tag'], {cwd: clonePath});
          expect(stdout.split('\n')).to.deep.equal([`v${expectedVersion}`]);
        });
      });
    });
  });

  describe('changelog', function() {
    it(`fails from ${MAIN_BRANCH}`, async function() {
      await checkoutBranch(MAIN_BRANCH);
      const { stderr, failed } = await (runReleaseCommand(['changelog']).catch(e => e));
      expect(failed).to.be.true;
      expect(stderr).to.contain(`The current branch (${MAIN_BRANCH}) is not a release branch`);
    });

    it('fails if branch is not a release branch', async function() {
      await checkoutBranch('some-branch');
      const { stderr, failed } = await (runReleaseCommand(['changelog']).catch(e => e));
      expect(failed).to.be.true;
      expect(stderr).to.contain('The current branch (some-branch) is not a release branch');
    });

    it('fails if release tag is not found', async function() {
      await checkoutBranch('1.12-releases');
      const { stderr, failed } = await (runReleaseCommand(['changelog']).catch(e => e));
      expect(failed).to.be.true;
      expect(stderr).to.contain('The release tag v1.0.0 was not found. Is this release tagged?');
    });

    describe('when the release tag exist', function() {
      beforeEach(async function() {
        await commitAll('fix: commit 1', 'v0.1.0');
        await commitAll('fix: commit 2', 'v0.2.0-beta.0');
        await commitAll('feat: commit 3');
        await commitAll('feat: commit 3'); // duplicate
        await commitAll('v0.2.0-beta.0'); // version bump commit
        await commitAll('v0.2.0'); // version bump commit
        await checkoutBranch('1.0-releases');
        await commitAll('perf: commit 4', 'v1.0.0');
      });

      it('reports changes between 2 GAs', async function() {
        const { stdout } = await runReleaseCommand(['changelog']);
        expect(stdout).to.contain('\nChanges from v0.1.0:\n## Features\n\n- Commit 3\n\n\n## Bug Fixes\n\n- Commit 2\n\n\n## Performance Improvements\n\n- Commit 4\n\nYou can see the full list of commits here: \nhttps://github.com/mongodb-js/compass/compare/v0.1.0...v1.0.0');
      });

      it('reports changes between beta and GA', async function() {
        await npm.version('1.0.1-beta.0');
        await execa('git', ['add', '.']);
        await commitAll('fix: commit 5');
        await commitAll('fix: commit 6', 'v1.0.1-beta.0');

        const { stdout } = await runReleaseCommand(['changelog']);
        expect(stdout).to.contain('\nChanges from v1.0.0:\n## Bug Fixes\n\n- Commit 6\n- Commit 5\n\nYou can see the full list of commits here: \nhttps://github.com/mongodb-js/compass/compare/v1.0.0...v1.0.1-beta.0');
      });

      it('reports changes between beta and beta', async function() {
        await npm.version('1.0.1-beta.0');
        await commitAll('feat: commit 5');
        await commitAll('feat: commit 6', 'v1.0.1-beta.0');
        await npm.version('1.0.1-beta.1');
        await commitAll('feat: commit 7');
        await commitAll('feat: commit 8', 'v1.0.1-beta.1');

        const { stdout } = await runReleaseCommand(['changelog']);
        expect(stdout).to.contain('\nChanges from v1.0.1-beta.0:\n## Features\n\n- Commit 8\n- Commit 7\n\nYou can see the full list of commits here: \nhttps://github.com/mongodb-js/compass/compare/v1.0.1-beta.0...v1.0.1-beta.1');
      });
    });
  });

  describe('publish', function() {
    beforeEach(async function() {
      await checkoutBranch('1.1-releases');
      await npm.version('1.1.0');
      await commitAll('v1.1.0', 'v1.1.0');
      await checkoutBranch(MAIN_BRANCH);
    });

    it(`fails from ${MAIN_BRANCH}`, async function() {
      await checkoutBranch(MAIN_BRANCH);
      const { stderr, failed } = await (runReleaseCommand(['publish'], {env: {}}).catch(e => e));
      expect(failed).to.be.true;
      expect(stderr).to.contain(`The current branch (${MAIN_BRANCH}) is not a release branch`);
    });

    it('fails if branch is not a release branch', async function() {
      await checkoutBranch('some-branch');
      const { stderr, failed } = await (runReleaseCommand(['publish'], {env: {}}).catch(e => e));
      expect(failed).to.be.true;
      expect(stderr).to.contain('The current branch (some-branch) is not a release branch');
    });

    it('fails if the branch mismatch with release version', async function() {
      await checkoutBranch('1.21-releases');
      const { stderr, failed } = await (runReleaseCommand(['publish'], {env: {}}).catch(e => e));
      expect(failed).to.be.true;
      expect(stderr).to.contain('Error: 1.0.0 can only be published from 1.0-releases');
    });

    it('fails if there is no tag for the release version', async function() {
      await checkoutBranch('1.1-releases');
      await npm.version('1.1.1');
      await commitAll('v1.1.1');
      const { stderr, failed } = await (runReleaseCommand(['publish'], {env: {}}).catch(e => e));
      expect(failed).to.be.true;
      expect(stderr).to.contain('Error: No tag found for 1.1.1.');
    });

    it('Asks for confirmation', async function() {
      await checkoutBranch('1.1-releases');
      const { stderr } = await runReleaseCommand(['publish'], {
        env: {},
        input: 'N\n'
      });

      expect(stderr).to.contain(
        'Are you sure you want to publish the release 1.1.0?');
    });

    it('fails if missing required env vars', async function() {
      await checkoutBranch('1.1-releases');
      const { stderr, failed } = await (runReleaseCommand(['publish'], {
        env: {
          MONGODB_DOWNLOADS_AWS_ACCESS_KEY_ID: ''
        }, input: 'Y\n'}).catch(e => e));
      expect(failed).to.be.true;
      expect(stderr).to.contain('The MONGODB_DOWNLOADS_AWS_ACCESS_KEY_ID envirnonment variable must be set.');
    });
  });
});
