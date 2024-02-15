import { expect } from 'chai';
import Sinon from 'sinon';
import { AtlasService } from './atlas-service';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import type { AtlasUserInfo } from './util';
import { getStore } from './store/atlas-signin-store';
import { AtlasSignInActions } from './store/atlas-signin-reducer';

const USER: AtlasUserInfo = {
  enabledAIFeature: true,
  firstName: 'John',
  lastName: 'Doe',
  login: 'johndoe',
  primaryEmail: 'johndoe@mongodb.com',
  sub: '123',
};

class AtlasUserDataMock {
  getUser() {
    return Promise.resolve(USER);
  }
  updateConfig() {
    return Promise.resolve();
  }
}

function setReducerLoginState() {
  getStore().dispatch({ type: AtlasSignInActions.RestoringStart });
  getStore().dispatch({
    type: AtlasSignInActions.RestoringSuccess,
    userInfo: USER,
  });
}

describe('AtlasService', function () {
  let atlasService: AtlasService;
  let preferences: PreferencesAccess;
  let sandbox: Sinon.SinonSandbox;
  const initialFetch = global.fetch;

  beforeEach(async function () {
    sandbox = Sinon.createSandbox();
    preferences = await createSandboxFromDefaultPreferences();
    atlasService = new AtlasService(
      new AtlasUserDataMock(),
      preferences,
      createNoopLoggerAndTelemetry()
    );
  });

  afterEach(function () {
    global.fetch = initialFetch;
    sandbox.restore();
  });

  it('should throw when network traffic is disabled', async function () {
    await preferences.savePreferences({ networkTraffic: false });
    try {
      await atlasService.fetch('https://example.com');
      expect.fail('Expected to throw when network traffic is disabled');
    } catch (err) {
      expect(err).to.have.property('message', 'Network traffic is not allowed');
    }
  });

  it('should throw the error when server throws', async function () {
    const fetchStub = sandbox.stub().resolves({
      status: 500,
      ok: false,
      statusText: 'Internal Server Error',
      json: sandbox.stub().rejects(new Error('invalid json')),
    });
    global.fetch = fetchStub;

    try {
      await atlasService.unAuthenticatedFetch('https://example.com');
      expect.fail('Expected fetch to throw');
    } catch (err) {
      expect(err).to.have.property('message', '500: Internal Server Error');
    }
  });

  it('should use the abort signal in the fetch request', async function () {
    const c = new AbortController();
    c.abort();

    try {
      await atlasService.unAuthenticatedFetch('https://example.com', {
        signal: c.signal,
      });
      expect.fail('Expected fetch to throw as the signal was aborted');
    } catch (err) {
      expect(err).to.have.property('message', 'This operation was aborted');
    }
  });

  it('should fetch data from unAuthenticatedFetch', async function () {
    const expectedData = { data: 'test' };
    const fetchStub = sandbox.stub().resolves({
      status: 200,
      ok: true,
      json: () => Promise.resolve(expectedData),
    });
    global.fetch = fetchStub;
    const response = await atlasService.unAuthenticatedFetch(
      'https://example.com'
    );
    const data = await response.json();

    expect(fetchStub.calledOnce).to.be.true;
    expect(data).to.deep.equal(expectedData);
  });

  it('should fetch JSON data from unAuthenticatedFetchJson', async function () {
    const expectedData = { data: 'test' };
    const fetchStub = sandbox.stub().resolves({
      status: 200,
      ok: true,
      json: () => Promise.resolve(expectedData),
    });
    global.fetch = fetchStub;
    const data = await atlasService.unAuthenticatedFetchJson(
      'https://example.com'
    );

    expect(data).to.deep.equal(expectedData);

    expect(fetchStub.calledOnce).to.be.true;
    expect(fetchStub.firstCall.args[1].headers).to.have.property(
      'Accept',
      'application/json'
    );
  });

  it('should fetch data from fetch', async function () {
    const expectedData = { data: 'test' };
    const fetchStub = sandbox.stub().resolves({
      status: 200,
      ok: true,
      json: () => Promise.resolve(expectedData),
    });
    global.fetch = fetchStub;
    atlasService['httpClient']['atlasLoginServiceRenderer'].getToken = () =>
      Promise.resolve('super-secret');
    const response = await atlasService.fetch('https://example.com');
    const data = await response.json();

    expect(fetchStub.calledOnce).to.be.true;
    expect(data).to.deep.equal(expectedData);

    expect(fetchStub.firstCall.args[1].headers).to.have.property(
      'Authorization',
      'Bearer super-secret'
    );
  });

  it('should fetch JSON data from fetchJson', async function () {
    const expectedData = { data: 'test' };
    const fetchStub = sandbox.stub().resolves({
      status: 200,
      ok: true,
      json: () => Promise.resolve(expectedData),
    });
    global.fetch = fetchStub;
    atlasService['httpClient']['atlasLoginServiceRenderer'].getToken = () =>
      Promise.resolve('super-secret');
    const data = await atlasService.fetchJson('https://example.com');

    expect(fetchStub.calledOnce).to.be.true;
    expect(data).to.deep.equal(expectedData);

    expect(fetchStub.firstCall.args[1].headers).to.have.property(
      'Authorization',
      'Bearer super-secret'
    );
    expect(fetchStub.firstCall.args[1].headers).to.have.property(
      'Accept',
      'application/json'
    );
  });

  it('should get the current user', async function () {
    const user = await atlasService.getCurrentUser();
    expect(user).to.deep.equal(USER);
  });

  it('should disable the AI feature', async function () {
    setReducerLoginState();
    sandbox.spy(atlasService['atlasUser'], 'updateConfig');
    await atlasService.disableAIFeature();
    expect(
      (atlasService as any).atlasUser.updateConfig
    ).to.have.been.calledWith({ enabledAIFeature: false });
  });

  it('should enable the AI feature', async function () {
    setReducerLoginState();
    sandbox.spy(atlasService['atlasUser'], 'updateConfig');
    await atlasService.enableAIFeature();
    expect(
      (atlasService as any).atlasUser.updateConfig
    ).to.have.been.calledWith({ enabledAIFeature: true });
  });
});
