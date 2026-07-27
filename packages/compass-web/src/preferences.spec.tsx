import { expect } from 'chai';
import Sinon from 'sinon';
import { CompassWebPreferencesAccess } from 'compass-preferences-model/provider';
import type { AllPreferences } from 'compass-preferences-model/provider';
import {
  DEFAULT_COMPASS_WEB_PREFERENCES,
  getAtlasServiceBackendPreset,
  getPreferencesFromCloudApi,
  getProjectIdFromUrl,
  loadCompassWebPreferences,
  resetCompassWebPreferencesCache,
} from './preferences';
import { defaultHeaders } from './url-builder';

const PROJECT_ID = '0123456789abcdef01234567';

const emptyApiResponse = {
  featureFlags: { enableCompassWebSettings: true },
  userAuid: 'auid-123',
  appUser: { isOptedIntoDataExplorerGenAIFeatures: false },
  currentOrganization: { genAIFeaturesEnabled: false },
  userRoles: { isDataAccessAdmin: true },
};

const apiResponse = {
  featureFlags: {
    // Released Compass feature flags, cloud should override.
    enableGlobalWrites: false,
    enableRollingIndexes: true,

    // Regular preferences applied as plain overrides.
    enableGenAIFeaturesAtlasProject: true,
    enableMyQueries: true,

    nonExistentFlag: true,
  },
  userAuid: 'auid-123',
  appUser: { isOptedIntoDataExplorerGenAIFeatures: true },
  currentOrganization: { genAIFeaturesEnabled: true },
  userRoles: { isDataAccessAdmin: true },
};

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

type PreferencesEnvelope = { data: string };

function savedDocument(preferences: Partial<AllPreferences>) {
  const envelope: PreferencesEnvelope = { data: JSON.stringify(preferences) };
  return fakeResponse(envelope);
}

describe('compass-web preferences', function () {
  describe('getProjectIdFromUrl', function () {
    it('extracts the project id from a /v2/{projectId} path', function () {
      expect(getProjectIdFromUrl(`/v2/${PROJECT_ID}`)).to.equal(PROJECT_ID);
      expect(getProjectIdFromUrl(`/v2/${PROJECT_ID}/clusters`)).to.equal(
        PROJECT_ID
      );
    });

    it('returns undefined when there is no project id in the path', function () {
      expect(getProjectIdFromUrl('/')).to.equal(undefined);
      expect(getProjectIdFromUrl('/account/login')).to.equal(undefined);
      expect(getProjectIdFromUrl('/v2/not-an-object-id')).to.equal(undefined);
    });
  });

  describe('getAtlasServiceBackendPreset', function () {
    it('derives the backend preset from the host', function () {
      expect(getAtlasServiceBackendPreset('cloud.mongodb.com')).to.equal(
        'atlas'
      );
      expect(getAtlasServiceBackendPreset('cloud-dev.mongodb.com')).to.equal(
        'atlas-dev'
      );
      expect(getAtlasServiceBackendPreset('cloud-qa.mongodb.com')).to.equal(
        'atlas-qa'
      );
      expect(getAtlasServiceBackendPreset('cloud-stage.mongodb.com')).to.equal(
        'atlas-staging'
      );
      expect(
        getAtlasServiceBackendPreset('cloud-local.mmscloudteam.com')
      ).to.equal('atlas-local');
      expect(getAtlasServiceBackendPreset('localhost:3000')).to.equal(
        'atlas-local'
      );
    });
  });

  describe('getPreferencesFromCloudApi', function () {
    let fetchStub: Sinon.SinonStub;

    beforeEach(function () {
      fetchStub = Sinon.stub(globalThis, 'fetch');
    });

    afterEach(function () {
      fetchStub.restore();
    });

    it('requests the cloud preferences endpoint with the expected options', async function () {
      fetchStub.resolves(fakeResponse(apiResponse));

      await getPreferencesFromCloudApi(PROJECT_ID);

      expect(fetchStub.calledOnce).to.equal(true);
      const [url, init] = fetchStub.firstCall.args;
      expect(url).to.equal(`/explorer/v1/groups/${PROJECT_ID}/preferences`);
      expect(init).to.deep.equal({
        headers: defaultHeaders,
        credentials: 'include',
      });
    });

    it('maps the cloud response to compass preferences', async function () {
      fetchStub.resolves(fakeResponse(apiResponse));

      const {
        atlasCloudUserPreferences,
        atlasCloudProjectPreferences,
        atlasCloudOrgPreferences,
      } = await getPreferencesFromCloudApi(PROJECT_ID);

      expect(atlasCloudUserPreferences).to.include({
        telemetryAtlasUserId: 'auid-123',
        optInGenAIFeatures: true,
        // host is localhost:3000 in the test environment
        atlasServiceBackendPreset: 'atlas-local',
        // feature flag values are also kept as overrides
        enableGlobalWrites: false,
        enableRollingIndexes: true,
        // regular preferences from the flat map
        enableGenAIFeaturesAtlasProject: true,
        enableMyQueries: true,
      });
      expect(atlasCloudUserPreferences).to.not.have.property('readOnly');
      expect(atlasCloudUserPreferences).to.not.have.property('readWrite');

      // Only Compass feature flags are pulled into the cloud overrides (by project scope).
      expect(atlasCloudProjectPreferences).to.deep.equal({
        enableGlobalWrites: false,
        enableRollingIndexes: true,
      });
      expect(atlasCloudOrgPreferences).to.deep.equal({
        enableGenAIFeaturesAtlasOrg: true,
      });
    });

    it('sets readWrite when userRoles.isDataAccessWrite is true', async function () {
      fetchStub.resolves(
        fakeResponse({ ...apiResponse, userRoles: { isDataAccessWrite: true } })
      );

      const { atlasCloudUserPreferences } = await getPreferencesFromCloudApi(
        PROJECT_ID
      );

      expect(atlasCloudUserPreferences).to.include({ readWrite: true });
      expect(atlasCloudUserPreferences).to.not.have.property('readOnly');
    });

    it('sets readOnly when the user has no elevated role', async function () {
      fetchStub.resolves(fakeResponse({ ...apiResponse, userRoles: {} }));

      const { atlasCloudUserPreferences } = await getPreferencesFromCloudApi(
        PROJECT_ID
      );

      expect(atlasCloudUserPreferences).to.include({ readOnly: true });
      expect(atlasCloudUserPreferences).to.not.have.property('readWrite');
    });

    it('makes cloud feature flags resolve to the cloud value instead of the hardcoded released default', async function () {
      fetchStub.resolves(fakeResponse(apiResponse));

      const {
        atlasCloudUserPreferences,
        atlasCloudProjectPreferences,
        atlasCloudOrgPreferences,
      } = await getPreferencesFromCloudApi(PROJECT_ID);

      const preferences = new CompassWebPreferencesAccess(
        {
          ...DEFAULT_COMPASS_WEB_PREFERENCES,
          ...atlasCloudUserPreferences,
          ...atlasCloudProjectPreferences,
          ...atlasCloudOrgPreferences,
        },
        {
          atlasCloudUser: atlasCloudUserPreferences,
          atlasCloudProject: atlasCloudProjectPreferences,
          atlasCloudOrg: atlasCloudOrgPreferences,
        }
      ).getPreferences();

      // Cloud value wins over the "released" hardcoded `true`.
      expect(preferences.enableGlobalWrites).to.equal(false);
      expect(preferences.enableRollingIndexes).to.equal(true);
      // The project preference.
      expect(preferences.enableGenAIFeaturesAtlasProject).to.equal(true);
      expect(preferences.enableGenAIFeaturesAtlasOrg).to.equal(true);
    });

    it('ignores unknown feature flags', async function () {
      fetchStub.resolves(fakeResponse(apiResponse));

      const {
        atlasCloudUserPreferences,
        atlasCloudProjectPreferences,
        atlasCloudOrgPreferences,
      } = await getPreferencesFromCloudApi(PROJECT_ID);

      expect(atlasCloudUserPreferences).to.not.have.property('nonExistentFlag');
      expect(atlasCloudProjectPreferences).to.not.have.property(
        'nonExistentFlag'
      );
      expect(atlasCloudOrgPreferences).to.not.have.property('nonExistentFlag');
    });

    it('throws when the request is not ok', async function () {
      fetchStub.resolves(fakeResponse({}, 500));

      let error: Error | undefined;
      try {
        await getPreferencesFromCloudApi(PROJECT_ID);
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.be.an('error');
    });
  });

  describe('loadCompassWebPreferences', function () {
    let fetchStub: Sinon.SinonStub;

    const userDataGet = () => fetchStub.withArgs(USER_DATA_URL, GET);
    const userDataPut = () => fetchStub.withArgs(USER_DATA_URL, PUT);

    beforeEach(function () {
      fetchStub = Sinon.stub(globalThis, 'fetch');
      fetchStub.resolves(fakeResponse(emptyApiResponse));
      userDataGet().resolves(fakeResponse({ error: 'Not Found' }, 404));
      userDataPut().resolves(fakeResponse(undefined));
    });

    afterEach(function () {
      Sinon.restore();
      resetCompassWebPreferencesCache();
    });

    function putPreferences() {
      const { body } = userDataPut().firstCall.args[1] as RequestInit;
      const { data } = JSON.parse(body as string) as PreferencesEnvelope;
      return JSON.parse(data) as Partial<AllPreferences>;
    }

    it('surfaces the persisted preferences', async function () {
      userDataGet().resolves(
        savedDocument({ maximumNumberOfActiveConnections: 4 })
      );

      const access = await loadCompassWebPreferences(PROJECT_ID);

      expect(access.getPreferences().maximumNumberOfActiveConnections).to.equal(
        4
      );
    });

    it('applies the compass-web defaults when nothing was persisted', async function () {
      const access = await loadCompassWebPreferences(PROJECT_ID);
      expect(access.getPreferences().enableImportExport).to.equal(false);
    });

    it('does not let a persisted preference override a cloud value', async function () {
      fetchStub.resolves(
        fakeResponse({
          ...emptyApiResponse,
          featureFlags: {
            enableCompassWebSettings: true,
            enableGenAIFeaturesAtlasProject: false,
          },
        })
      );
      userDataGet().resolves(
        savedDocument({ enableGenAIFeaturesAtlasProject: true })
      );

      const access = await loadCompassWebPreferences(PROJECT_ID);

      expect(access.getPreferences().enableGenAIFeaturesAtlasProject).to.equal(
        false
      );
    });

    it('persists a saved preference to the endpoint', async function () {
      const access = await loadCompassWebPreferences(PROJECT_ID);
      await access.savePreferences({ enableShell: true });

      expect(userDataPut().calledOnce).to.equal(true);
      expect(putPreferences()).to.deep.equal({ enableShell: true });
    });

    context('when enableCompassWebSettings is disabled', function () {
      beforeEach(function () {
        fetchStub.resolves(
          fakeResponse({
            ...emptyApiResponse,
            featureFlags: { enableCompassWebSettings: false },
          })
        );
      });

      it('does not fetch or persist preferences through the mms endpoint', async function () {
        const access = await loadCompassWebPreferences(PROJECT_ID);
        await access.savePreferences({ enableShell: true });

        expect(userDataGet().called).to.equal(false);
        expect(userDataPut().called).to.equal(false);
        expect(access.getPreferences().enableShell).to.equal(true);
      });
    });
  });
});
