import { expect } from 'chai';
import sinon from 'sinon';
import { AtlasPreferencesStorage } from './preferences-atlas';
import { getDefaultsForStoredPreferences } from './preferences-schema';
import type { AtlasServiceLike } from '@mongodb-js/compass-user-data';

const PREFERENCES_URL = 'https://cloud.mongodb.com/ui/userData/AppPreferences';

const mockResponse = (data: unknown) => ({
  json: () => Promise.resolve(data),
});

describe('AtlasPreferencesStorage', function () {
  let sandbox: sinon.SinonSandbox;
  let atlasService: AtlasServiceLike & {
    authenticatedFetch: sinon.SinonStub;
    userScopedUserDataEndpoint: sinon.SinonStub;
  };

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    atlasService = {
      userDataEndpoint: () => PREFERENCES_URL,
      userScopedUserDataEndpoint: sandbox.stub().returns(PREFERENCES_URL),
      authenticatedFetch: sandbox.stub(),
    };
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('loads stored preferences from the user-scoped endpoint on setup', async function () {
    atlasService.authenticatedFetch.resolves(
      mockResponse({ data: JSON.stringify({ currentUserId: 'stored-user' }) })
    );

    const storage = new AtlasPreferencesStorage(atlasService);
    await storage.setup();

    expect(storage.getPreferences()).to.deep.equal({
      ...getDefaultsForStoredPreferences(),
      currentUserId: 'stored-user',
    });

    const [url, options] = atlasService.authenticatedFetch.firstCall.args;
    expect(url).to.equal(PREFERENCES_URL);
    expect(options.method).to.equal('GET');
  });

  it('falls back to the defaults when there is no stored document', async function () {
    atlasService.authenticatedFetch.rejects(new Error('Not found'));

    const storage = new AtlasPreferencesStorage(atlasService);
    await storage.setup();

    expect(storage.getPreferences()).to.deep.equal(
      getDefaultsForStoredPreferences()
    );
  });

  it('persists merged preferences to the user-scoped endpoint and refreshes the cached value', async function () {
    let stored: { currentUserId?: string } = { currentUserId: 'old-user' };
    atlasService.authenticatedFetch.callsFake(
      (_url: string, options?: { method?: string; body?: string }) => {
        if (options?.method === 'PUT') {
          const payload = JSON.parse(options.body ?? '{}') as { data: string };
          stored = JSON.parse(payload.data) as { currentUserId?: string };
          return mockResponse({});
        }
        return mockResponse({ data: JSON.stringify(stored) });
      }
    );

    const storage = new AtlasPreferencesStorage(atlasService);
    await storage.setup();
    expect(storage.getPreferences().currentUserId).to.equal('old-user');

    await storage.updatePreferences({ currentUserId: 'new-user' });

    expect(stored.currentUserId).to.equal('new-user');
    expect(storage.getPreferences().currentUserId).to.equal('new-user');

    const putCall = atlasService.authenticatedFetch.getCalls().find((call) => {
      const options = call.args[1] as { method?: string } | undefined;
      return options?.method === 'PUT';
    });
    expect(putCall).to.be.ok;
    expect(putCall?.args[0]).to.equal(PREFERENCES_URL);
  });
});
