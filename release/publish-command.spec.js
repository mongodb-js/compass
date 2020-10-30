const chai = require('chai');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const { expect } = chai;

const sinon = require('sinon');

const fs = require('fs-extra');
const path = require('path');

const { replaceVersion, getSemverFromVersionId, publishCommand } = require('./publish-command');

describe('getSemverFromVersionId', () => {
  it('gets the correct version', () => {
    const ids = [
      '1.22.1',
      '1.22.1-readonly',
      '1.22.1-isolated',
      '1.23.0-beta.4',
      '1.23.0-beta.4-readonly',
      '1.23.0-beta.4-isolated',
    ];

    expect(ids.map(getSemverFromVersionId)).to.deep.equal([
      '1.22.1',
      '1.22.1',
      '1.22.1',
      '1.23.0-beta.4',
      '1.23.0-beta.4',
      '1.23.0-beta.4',
    ]);
  });
});

describe('replaceVersion', () => {
  it('replaces all stable version with the new one', async() => {
    const original = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'config.json')
    );

    const expected = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'expected-ga.json')
    );

    const updated = replaceVersion(original, '1.23.0');
    expect(updated).to.deep.equal(expected);
  });

  it('replaces all beta versions with the new one', async() => {
    const original = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'config.json')
    );

    const expected = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'expected-beta.json')
    );

    const updated = replaceVersion(original, '1.23.0-beta.5');
    expect(updated).to.deep.equal(expected);
  });
});

describe.only('publishCommand', () => {
  let deps;
  beforeEach(async() => {
    const downloadCenterConfig = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'config.json')
    );

    const fakeWait = async(fn) => {
      const res = await fn();
      if (res) {
        return res;
      }

      throw new Error('maxWaitTime reached.');
    };

    const wait = sinon.spy(fakeWait);
    const downloadCenter = {
      downloadConfig: sinon.spy(() => downloadCenterConfig),
      uploadConfig: sinon.spy()
    };

    const probePlatformDownloadLink = sinon.spy(() => Promise.resolve({ok: true}));

    const github = {
      getReleaseByTag: sinon.spy(() => Promise.resolve({draft: false}))
    };

    deps = {
      downloadCenter,
      wait,
      probePlatformDownloadLink,
      github
    };
  });

  it('waits for all assets', async() => {
    await publishCommand('1.23.0', deps);

    const downloadLinks = deps.probePlatformDownloadLink.getCalls()
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

  it('fails if assets are unreacheable', async() => {
    const error = await (publishCommand('1.23.0', {
      ...deps,
      probePlatformDownloadLink: () => ({ok: false, status: 404})
    })).catch(e => e);

    expect(error.message).to.equal('maxWaitTime reached.');
    expect(deps.downloadCenter.uploadConfig).not.to.have.been.called;
  });

  it('skips upload if release version is same as download center', async() => {
    await (publishCommand('1.21.1', deps));
    expect(deps.downloadCenter.uploadConfig).not.to.have.been.called;
  });

  it('skips upload if release version is older than download center', async() => {
    await (publishCommand('1.20.0', deps));
    expect(deps.downloadCenter.uploadConfig).not.to.have.been.called;
  });

  it('uploads a release version is newer than download center', async() => {
    const expected = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'expected-ga.json')
    );

    await (publishCommand('1.23.0', deps));
    expect(deps.downloadCenter.uploadConfig).to.have.been.calledWith(
      'com-download-center/compass.json', expected
    );
  });

  it('waits for a draft github release to be created', async() => {
    const error = await (publishCommand('1.23.0', {
      ...deps,
      github: {
        getReleaseByTag: () => undefined
      }
    })).catch(e => e);

    expect(error.message).to.equal('maxWaitTime reached.');
  });

  it('waits for a the github release to be published', async() => {
    const error = await (publishCommand('1.23.0', {
      ...deps,
      github: {
        getReleaseByTag: () => (Promise.resolve({
          draft: true,
          html_url: 'http://example.com'
        }))
      }
    })).catch(e => e);

    expect(error.message).to.equal('maxWaitTime reached.');
  });
});
