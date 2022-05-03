const chai = require('chai');
const sinonChai = require('sinon-chai');
const CompassDownloadCenter = require('./download-center');

chai.use(sinonChai);
const { expect } = chai;

const sinon = require('sinon');

const fs = require('fs-extra');
const path = require('path');

const publish = require('./publish');

describe('publish', function() {
  if (!!process.env.EVERGREEN && process.platform === 'darwin') {
    // These tests are not working well on Evergreen macOS machines and we will
    // skip them for now (they will run in GitHub CI)
    // eslint-disable-next-line no-console
    console.warn('Skipping release tests on Evergreen macOS machine');
    return;
  }

  let deps;
  const isTty = process.stdin.isTTY;

  beforeEach(async function() {
    const downloadCenterConfig = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'config.json')
    );

    const downloadCenter = new CompassDownloadCenter({});

    downloadCenter.downloadConfig = sinon.mock().resolves(downloadCenterConfig);
    downloadCenter.uploadConfig = sinon.mock().resolves();

    const github = {
      isReleasePublished: sinon.mock().resolves(true)
    };

    const changelog = {
      render: sinon.mock().resolves()
    };

    deps = {
      downloadCenter,
      github,
      changelog
    };

    process.stdin.isTTY = false;
  });

  afterEach(function() {
    process.stdin.isTTY = isTty;
  });

  it('skips upload if release version is same as download center', async function() {
    await (publish('1.21.1', deps));
    expect(deps.downloadCenter.uploadConfig).not.to.have.been.called;
  });

  it('skips upload if release version is older than download center', async function() {
    await (publish('1.20.0', deps));
    expect(deps.downloadCenter.uploadConfig).not.to.have.been.called;
  });

  it('uploads a release if version is newer than download center', async function() {
    const expected = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'expected-ga.json')
    );

    await (publish('1.23.0', deps));
    expect(deps.downloadCenter.uploadConfig).to.have.been.calledWith(expected);
  });
});
