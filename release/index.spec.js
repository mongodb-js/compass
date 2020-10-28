/* eslint-disable no-sync */
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const execa = require('execa');
const { expect } = require('chai');

async function runReleaseCommand(args, options = {}) {
  return await execa('node', [path.resolve(__dirname, 'index.js'), ...args], {
    ...options
  });
}

function readPackageJsonVersion(packageJsonPath) {
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')).version;
}

async function checkoutBranch(branchName) {
  try {
    await execa('git', ['checkout', '-b', branchName]);
  } catch {
    await execa('git', ['checkout', branchName]);
  }
}

describe('release', () => {
  let tempDir;
  let remote;
  let repoPath;

  beforeEach(async() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compass-release-tests-'));

    // create fake git remote:
    const gitRemotePath = path.resolve(tempDir, 'remote');
    fs.mkdirpSync(gitRemotePath);
    process.chdir(gitRemotePath);
    await execa('git', ['init', '--bare']);

    remote = `file://${gitRemotePath}`;

    // setup repo and package:
    repoPath = path.resolve(tempDir, 'compass-release-test-repo');
    fs.mkdirpSync(repoPath);
    process.chdir(repoPath);

    await execa('npm', ['init', '-y']);

    await execa('git', ['init']);
    await execa('git', ['remote', 'add', 'origin', remote]);
    await execa('git', ['add', '.']);
    await execa('git', ['commit', '-am', 'init']);
    await execa('git', ['push', '--set-upstream', 'origin', 'master']);
  });

  afterEach(() => {
    fs.removeSync(tempDir);
  });

  it('prints usage if no argument is passed', async() => {
    const { stdout, failed } = await (runReleaseCommand(['']).catch(e => e));
    expect(failed).to.be.true;
    expect(stdout).to.contain('USAGE');
  });

  describe('checkout', () => {
    it('creates a new branch if not exists', async() => {
      await runReleaseCommand(['checkout', '1.12']);
      const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
      expect(stdout).to.equal('1.12-releases');
    });

    it('checks out an existing branch', async() => {
      await checkoutBranch('1.12-releases');
      await checkoutBranch('master');
      await runReleaseCommand(['checkout', '1.12']);
      const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
      expect(stdout).to.equal('1.12-releases');
    });

    it('prints usage if no version is passed', async() => {
      const { stdout, failed } = await (runReleaseCommand(['checkout']).catch(e => e));
      expect(failed).to.be.true;
      expect(stdout).to.contain('USAGE');
    });

    it('fails if branch is not master', async() => {
      await checkoutBranch('some-branch');
      const { stderr, failed } = await (runReleaseCommand(['checkout', '1.12']).catch(e => e));
      expect(failed).to.be.true;
      expect(stderr).to.contain('The current branch is not the main branch');
    });
  });

  [
    ['beta', '1.12.0-beta.0'],
    ['ga', '1.12.0']
  ].forEach(([ command, expectedVersion ]) => {
    describe(command, () => {
      it('fails from master', async() => {
        await checkoutBranch('master');
        const { stderr, failed, stdout } = await (runReleaseCommand([command]).catch(e => e));
        expect(failed).to.be.true;
        expect(stderr + stdout).to.contain('The current branch is not a release branch');
      });

      it('fails if branch is not a release branch', async() => {
        await checkoutBranch('some-branch');
        const { stderr, failed } = await (runReleaseCommand([command]).catch(e => e));
        expect(failed).to.be.true;
        expect(stderr).to.contain('The current branch is not a release branch');
      });

      it('fails with untracked files', async() => {
        fs.writeFileSync('README.md', '');
        await checkoutBranch('1.12-releases');
        const { stderr, failed } = await (runReleaseCommand([command]).catch(e => e));
        expect(failed).to.be.true;
        expect(stderr).to.contain('You have untracked or staged changes');
      });

      it('fails with staged files', async() => {
        fs.writeFileSync('README.md', '');
        await checkoutBranch('1.12-releases');
        await execa('git', ['add', '.']);
        const { stderr, failed } = await (runReleaseCommand([command]).catch(e => e));
        expect(failed).to.be.true;
        expect(stderr).to.contain('You have untracked or staged changes');
      });

      it('works with committed files', async() => {
        fs.writeFileSync('README.md', '');
        await checkoutBranch('1.12-releases');
        await execa('git', ['add', '.']);
        await execa('git', ['commit', '-am', 'test']);
        await runReleaseCommand([command], {input: 'N\n'});
      });

      it('asks for confirmation and skips if not confirmed', async() => {
        expect(readPackageJsonVersion(
          path.resolve(repoPath, './package.json')
        )).to.equal('1.0.0');

        await checkoutBranch('1.12-releases');
        const { stdout } = await runReleaseCommand([command], {
          input: 'N\n'
        });

        expect(stdout).to.contain(
          `Are you sure you want to bump from 1.0.0 to ${expectedVersion} and release? Y/[N]`);

        expect(readPackageJsonVersion(
          path.resolve(repoPath, './package.json')
        )).to.equal('1.0.0');
      });

      describe('from a release branch', () => {
        let clonePath;

        beforeEach(async() => {
          await checkoutBranch('1.12-releases');
          await runReleaseCommand([command], {
            input: 'Y\n'
          });

          clonePath = path.resolve(tempDir, command);
          await execa('git', ['clone', remote, clonePath]);
        });

        it('does not affect master', () => {
          const version = readPackageJsonVersion(path.resolve(clonePath, 'package.json'));
          expect(version).to.equal('1.0.0');
        });

        it('bumps the package version', async() => {
          await execa('git', ['checkout', '1.12-releases'], {cwd: clonePath});
          const version = readPackageJsonVersion(path.resolve(clonePath, 'package.json'));
          expect(version).to.equal(expectedVersion);
        });

        it('pushes tags', async() => {
          await execa('git', ['checkout', '1.12-releases'], {cwd: clonePath});
          await execa('git', ['fetch', '--all', '--tags']);

          const { stdout } = await execa('git', ['tag'], {cwd: clonePath});
          expect(stdout.split('\n')).to.deep.equal([`v${expectedVersion}`]);
        });
      });
    });
  });
});
