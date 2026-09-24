import { expect } from 'chai';
import Sinon from 'sinon';
import { CompassWebPreferencesAccess } from 'compass-preferences-model/provider';
import {
  DEFAULT_COMPASS_WEB_PREFERENCES,
  getAtlasServiceBackendPreset,
  getPreferencesFromCloudApi,
  getProjectIdFromUrl,
} from './preferences';

const PROJECT_ID = '0123456789abcdef01234567';

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
      expect(
        getAtlasServiceBackendPreset('cloud-local.mmscloudteam.com')
      ).to.equal('atlas-local');
      expect(getAtlasServiceBackendPreset('localhost:3000')).to.equal(
        'atlas-local'
      );
    });
  });

  describe('getPreferencesFromCloudApi', function () {
    let cloudEndpointStub: Sinon.SinonStub;
    let authenticatedFetchStub: Sinon.SinonStub;
    let userDataEndpointStub: Sinon.SinonStub;
    let userScopedUserDataEndpointStub: Sinon.SinonStub;
    let atlasService: {
      cloudEndpoint(path?: string): string;
      authenticatedFetch(): Promise<Response>;
      userDataEndpoint(): string;
      userScopedUserDataEndpoint(): string;
    };

    beforeEach(function () {
      cloudEndpointStub = Sinon.stub().returns(
        `/explorer/v1/groups/${PROJECT_ID}/preferences`
      );
      authenticatedFetchStub = Sinon.stub();
      userDataEndpointStub = Sinon.stub();
      userScopedUserDataEndpointStub = Sinon.stub();
      atlasService = {
        cloudEndpoint: cloudEndpointStub,
        authenticatedFetch: authenticatedFetchStub,
        userDataEndpoint: userDataEndpointStub,
        userScopedUserDataEndpoint: userScopedUserDataEndpointStub,
      };
    });

    afterEach(function () {
      cloudEndpointStub.reset();
      authenticatedFetchStub.reset();
      userDataEndpointStub.reset();
      userScopedUserDataEndpointStub.reset();
    });

    it('requests the cloud preferences endpoint with the expected options', async function () {
      authenticatedFetchStub.resolves(fakeResponse(apiResponse));

      await getPreferencesFromCloudApi(PROJECT_ID, atlasService);

      expect(cloudEndpointStub).to.have.been.calledWith(
        `/explorer/v1/groups/${PROJECT_ID}/preferences`
      );
      expect(authenticatedFetchStub).to.have.been.calledOnceWith(
        `/explorer/v1/groups/${PROJECT_ID}/preferences`
      );
    });

    it('maps the cloud response to compass preferences', async function () {
      authenticatedFetchStub.resolves(fakeResponse(apiResponse));

      const {
        atlasCloudUserPreferences,
        atlasCloudProjectPreferences,
        atlasCloudOrgPreferences,
      } = await getPreferencesFromCloudApi(PROJECT_ID, atlasService);

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
      authenticatedFetchStub.resolves(
        fakeResponse({ ...apiResponse, userRoles: { isDataAccessWrite: true } })
      );

      const { atlasCloudUserPreferences } = await getPreferencesFromCloudApi(
        PROJECT_ID,
        atlasService
      );

      expect(atlasCloudUserPreferences).to.include({ readWrite: true });
      expect(atlasCloudUserPreferences).to.not.have.property('readOnly');
    });

    it('sets readOnly when the user has no elevated role', async function () {
      authenticatedFetchStub.resolves(
        fakeResponse({ ...apiResponse, userRoles: {} })
      );

      const { atlasCloudUserPreferences } = await getPreferencesFromCloudApi(
        PROJECT_ID,
        atlasService
      );

      expect(atlasCloudUserPreferences).to.include({ readOnly: true });
      expect(atlasCloudUserPreferences).to.not.have.property('readWrite');
    });

    it('does not enable index management for a plain read-write user (no index-manager role)', async function () {
      authenticatedFetchStub.resolves(
        fakeResponse({ ...apiResponse, userRoles: { isDataAccessWrite: true } })
      );

      const { atlasCloudUserPreferences } = await getPreferencesFromCloudApi(
        PROJECT_ID,
        atlasService
      );

      expect(atlasCloudUserPreferences).to.include({
        readWrite: true,
        enableIndexesManagement: false,
      });
    });

    it('enables index management for a read-write user with the index-manager role', async function () {
      authenticatedFetchStub.resolves(
        fakeResponse({
          ...apiResponse,
          userRoles: {
            isDataAccessWrite: true,
            isDataAccessAny: true,
            isGroupIndexManager: true,
          },
        })
      );

      const { atlasCloudUserPreferences } = await getPreferencesFromCloudApi(
        PROJECT_ID,
        atlasService
      );

      expect(atlasCloudUserPreferences).to.include({
        readWrite: true,
        enableIndexesManagement: true,
      });
    });

    it('enables index management for a read-only user with the index-manager role', async function () {
      authenticatedFetchStub.resolves(
        fakeResponse({
          ...apiResponse,
          userRoles: {
            isDataAccessAny: true,
            isGroupIndexManager: true,
          },
        })
      );

      const { atlasCloudUserPreferences } = await getPreferencesFromCloudApi(
        PROJECT_ID,
        atlasService
      );

      expect(atlasCloudUserPreferences).to.include({
        readOnly: true,
        enableIndexesManagement: true,
      });
    });

    it('does not enable index management for an index-manager without any data access', async function () {
      authenticatedFetchStub.resolves(
        fakeResponse({
          ...apiResponse,
          userRoles: { isGroupIndexManager: true },
        })
      );

      const { atlasCloudUserPreferences } = await getPreferencesFromCloudApi(
        PROJECT_ID,
        atlasService
      );

      expect(atlasCloudUserPreferences).to.include({
        readOnly: true,
        enableIndexesManagement: false,
      });
    });

    it('does not set index-management preferences for an admin (full UI)', async function () {
      authenticatedFetchStub.resolves(
        fakeResponse({
          ...apiResponse,
          userRoles: { isDataAccessAdmin: true, isGroupIndexManager: true },
        })
      );

      const { atlasCloudUserPreferences } = await getPreferencesFromCloudApi(
        PROJECT_ID,
        atlasService
      );

      expect(atlasCloudUserPreferences).to.not.have.property('readOnly');
      expect(atlasCloudUserPreferences).to.not.have.property('readWrite');
      expect(atlasCloudUserPreferences).to.not.have.property(
        'enableIndexesManagement'
      );
    });

    it('makes cloud feature flags resolve to the cloud value instead of the hardcoded released default', async function () {
      authenticatedFetchStub.resolves(fakeResponse(apiResponse));

      const {
        atlasCloudUserPreferences,
        atlasCloudProjectPreferences,
        atlasCloudOrgPreferences,
      } = await getPreferencesFromCloudApi(PROJECT_ID, atlasService);

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
      authenticatedFetchStub.resolves(fakeResponse(apiResponse));

      const {
        atlasCloudUserPreferences,
        atlasCloudProjectPreferences,
        atlasCloudOrgPreferences,
      } = await getPreferencesFromCloudApi(PROJECT_ID, atlasService);

      expect(atlasCloudUserPreferences).to.not.have.property('nonExistentFlag');
      expect(atlasCloudProjectPreferences).to.not.have.property(
        'nonExistentFlag'
      );
      expect(atlasCloudOrgPreferences).to.not.have.property('nonExistentFlag');
    });

    it('throws when the request fails', async function () {
      authenticatedFetchStub.rejects(new Error('boom'));

      let error: Error | undefined;
      try {
        await getPreferencesFromCloudApi(PROJECT_ID, atlasService);
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.be.an('error');
    });
  });
});
