import { expect } from 'chai';
import Sinon from 'sinon';
import { AtlasService } from './atlas-service';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { CompassAtlasAuthService } from './compass-atlas-auth-service';

const ATLAS_CONFIG = {
  wsBaseUrl: 'ws://example.com',
  cloudBaseUrl: 'ws://example.com/cloud',
  atlasApiBaseUrl: 'http://example.com/api',
  atlasLogin: {
    clientId: 'some-client-id',
    issuer: 'http://example.com/oauth2/default',
  },
  authPortalUrl: 'http://example.com/account/login',
};

function getAtlasService(
  preferences: PreferencesAccess,
  getAuthHeadersFn?: () => Promise<Record<string, string>>
) {
  const authService = new CompassAtlasAuthService();
  authService['getAuthHeaders'] = getAuthHeadersFn as any;

  const atlasService = new AtlasService(
    authService,
    preferences,
    createNoopLogger()
  );
  atlasService['config'] = ATLAS_CONFIG;
  return atlasService;
}

describe('AtlasService', function () {
  let atlasService: AtlasService;
  let preferences: PreferencesAccess;
  let sandbox: Sinon.SinonSandbox;
  const initialFetch = global.fetch;

  beforeEach(async function () {
    sandbox = Sinon.createSandbox();
    preferences = await createSandboxFromDefaultPreferences();
    atlasService = getAtlasService(preferences);
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
      await atlasService.fetch('https://example.com');
      expect.fail('Expected fetch to throw');
    } catch (err) {
      expect(err).to.have.property('message', '500: Internal Server Error');
    }
  });

  it('should use the abort signal in the fetch request', async function () {
    const c = new AbortController();
    c.abort();

    try {
      await atlasService.fetch('https://example.com', {
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
    const response = await atlasService.fetch('https://example.com');
    const data = await response.json();

    expect(fetchStub.calledOnce).to.be.true;
    expect(data).to.deep.equal(expectedData);
  });

  it('should fetch data from fetch', async function () {
    const expectedData = { data: 'test' };
    const fetchStub = sandbox.stub().resolves({
      status: 200,
      ok: true,
      json: () => Promise.resolve(expectedData),
    });
    global.fetch = fetchStub;
    const getAuthHeadersFn = sandbox.stub().resolves({
      Authorization: 'Bearer super-secret',
    });
    const atlasService = getAtlasService(preferences, getAuthHeadersFn);
    const response = await atlasService.authenticatedFetch(
      'https://example.com'
    );
    const data = await response.json();

    expect(fetchStub.calledOnce).to.be.true;
    expect(data).to.deep.equal(expectedData);

    expect(fetchStub.firstCall.args[1].headers).to.have.property(
      'Authorization',
      'Bearer super-secret'
    );
    expect(getAuthHeadersFn.calledOnce).to.be.true;
  });

  it('should set CSRF headers when available', async function () {
    const fetchStub = sandbox.stub().resolves({ status: 200, ok: true });
    global.fetch = fetchStub;
    document.head.append(
      (() => {
        const el = document.createElement('meta');
        el.setAttribute('name', 'csrf-token');
        el.setAttribute('content', 'token');
        return el;
      })()
    );
    document.head.append(
      (() => {
        const el = document.createElement('meta');
        el.setAttribute('name', 'CSRF-TIME');
        el.setAttribute('content', 'time');
        return el;
      })()
    );
    await atlasService.fetch('/foo/bar', { method: 'POST' });
    expect(fetchStub.firstCall.lastArg.headers).to.deep.eq({
      'X-CSRF-Time': 'time',
      'X-CSRF-Token': 'token',
    });
  });
});
