import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import type Target from './../lib/target';

import zip, { getZipOptionsFromTarget } from './zip';
import { getTarget } from '../../test/test-helpers';
import chai from 'chai';

const { expect } = chai;

function getTargetZipPath(target: Target): string | undefined {
  return target.getAssetWithExtension('.zip')?.path;
}

async function getTargetZipEntries(
  target: Target
): Promise<Array<{ name: string; dir: boolean }>> {
  const file = await fs.readFile(getTargetZipPath(target) as string);
  const zipContent = await JSZip.loadAsync(file);

  return Object.values(zipContent.files)
    .filter((entry) => !entry.name.startsWith('__MACOSX'))
    .map((entry) => ({
      name: entry.name,
      dir: entry.dir,
    }));
}

function setupTargetForPlatform(platform: string): () => Target {
  let target: Target;

  before(function () {
    if (process.platform !== platform) {
      this.skip();
    }
  });

  beforeEach(async function () {
    target = getTarget({
      version: '1.2.0',
      platform,
    });
    await fs.mkdir(target.appPath, { recursive: true });
    await fs.writeFile(path.join(target.appPath, 'file'), '');
  });

  afterEach(async function () {
    const expectedZipPath = getTargetZipPath(target);
    await fs.rm(target.appPath, { recursive: true, force: true });
    try {
      await fs.rm(expectedZipPath as string, { force: true });
    } catch {
      // noop
    }
  });

  return () => target;
}
/**
 * I don't know why, but currently in the Target.ts we are only creating installers
 * for darwin and win32 platforms. For linux, we are creating a tarball directly from
 * there in addition to rpm/deb installers. So, on linux builds, zip is a no-op.
 * For darwin and win32, zip is created within release.ts.
 */
describe('zip', function () {
  describe('on linux', function () {
    const getTarget = setupTargetForPlatform('linux');

    it('would not throw', async function () {
      const target = getTarget();
      // This should not throw
      await zip(target);
      // No zip asset for linux
      expect(target.getAssetWithExtension('.zip')).to.be.undefined;
    });
  });

  describe('on darwin', function () {
    const getTarget = setupTargetForPlatform('darwin');

    it('if there is no .zip asset, it should not throw', async function () {
      const target = getTarget();
      // Remove all the assets
      target.assets = [];
      // If there's no asset it should not throw
      await zip(target);
      expect(target.getAssetWithExtension('.zip')).to.be.undefined;
    });

    it('if zip asset exists, it removes it before zipping', async function () {
      const target = getTarget();
      const zipPath = getTargetZipPath(target);
      expect(zipPath).to.not.be.undefined;
      await fs.writeFile(zipPath as string, 'something');
      await zip(target);
      const entries = await getTargetZipEntries(target);
      expect(entries).to.deep.equal([
        {
          name: 'MongoDB Compass.app/',
          dir: true,
        },
        {
          name: 'MongoDB Compass.app/file',
          dir: false,
        },
      ]);
    });

    it('creates a zip with the right entries', async function () {
      const target = getTarget();
      await zip(target);
      const entries = await getTargetZipEntries(target);
      expect(entries).to.deep.equal([
        {
          name: 'MongoDB Compass.app/',
          dir: true,
        },
        {
          name: 'MongoDB Compass.app/file',
          dir: false,
        },
      ]);
    });
  });

  describe('on win', function () {
    const getTarget = setupTargetForPlatform('win32');

    it('if there is no .zip asset, it should not throw', async function () {
      const target = getTarget();
      // Remove all the assets
      target.assets = [];
      // If there's no asset it should not throw
      await zip(target);
      expect(target.getAssetWithExtension('.zip')).to.be.undefined;
    });

    it('if zip asset exists, it removes it before zipping', async function () {
      const target = getTarget();
      const zipPath = getTargetZipPath(target);
      expect(zipPath).to.not.be.undefined;
      await fs.writeFile(zipPath as string, 'something');
      await zip(target);
      const entries = await getTargetZipEntries(target);
      expect(entries).to.deep.equal([
        {
          name: 'file',
          dir: false,
        },
      ]);
    });

    it('creates a zip with the right entries', async function () {
      const target = getTarget();
      await zip(target);
      const entries = await getTargetZipEntries(target);
      expect(entries).to.deep.equal([
        {
          name: 'file',
          dir: false,
        },
      ]);
    });
  });

  describe('getZipOptionsFromTarget', function () {
    let target: Target;
    beforeEach(function () {
      target = getTarget();
    });
    it('returns null if there is no .zip asset', function () {
      target.assets = [];
      expect(getZipOptionsFromTarget(target)).to.be.null;
    });
    it('when path is absolute', function () {
      expect(getZipOptionsFromTarget(target)).to.deep.equal({
        dir: target.appPath,
        out: getTargetZipPath(target)!,
        platform: target.platform,
      });
    });
    it('when path is relative', function () {
      target.assets[0].path = path.relative(
        process.cwd(),
        target.assets[0].path
      );
      expect(getZipOptionsFromTarget(target)).to.deep.equal({
        dir: target.appPath,
        out: getTargetZipPath(target)!,
        platform: target.platform,
      });
    });
  });
});
