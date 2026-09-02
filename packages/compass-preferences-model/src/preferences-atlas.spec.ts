import { expect } from 'chai';
import sinon from 'sinon';
import {
  AtlasPreferencesStorage,
  type AtlasPreferencesRemoteService,
} from './preferences-atlas';
import { getDefaultsForStoredPreferences } from './preferences-schema';
import type { StoredPreferences } from './preferences-schema';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function envelope(preferences: Partial<StoredPreferences>) {
  return { data: JSON.stringify(preferences) };
}

function createRemote(
  authenticatedFetch: AtlasPreferencesRemoteService['authenticatedFetch']
): AtlasPreferencesRemoteService {
  return {
    authenticatedFetch,
    userDataEndpoint: (dataType) => `/ui/userData/${dataType}`,
  };
}

describe('AtlasPreferencesStorage', function () {
  const defaults = getDefaultsForStoredPreferences();

  describe('setup', function () {
    it('GETs the AppPreferences document', async function () {
      const fetchStub = sinon
        .stub()
        .resolves(jsonResponse(envelope({ enableShell: true })));
      const storage = new AtlasPreferencesStorage(createRemote(fetchStub), {});

      await storage.setup();

      expect(fetchStub).to.have.been.calledOnce;
      const [url, init] = fetchStub.firstCall.args;
      expect(url).to.equal('/ui/userData/AppPreferences');
      expect(init).to.deep.equal({ method: 'GET' });
      expect(storage.getPreferences().enableShell).to.equal(true);
    });

    it('only loads once', async function () {
      const fetchStub = sinon.stub().resolves(jsonResponse(envelope({})));
      const storage = new AtlasPreferencesStorage(createRemote(fetchStub), {});

      await storage.setup();
      await storage.setup();

      expect(fetchStub).to.have.been.calledOnce;
    });

    it('treats a 404 as nothing saved yet', async function () {
      const storage = new AtlasPreferencesStorage(
        createRemote(sinon.stub().resolves(jsonResponse({}, 404))),
        {}
      );

      await storage.setup();

      expect(storage.getPreferences()).to.deep.equal(defaults);
    });

    it('treats malformed stored preferences as nothing saved yet', async function () {
      const storage = new AtlasPreferencesStorage(
        createRemote(
          sinon.stub().resolves(jsonResponse({ data: 'not-json-at-all' }))
        ),
        {}
      );

      await storage.setup();

      expect(storage.getPreferences()).to.deep.equal(defaults);
    });

    it('falls back to defaults when the backend errors', async function () {
      const storage = new AtlasPreferencesStorage(
        createRemote(sinon.stub().rejects(new Error('network down'))),
        {}
      );

      await storage.setup();

      expect(storage.getPreferences()).to.deep.equal(defaults);
    });
  });

  describe('getPreferences', function () {
    it('layers cloud overrides over saved preferences over web defaults', async function () {
      const storage = new AtlasPreferencesStorage(
        createRemote(
          sinon
            .stub()
            .resolves(
              jsonResponse(
                envelope({ enableShell: true, enableExplainPlan: false })
              )
            )
        ),
        {
          compassWebDefaults: { enableShell: false, enableImportExport: true },
          cloudOverrides: { enableExplainPlan: true },
        }
      );

      await storage.setup();
      const preferences = storage.getPreferences();

      // Saved value wins over the web default.
      expect(preferences.enableShell).to.equal(true);
      // Cloud override wins over the saved value.
      expect(preferences.enableExplainPlan).to.equal(true);
      // Web default applies when nothing else sets it.
      expect(preferences.enableImportExport).to.equal(true);
    });

    it('returns a complete set of preferences', async function () {
      const storage = new AtlasPreferencesStorage(
        createRemote(sinon.stub().resolves(jsonResponse(envelope({})))),
        {}
      );

      await storage.setup();

      expect(Object.keys(storage.getPreferences())).to.have.members(
        Object.keys(defaults)
      );
    });
  });

  describe('updatePreferences', function () {
    it('PUTs the merged preferences and updates the cached copy', async function () {
      const fetchStub = sinon.stub();
      fetchStub
        .onFirstCall()
        .resolves(jsonResponse(envelope({ enableShell: true })));
      fetchStub.onSecondCall().resolves(jsonResponse({}));
      const storage = new AtlasPreferencesStorage(createRemote(fetchStub), {});
      await storage.setup();

      await storage.updatePreferences({ enableImportExport: true });

      const [url, init] = fetchStub.secondCall.args;
      expect(url).to.equal('/ui/userData/AppPreferences');
      expect(init.method).to.equal('PUT');
      expect(JSON.parse(init.body as string).data).to.equal(
        JSON.stringify({ enableShell: true, enableImportExport: true })
      );
      expect(storage.getPreferences().enableImportExport).to.equal(true);
    });

    it('throws and keeps the cached copy when the backend errors', async function () {
      const fetchStub = sinon.stub();
      fetchStub.onFirstCall().resolves(jsonResponse(envelope({})));
      fetchStub.onSecondCall().resolves(jsonResponse({}, 500));
      const storage = new AtlasPreferencesStorage(createRemote(fetchStub), {});
      await storage.setup();

      const error = await storage
        .updatePreferences({ enableImportExport: true })
        .catch((err: Error) => err);

      expect(error).to.be.an.instanceOf(Error);
      expect(storage.getPreferences().enableImportExport).to.equal(
        defaults.enableImportExport
      );
    });

    it('throws without calling the backend when preferences are invalid', async function () {
      const fetchStub = sinon.stub();
      fetchStub.onFirstCall().resolves(jsonResponse(envelope({})));
      const storage = new AtlasPreferencesStorage(createRemote(fetchStub), {});
      await storage.setup();

      const error = await storage
        .updatePreferences({
          maximumNumberOfActiveConnections: 'not-a-number',
        } as unknown as Partial<StoredPreferences>)
        .catch((err: Error) => err);

      expect(error).to.be.an.instanceOf(Error);
      expect(fetchStub).to.have.been.calledOnce;
    });
  });
});
