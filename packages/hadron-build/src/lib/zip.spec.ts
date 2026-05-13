import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import _ from 'lodash';

import zip from './zip';
import { getConfig } from '../../test/test-helpers';
import chai from 'chai';

const { expect } = chai;

function skipUnlessRunningOn(platform: string) {
  before(function () {
    if (process.platform !== platform) {
      this.skip();
    }
  });
}

function getTargetZipPath(target: ReturnType<typeof getConfig>) {
  return (target.getAssetWithExtension('.zip') || {}).path;
}

function setupAndZipFakeTarget(target: ReturnType<typeof getConfig>) {
  beforeEach(async function () {
    await fs.mkdir(target.appPath, { recursive: true });
    await fs.writeFile(path.join(target.appPath, 'file'), '');
    zip(target, (err, result) => {
      if (err) {
        throw err;
      }
      expect(result).to.be.a('string');
    });
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
}

async function getTargetZipEntries(target: ReturnType<typeof getConfig>) {
  const file = await fs.readFile(getTargetZipPath(target) as string);
  const zipContent = await JSZip.loadAsync(file);

  return Object.values(zipContent.files).map((entry) =>
    _.pick(entry, ['name', 'dir'])
  );
}

describe('zip', function () {
  context('on linux', function () {
    skipUnlessRunningOn('linux');

    const target = getConfig({
      version: '1.2.0',
      platform: 'linux',
    });

    setupAndZipFakeTarget(target);

    it('would not throw', function () {
      // if the zip function would have thrown would have happened in
      // setupAndZipFakeTarget which sets a beforeEach.

      // This test case is here so the beforeEach runs.

      // Here we are also checking a precondition since the linux target
      // will not have a target.getAssetWithExtension('.zip') set.

      expect(target.getAssetWithExtension('.zip')).to.be.undefined;
    });
  });

  context('on darwin', function () {
    skipUnlessRunningOn('darwin');

    const target = getConfig({
      version: '1.2.0',
      platform: 'darwin',
    });

    setupAndZipFakeTarget(target);

    it('creates a zip with the right entries', async function () {
      const entries = await getTargetZipEntries(target);
      expect(entries).to.deep.equal([
        {
          name: 'MongoDB Compass Enterprise super long test name.app/',
          dir: true,
        },
        {
          name: 'MongoDB Compass Enterprise super long test name.app/file',
          dir: false,
        },
      ]);
    });
  });

  context('on win', function () {
    skipUnlessRunningOn('win32');

    const target = getConfig({
      version: '1.2.0',
      platform: 'win32',
    });

    setupAndZipFakeTarget(target);

    it('creates a zip with the right entries', async function () {
      const entries = await getTargetZipEntries(target);
      expect(entries).to.deep.equal([
        {
          name: 'file',
          dir: false,
        },
      ]);
    });
  });
});
