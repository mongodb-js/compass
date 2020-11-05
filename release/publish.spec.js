const chai = require('chai');
const sinonChai = require('sinon-chai');
const CompassDownloadCenter = require('./download-center');

chai.use(sinonChai);
const { expect } = chai;

const sinon = require('sinon');

const fs = require('fs-extra');
const path = require('path');

const publish = require('./publish');

describe('publish', () => {
  let deps;
  beforeEach(async() => {
    const downloadCenterConfig = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'config.json')
    );

    const downloadCenter = new CompassDownloadCenter({});

    downloadCenter.downloadConfig = sinon.mock().resolves(downloadCenterConfig);
    downloadCenter.uploadConfig = sinon.mock().resolves();

    const github = {
      waitForReleaseCreated: sinon.mock().resolves({
        draft: true,
        html_url: 'http://example.com'
      }),
      waitForReleasePublished: sinon.mock().resolves(),
    };

    deps = {
      downloadCenter,
      github
    };
  });

  it('skips upload if release version is same as download center', async() => {
    await (publish('1.21.1', deps));
    expect(deps.downloadCenter.uploadConfig).not.to.have.been.called;
  });

  it('skips upload if release version is older than download center', async() => {
    await (publish('1.20.0', deps));
    expect(deps.downloadCenter.uploadConfig).not.to.have.been.called;
  });

  it('uploads a release if version is newer than download center', async() => {
    const expected = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'expected-ga.json')
    );

    await (publish('1.23.0', deps));
    expect(deps.downloadCenter.uploadConfig).to.have.been.calledWith(expected);
  });

  it('waits for a draft github release to be created', async() => {
    const error = await (publish('1.23.0', {
      ...deps,
      github: {
        ...deps.github,
        waitForReleaseCreated: () => { throw new Error('maxWaitTime reached.'); }
      }
    })).catch(e => e);

    expect(error.message).to.equal('maxWaitTime reached.');
  });

  it('waits for a the github release to be published', async() => {
    const error = await (publish('1.23.0', {
      ...deps,
      github: {
        ...deps.github,
        waitForReleasePublished: () => { throw new Error('maxWaitTime reached.'); }
      }
    })).catch(e => e);

    expect(error.message).to.equal('maxWaitTime reached.');
  });
});
