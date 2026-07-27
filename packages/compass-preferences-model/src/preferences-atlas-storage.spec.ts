import { expect } from 'chai';
import Sinon from 'sinon';
import {
  AtlasPreferencesStorage,
  loadAtlasPreferences,
} from './preferences-atlas-storage';
import type {
  AtlasPreferencesStorageOptions,
  AtlasServiceLike,
} from './preferences-atlas-storage';
import { getDefaultsForStoredPreferences } from './preferences-schema';
import type { StoredPreferences } from './preferences-schema';

function fakeResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const USER_DATA_URL = Sinon.match(/\/userData\/AppPreferences$/);
const GET = Sinon.match({ method: 'GET' });
const PUT = Sinon.match({ method: 'PUT' });

type PreferencesEnvelope = { data: string; createdAt: string };

function savedDocument(preferences: Partial<StoredPreferences>) {
  const envelope: Pick<PreferencesEnvelope, 'data'> = {
    data: JSON.stringify(preferences),
  };
  return fakeResponse(envelope);
}

function createAtlasService(
  authenticatedFetch: Sinon.SinonStub
): AtlasServiceLike {
  return {
    authenticatedFetch,
    userDataEndpoint: (dataType) => `/userData/${dataType}`,
  };
}

describe('preferences-atlas-storage', function () {
  describe('loadAtlasPreferences', function () {
    let authenticatedFetch: Sinon.SinonStub;
    let atlasService: AtlasServiceLike;

    beforeEach(function () {
      authenticatedFetch = Sinon.stub();
      atlasService = createAtlasService(authenticatedFetch);
    });

    afterEach(function () {
      Sinon.restore();
    });

    it('loadAtlasPreferences GETs the AppPreferences url', async function () {
      authenticatedFetch.resolves(savedDocument({}));

      await loadAtlasPreferences(atlasService);

      expect(authenticatedFetch).to.have.been.calledOnceWith(
        '/userData/AppPreferences',
        GET
      );
    });

    it('returns exactly the saved keys, stripping anything not in the schema', async function () {
      authenticatedFetch.resolves(
        fakeResponse({
          data: JSON.stringify({
            maximumNumberOfActiveConnections: 5,
            nonexistentPreference: 'oops',
          }),
        })
      );

      const result = await loadAtlasPreferences(atlasService);

      expect(result).to.deep.equal({
        status: 'loaded',
        preferences: { maximumNumberOfActiveConnections: 5 },
      });
    });

    it('returns "empty" on a 404 — the user has never saved', async function () {
      authenticatedFetch.resolves(fakeResponse({ error: 'Not Found' }, 404));

      expect(await loadAtlasPreferences(atlasService)).to.deep.equal({
        status: 'empty',
      });
    });

    it('returns "failed" on any other non-ok status', async function () {
      authenticatedFetch.resolves(fakeResponse({ error: 'nope' }, 500));

      expect(await loadAtlasPreferences(atlasService)).to.deep.equal({
        status: 'failed',
      });
    });

    it('returns "failed" when the fetch rejects', async function () {
      authenticatedFetch.rejects(new Error('server down'));

      expect(await loadAtlasPreferences(atlasService)).to.deep.equal({
        status: 'failed',
      });
    });

    it('returns "failed" when the saved document is malformed', async function () {
      authenticatedFetch.resolves(fakeResponse({ _id: 'x', data: 'not json' }));

      expect(await loadAtlasPreferences(atlasService)).to.deep.equal({
        status: 'failed',
      });
    });
  });

  describe('AtlasPreferencesStorage', function () {
    let authenticatedFetch: Sinon.SinonStub;
    let atlasService: AtlasServiceLike;

    const userDataGet = () => authenticatedFetch.withArgs(USER_DATA_URL, GET);
    const userDataPut = () => authenticatedFetch.withArgs(USER_DATA_URL, PUT);

    beforeEach(function () {
      authenticatedFetch = Sinon.stub();
      atlasService = createAtlasService(authenticatedFetch);
      userDataGet().resolves(fakeResponse({ error: 'Not Found' }, 404));
      userDataPut().resolves(fakeResponse(undefined));
    });

    afterEach(function () {
      Sinon.restore();
    });

    function createStorage(options: AtlasPreferencesStorageOptions) {
      return new AtlasPreferencesStorage(atlasService, options);
    }

    function putPreferences() {
      const { body } = userDataPut().firstCall.args[1] as RequestInit;
      const { data } = JSON.parse(body as string) as PreferencesEnvelope;
      return JSON.parse(data) as Partial<StoredPreferences>;
    }

    it('setup() does no io — the load already happened', async function () {
      const storage = createStorage({ loadResult: { status: 'empty' } });

      await storage.setup();

      expect(authenticatedFetch).to.not.have.been.called;
    });

    it('exposes the loaded preferences', function () {
      const storage = createStorage({
        loadResult: {
          status: 'loaded',
          preferences: { maximumNumberOfActiveConnections: 5 },
        },
      });

      expect(
        storage.getPreferences().maximumNumberOfActiveConnections
      ).to.equal(5);
    });

    for (const status of ['empty', 'failed'] as const) {
      it(`falls back to the defaults when the load is "${status}"`, function () {
        const storage = createStorage({ loadResult: { status } });

        expect(
          storage.getPreferences().maximumNumberOfActiveConnections
        ).to.equal(
          getDefaultsForStoredPreferences().maximumNumberOfActiveConnections
        );
      });
    }

    it('persists on update when nothing was saved yet', async function () {
      const storage = createStorage({ loadResult: { status: 'empty' } });

      await storage.updatePreferences({
        maximumNumberOfActiveConnections: 7,
      });

      expect(userDataPut().calledOnce).to.equal(true);
      expect(putPreferences().maximumNumberOfActiveConnections).to.equal(7);
      expect(
        storage.getPreferences().maximumNumberOfActiveConnections
      ).to.equal(7);
    });

    it('sends the { data: string, createdAt } envelope the endpoint requires', async function () {
      const storage = createStorage({ loadResult: { status: 'empty' } });

      await storage.updatePreferences({
        maximumNumberOfActiveConnections: 7,
      });

      const { body } = userDataPut().firstCall.args[1] as RequestInit;
      const envelope = JSON.parse(body as string) as PreferencesEnvelope;
      expect(envelope.data).to.be.a('string');
      expect(envelope.createdAt).to.exist;
    });

    it('merges onto current server state, not the page-load snapshot', async function () {
      userDataGet().resolves(
        savedDocument({ enableShell: true, enableMyQueries: true })
      );

      const storage = createStorage({
        loadResult: { status: 'loaded', preferences: { enableShell: true } },
      });

      await storage.updatePreferences({
        maximumNumberOfActiveConnections: 7,
      });

      expect(putPreferences()).to.deep.equal({
        enableShell: true,
        enableMyQueries: true,
        maximumNumberOfActiveConnections: 7,
      });
    });

    it('lets the server win for keys this session did not change', async function () {
      userDataGet().resolves(savedDocument({ enableShell: false }));
      const storage = createStorage({
        loadResult: { status: 'loaded', preferences: { enableShell: true } },
      });

      await storage.updatePreferences({ enableMyQueries: true });

      expect(putPreferences()).to.deep.equal({
        enableShell: false,
        enableMyQueries: true,
      });
    });

    it('does NOT persist when the pre-write read fails — data-loss guard', async function () {
      userDataGet().resolves(fakeResponse({ error: 'nope' }, 500));
      const storage = createStorage({ loadResult: { status: 'empty' } });

      await storage.updatePreferences({
        maximumNumberOfActiveConnections: 7,
      });

      expect(userDataPut().called).to.equal(false);
      expect(
        storage.getPreferences().maximumNumberOfActiveConnections
      ).to.equal(7);
    });

    it('recovers from a failed initial load once the endpoint responds', async function () {
      userDataGet().resolves(savedDocument({ enableShell: true }));
      const storage = createStorage({ loadResult: { status: 'failed' } });

      await storage.updatePreferences({ enableMyQueries: true });

      expect(putPreferences()).to.deep.equal({
        enableShell: true,
        enableMyQueries: true,
      });
    });

    it('layers saved preferences over the compass-web defaults', function () {
      const storage = createStorage({
        loadResult: { status: 'loaded', preferences: { enableShell: true } },
        compassWebDefaults: { enableShell: false, enableMyQueries: false },
      });

      const preferences = storage.getPreferences();
      expect(preferences.enableShell).to.equal(true);
      expect(preferences.enableMyQueries).to.equal(false);
    });

    it('layers cloud overrides over the saved preferences', function () {
      const storage = createStorage({
        loadResult: {
          status: 'loaded',
          preferences: { enableGenAIFeaturesAtlasProject: true },
        },
        cloudOverrides: { enableGenAIFeaturesAtlasProject: false },
      });

      expect(storage.getPreferences().enableGenAIFeaturesAtlasProject).to.equal(
        false
      );
    });

    it('persists only the user layer', async function () {
      const storage = createStorage({
        loadResult: { status: 'empty' },
        compassWebDefaults: { enableMyQueries: false },
        cloudOverrides: { enableGenAIFeaturesAtlasProject: true },
      });

      await storage.updatePreferences({ enableShell: true });

      expect(putPreferences()).to.deep.equal({ enableShell: true });
    });

    it('does not throw when the write fails', async function () {
      userDataPut().resolves(fakeResponse({ error: 'nope' }, 400));
      const storage = createStorage({ loadResult: { status: 'empty' } });

      await storage.updatePreferences({
        maximumNumberOfActiveConnections: 7,
      });

      expect(
        storage.getPreferences().maximumNumberOfActiveConnections
      ).to.equal(7);
    });
  });
});
