import { expect } from 'chai';
import Sinon from 'sinon';
import { CompassWebPreferencesAccess } from 'compass-preferences-model/provider';
import {
  DEFAULT_COMPASS_WEB_PREFERENCES,
  getAtlasServiceBackendPreset,
  getPreferencesFromCloudApi,
  getProjectIdFromUrl,
} from './preferences';
import { defaultHeaders } from './url-builder';

const PROJECT_ID = '0123456789abcdef01234567';

const apiResponse = {
  featureFlags: {
    // Released Compass feature flags, cloud should override.
    enableGlobalWrites: false,
    enableRollingIndexes: true,

    // Regular preferences applied as plain overrides.
    enableGenAIFeaturesAtlasProject: true,
    enableMyQueries: true,

    nonExistantFlag: true,
  },
  userAuid: 'auid-123',
  appUser: { isOptedIntoDataExplorerGenAIFeatures: true },
  currentOrganization: { genAIFeaturesEnabled: true },
};

function fakeResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Internal Server Error',
    json: () => Promise.resolve(body),
  } as unknown as Response;
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
      expect(getAtlasServiceBackendPreset('cloud-local.mongodb.com')).to.equal(
        'atlas-local'
      );
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
        preferences,
        atlasCloudUserFeatureFlags,
        atlasCloudProjectFeatureFlags,
        atlasCloudOrgFeatureFlags,
      } = await getPreferencesFromCloudApi(PROJECT_ID);

      expect(preferences).to.include({
        telemetryAtlasUserId: 'auid-123',
        optInGenAIFeatures: true,
        enableGenAIFeaturesAtlasOrg: true,
        // host is localhost:3000 in the test environment
        atlasServiceBackendPreset: 'atlas-local',
        // feature flag values are also kept as overrides
        enableGlobalWrites: false,
        enableRollingIndexes: true,
        // regular preferences from the flat map
        enableGenAIFeaturesAtlasProject: true,
        enableMyQueries: true,
      });

      // Only Compass feature flags are pulled into the cloud overrides (by project scope).
      expect(atlasCloudProjectFeatureFlags).to.deep.equal({
        enableGlobalWrites: false,
        enableRollingIndexes: true,
      });
      expect(atlasCloudUserFeatureFlags).to.deep.equal({});
      expect(atlasCloudOrgFeatureFlags).to.deep.equal({});
    });

    it('makes cloud feature flags resolve to the cloud value instead of the hardcoded released default', async function () {
      fetchStub.resolves(fakeResponse(apiResponse));

      const {
        preferences: preferencesFromApi,
        atlasCloudUserFeatureFlags,
        atlasCloudProjectFeatureFlags,
        atlasCloudOrgFeatureFlags,
      } = await getPreferencesFromCloudApi(PROJECT_ID);

      const preferences = new CompassWebPreferencesAccess(
        { ...DEFAULT_COMPASS_WEB_PREFERENCES, ...preferencesFromApi },
        {
          atlasCloudUser: atlasCloudUserFeatureFlags,
          atlasCloudProject: atlasCloudProjectFeatureFlags,
          atlasCloudOrg: atlasCloudOrgFeatureFlags,
        }
      ).getPreferences();

      // Cloud value wins over the "released" hardcoded `true`.
      expect(preferences.enableGlobalWrites).to.equal(false);
      expect(preferences.enableRollingIndexes).to.equal(true);
      // A released flag not present in the response stays hardcoded `true`.
      expect(preferences.enableDataModeling).to.equal(true);
      // Populates a non-existant flag.
      expect((preferences as any).nonExistantFlag).to.equal(true);
    });

    it('throws when the request is not ok', async function () {
      fetchStub.resolves(fakeResponse({}, false));

      let error: Error | undefined;
      try {
        await getPreferencesFromCloudApi(PROJECT_ID);
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.be.an('error');
    });
  });
});
