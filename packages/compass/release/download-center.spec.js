const chai = require('chai');
const sinonChai = require('sinon-chai');
const path = require('path');
const fs = require('fs-extra');
const CompassDownloadCenter = require('./download-center');

chai.use(sinonChai);
const { expect } = chai;

describe('CompassDownloadCenter', function() {
  if (!!process.env.EVERGREEN && process.platform === 'darwin') {
    // These tests are not working well on Evergreen macOS machines and we will
    // skip them for now (they will run in GitHub CI)
    // eslint-disable-next-line no-console
    console.warn('Skipping release tests on Evergreen macOS machine');
    return;
  }

  let downloadCenter;
  let config;
  beforeEach(async function() {
    downloadCenter = new CompassDownloadCenter({});
    config = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'config.json')
    );
  });

  describe('getVersion', function() {
    it('gets ga version', function() {
      const gaVersion = downloadCenter.getVersion(config, 'ga');
      expect(gaVersion).to.equal('1.22.1');
    });

    it('gets beta version', function() {
      const betaVersion = downloadCenter.getVersion(config, 'beta');
      expect(betaVersion).to.equal('1.23.0-beta.4');
    });
  });

  describe('getAssets', function() {
    it('returns all the assets for ga', function() {
      expect(
        downloadCenter.getAssets(config, 'ga')
          .map((asset) => path.basename(asset.download_link))
      ).to.deep.equal([
        'mongodb-compass-1.22.1-darwin-x64.dmg',
        'mongodb-compass-1.22.1-win32-x64.exe',
        'mongodb-compass-1.22.1-win32-x64.zip',
        'mongodb-compass-1.22.1-win32-x64.msi',
        'mongodb-compass_1.22.1_amd64.deb',
        'mongodb-compass-1.22.1.x86_64.rpm',
        'mongodb-compass-readonly-1.22.1-darwin-x64.dmg',
        'mongodb-compass-readonly-1.22.1-win32-x64.exe',
        'mongodb-compass-readonly-1.22.1-win32-x64.zip',
        'mongodb-compass-readonly-1.22.1-win32-x64.msi',
        'mongodb-compass-readonly_1.22.1_amd64.deb',
        'mongodb-compass-readonly-1.22.1.x86_64.rpm',
        'mongodb-compass-isolated-1.22.1-darwin-x64.dmg',
        'mongodb-compass-isolated-1.22.1-win32-x64.exe',
        'mongodb-compass-isolated-1.22.1-win32-x64.zip',
        'mongodb-compass-isolated-1.22.1-win32-x64.msi',
        'mongodb-compass-isolated_1.22.1_amd64.deb',
        'mongodb-compass-isolated-1.22.1.x86_64.rpm'
      ]);
    });

    it('returns all the assets for beta', function() {
      expect(
        downloadCenter.getAssets(config, 'beta')
          .map((asset) => path.basename(asset.download_link))
      ).to.deep.equal([
        'mongodb-compass-1.23.0-beta.4-darwin-x64.dmg',
        'mongodb-compass-1.23.0-beta.4-win32-x64.exe',
        'mongodb-compass-1.23.0-beta.4-win32-x64.zip',
        'mongodb-compass-1.23.0-beta.4-win32-x64.msi',
        'mongodb-compass-beta_1.23.0~beta.4_amd64.deb',
        'mongodb-compass-beta-1.23.0-beta.4.x86_64.rpm',
        'mongodb-compass-readonly-1.23.0-beta.4-darwin-x64.dmg',
        'mongodb-compass-readonly-1.23.0-beta.4-win32-x64.exe',
        'mongodb-compass-readonly-1.23.0-beta.4-win32-x64.zip',
        'mongodb-compass-readonly-1.23.0-beta.4-win32-x64.msi',
        'mongodb-compass-readonly-beta_1.23.0~beta.4_amd64.deb',
        'mongodb-compass-readonly-beta-1.23.0-beta.4.x86_64.rpm',
        'mongodb-compass-isolated-1.23.0-beta.4-darwin-x64.dmg',
        'mongodb-compass-isolated-1.23.0-beta.4-win32-x64.exe',
        'mongodb-compass-isolated-1.23.0-beta.4-win32-x64.zip',
        'mongodb-compass-isolated-1.23.0-beta.4-win32-x64.msi',
        'mongodb-compass-isolated-beta_1.23.0~beta.4_amd64.deb',
        'mongodb-compass-isolated-beta-1.23.0-beta.4.x86_64.rpm'
      ]);
    });
  });

  describe('replaceVersion', function() {
    it('replaces all stable version with the new one', async function() {
      const expected = await fs.readJSON(
        path.resolve(__dirname, 'fixtures', 'expected-ga.json')
      );

      const updated = downloadCenter.replaceVersion(config, '1.23.0');
      expect(updated).to.deep.equal(expected);
    });

    it('replaces all beta versions with the new one', async function() {
      const expected = await fs.readJSON(
        path.resolve(__dirname, 'fixtures', 'expected-beta.json')
      );

      const updated = downloadCenter.replaceVersion(config, '1.23.0-beta.5');
      expect(updated).to.deep.equal(expected);
    });
  });
});
