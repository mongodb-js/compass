import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ROOT_DIR } from '../../test/test-helpers';
import Target from '../lib/target';
import {
  writeLicenseFile,
  symlinkExecutable,
  copy3rdPartyNoticesFile,
  writeVersionFile,
  createApplicationAsar,
} from './release';
import { expect } from 'chai';

async function copyCompassBuildAssetsToDir(tmpDir: string) {
  await fs.copyFile(
    path.join(ROOT_DIR, 'package.json'),
    path.join(tmpDir, 'package.json')
  );
  await fs.copyFile(
    // LICENSE is in the root of the monorepo
    path.join(ROOT_DIR, '..', '..', 'LICENSE'),
    path.join(tmpDir, 'LICENSE')
  );
  await fs.copyFile(
    // THIRD-PARTY-NOTICES is in the root of the monorepo
    path.join(ROOT_DIR, '..', '..', 'THIRD-PARTY-NOTICES.md'),
    path.join(tmpDir, 'THIRD-PARTY-NOTICES.md')
  );
  await fs.mkdir(path.join(tmpDir, 'app-icons'), { recursive: true });
  await fs.cp(
    path.join(ROOT_DIR, 'app-icons'),
    path.join(tmpDir, 'app-icons'),
    { recursive: true }
  );
  await fs.mkdir(path.join(tmpDir, 'scripts'), { recursive: true });
  await fs.cp(path.join(ROOT_DIR, 'scripts'), path.join(tmpDir, 'scripts'), {
    recursive: true,
  });
}

// release command is actually packaging task!
describe('hadron-build::release', function () {
  let tmpDir: string;
  let target: Target;
  before(async function () {
    // create a tmp dir where final built will be
    tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'hadron-build-release-test')
    );

    await copyCompassBuildAssetsToDir(tmpDir);
    target = new Target(tmpDir, {
      distribution: 'compass',
    });
    // Create the target.appPath as we are not packaging the compass here
    await fs.mkdir(target.resourcesAppDir, { recursive: true });
  });

  after(async function () {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  function resolveTargetPath(...args: string[]): string {
    return path.join(
      target.appPath,
      ...(target.platform === 'darwin' ? ['..'] : []),
      ...args
    );
  }

  it('writeLicenseFile', async function () {
    await writeLicenseFile(target);
    await fs.access(resolveTargetPath('LICENSE'));
  });

  it('copy3rdPartyNoticesFile', async function () {
    await copy3rdPartyNoticesFile(target);
    await fs.access(resolveTargetPath('THIRD-PARTY-NOTICES.md'));
  });

  it('writeVersionFile', async function () {
    await writeVersionFile(target);
    await fs.access(resolveTargetPath('version'));
  });

  it('symlinkExecutable', async function () {
    if (target.platform !== 'darwin') {
      return this.skip();
    }
    // Make Contents/MacOS dir, this is where we create this symlink
    const macOSPath = path.join(target.appPath, 'Contents', 'MacOS');
    await fs.mkdir(macOSPath, {
      recursive: true,
    });
    await symlinkExecutable(target);

    const link = await fs.lstat(path.join(macOSPath, 'Electron'));
    expect(link.isSymbolicLink()).to.be.true;
  });

  it('createApplicationAsar', async function () {
    await createApplicationAsar(target);
    const asar = path.resolve(path.dirname(target.resourcesAppDir), 'app.asar');
    await fs.access(asar);
  });
});
