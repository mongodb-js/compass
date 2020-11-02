const chai = require('chai');
const sinonChai = require('sinon-chai');
const path = require('path');
const fs = require('fs-extra');
const CompassDownloadCenter = require('./download-center');

chai.use(sinonChai);
const { expect } = chai;

describe('CompassDownloadCenter', () => {
  let downloadCenter;
  let config;
  beforeEach(async() => {
    downloadCenter = new CompassDownloadCenter({});
    config = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'config.json')
    );
  });

  describe('getVersion', async() => {
    it('gets ga version', () => {
      const gaVersion = downloadCenter.getVersion(config, 'ga');
      expect(gaVersion).to.equal('1.22.1');
    });

    it('gets beta version', () => {
      const betaVersion = downloadCenter.getVersion(config, 'beta');
      expect(betaVersion).to.equal('1.23.0-beta.4');
    });
  });

  describe('getAssets', () => {
    it('returns all the assets for ga', () => {
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

    it('returns all the assets for beta', () => {
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

  describe('replaceVersion', () => {
    it('replaces all stable version with the new one', async() => {
      const expected = await fs.readJSON(
        path.resolve(__dirname, 'fixtures', 'expected-ga.json')
      );

      const updated = downloadCenter.replaceVersion(config, '1.23.0');
      expect(updated).to.deep.equal(expected);
    });

    it('replaces all beta versions with the new one', async() => {
      const expected = await fs.readJSON(
        path.resolve(__dirname, 'fixtures', 'expected-beta.json')
      );

      const updated = downloadCenter.replaceVersion(config, '1.23.0-beta.5');
      expect(updated).to.deep.equal(expected);
    });
  });
});
