/* eslint-disable mocha/no-top-level-hooks */
/* eslint-disable no-sync */
import { promises as fs } from 'fs';

import path from 'path';
import JSZip from 'jszip';
import _ from 'lodash';
import { rimraf } from 'rimraf';

import { getTestTarget } from '../../test/helpers';
import { createZipPackage } from './zip';
import { expect } from 'chai';
import type { Target } from '../../dist/lib/target';

function skipUnlessRunningOn(platform) {
  before(function () {
    if (process.platform !== platform) {
      this.skip();
    }
  });
}

function getTargetZipPath(target: Target) {
  return (target.getAssetWithExtension('.zip') || {}).path;
}

function setupAndZipFakeTarget(target: Target) {
  beforeEach(async function () {
    await fs.mkdir(target.appPath, { recursive: true });
    const filePath = path.join(target.appPath, 'file');
    await fs.writeFile(filePath, '');
    await createZipPackage(target);
  });

  afterEach(async function () {
    const expectedZipPath = getTargetZipPath(target);
    await rimraf(target.appPath);

    if (await fs.stat(expectedZipPath).catch(() => false)) {
      await fs.unlink(expectedZipPath);
    }
  });
}

async function getTargetZipEntries(target: Target) {
  const file = await fs.readFile(getTargetZipPath(target));
  const zipContent = await JSZip.loadAsync(file);

  return Object.values(zipContent.files).map((entry) =>
    _.pick(entry, ['name', 'dir'])
  );
}

describe('zip', function () {
  context('on linux', function () {
    const target = getTestTarget({
      distribution: 'compass',
      version: '1.2.0',
      platform: 'linux',
      arch: 'x64',
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

    const target = getTestTarget({
      distribution: 'compass',
      version: '1.2.0',
      platform: 'darwin',
      arch: 'arm64',
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
    // skipUnlessRunningOn('win32');

    const target = getTestTarget({
      distribution: 'compass',
      version: '1.2.0',
      platform: 'win32',
      arch: 'x64',
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
