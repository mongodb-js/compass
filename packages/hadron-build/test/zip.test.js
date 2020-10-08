/* eslint-disable no-sync */
const fsExtra = require('fs-extra');
const path = require('path');
const JSZip = require('jszip');
const _ = require('lodash');

const zip = require('../lib/zip');
const getTarget = require('./helpers').getConfig;
const chai = require('chai');
const expect = chai.expect;

function getTargetZipPath(target) {
  return (target.getAssetWithExtension('.zip') || {}).path;
}

function setupAndZipFakeTarget(target) {
  beforeEach((done) => {
    fsExtra.mkdirpSync(target.appPath);
    fsExtra.writeFileSync(path.join(target.appPath, 'file'));
    zip(target, done);
  });

  afterEach(() => {
    const expectedZipPath = getTargetZipPath(target);
    fsExtra.removeSync(target.appPath);

    if (fsExtra.existsSync(expectedZipPath)) {
      fsExtra.removeSync(expectedZipPath);
    }
  });
}

async function getTargetZipEntries(target) {
  const file = fsExtra.readFileSync(getTargetZipPath(target));
  const zipContent = await JSZip.loadAsync(file);

  return Object.values(zipContent.files).map(entry => _.pick(entry, [
    'name', 'dir'
  ]));
}

describe('zip', function() {
  context('on linux', () => {
    const target = getTarget({
      version: '1.2.0',
      platform: 'linux'
    });

    setupAndZipFakeTarget(target);

    it('would not throw', () => {
      // if the zip function would have thrown would have happened in
      // setupAndZipFakeTarget which sets a beforeEach.

      // This test case is here so the beforeEach runs.

      // Here we are also checking a precondition since the linux target
      // will not have a target.getAssetWithExtension('.zip') set.

      expect(target.getAssetWithExtension('.zip')).to.be.undefined;
    });
  });

  context('on darwin', () => {
    const target = getTarget({
      version: '1.2.0',
      platform: 'darwin'
    });

    setupAndZipFakeTarget(target);

    it('creates a zip with the right entries', async() => {
      const entries = await getTargetZipEntries(target);
      expect(entries).to.deep.equal([
        {
          name: 'MongoDB Compass Enterprise super long test name.app/',
          dir: true
        },
        {
          name: 'MongoDB Compass Enterprise super long test name.app/file',
          dir: false
        }
      ]);
    });
  });

  context('on win', () => {
    const target = getTarget({
      version: '1.2.0',
      platform: 'win32'
    });

    setupAndZipFakeTarget(target);

    it('creates a zip with the right entries', async() => {
      const entries = await getTargetZipEntries(target);
      expect(entries).to.deep.equal([
        {
          name: 'file',
          dir: false
        }
      ]);
    });
  });
});
