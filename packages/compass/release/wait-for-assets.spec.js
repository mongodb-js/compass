const chai = require('chai');
const sinonChai = require('sinon-chai');
const waitForAssets = require('./wait-for-assets');

chai.use(sinonChai);
const { expect } = chai;

const sinon = require('sinon');

const fs = require('fs-extra');
const path = require('path');

const CompassDownloadCenter = require('./download-center');

describe('waitForAssets', function() {
  if (!!process.env.EVERGREEN && process.platform === 'darwin') {
    // These tests are not working well on Evergreen macOS machines and we will
    // skip them for now (they will run in GitHub CI)
    // eslint-disable-next-line no-console
    console.warn('Skipping release tests on Evergreen macOS machine');
    return;
  }

  let downloadCenter;
  beforeEach(async function() {
    const downloadCenterConfig = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'config.json')
    );

    downloadCenter = new CompassDownloadCenter({});

    downloadCenter.downloadConfig = sinon.mock().resolves(downloadCenterConfig);
    downloadCenter.uploadConfig = sinon.mock().resolves();
    downloadCenter.waitForAsset = sinon.spy(() => Promise.resolve());
  });

  it('waits for all assets', async function() {
    await waitForAssets('1.23.0', { downloadCenter });

    const downloadLinks = downloadCenter.waitForAsset.getCalls()
      .map(c => c.lastArg.download_link);
    expect(downloadLinks).to.deep.equal([
      'https://downloads.mongodb.com/compass/mongodb-compass-1.23.0-darwin-x64.dmg',
      'https://downloads.mongodb.com/compass/mongodb-compass-1.23.0-win32-x64.exe',
      'https://downloads.mongodb.com/compass/mongodb-compass-1.23.0-win32-x64.zip',
      'https://downloads.mongodb.com/compass/mongodb-compass-1.23.0-win32-x64.msi',
      'https://downloads.mongodb.com/compass/mongodb-compass_1.23.0_amd64.deb',
      'https://downloads.mongodb.com/compass/mongodb-compass-1.23.0.x86_64.rpm',
      'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.23.0-darwin-x64.dmg',
      'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.23.0-win32-x64.exe',
      'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.23.0-win32-x64.zip',
      'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.23.0-win32-x64.msi',
      'https://downloads.mongodb.com/compass/mongodb-compass-readonly_1.23.0_amd64.deb',
      'https://downloads.mongodb.com/compass/mongodb-compass-readonly-1.23.0.x86_64.rpm',
      'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.23.0-darwin-x64.dmg',
      'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.23.0-win32-x64.exe',
      'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.23.0-win32-x64.zip',
      'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.23.0-win32-x64.msi',
      'https://downloads.mongodb.com/compass/mongodb-compass-isolated_1.23.0_amd64.deb',
      'https://downloads.mongodb.com/compass/mongodb-compass-isolated-1.23.0.x86_64.rpm'
    ]);
  });
});
