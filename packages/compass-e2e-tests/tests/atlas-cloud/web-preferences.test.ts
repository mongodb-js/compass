import { expect } from 'chai';
import type { Compass } from '../../helpers/compass.ts';
import type { CompassBrowser } from '../../helpers/compass-browser.ts';
import { cleanup, init, screenshotIfFailed } from '../../helpers/compass.ts';
import { createNumbersCollection } from '../../helpers/mongo-clients.ts';
import {
  context,
  isTestingWebAtlasCloud,
  getDefaultConnectionNames,
} from '../../helpers/test-runner-context.ts';

describe('Web preferences', function () {
  before(function () {
    if (!isTestingWebAtlasCloud()) {
      this.skip();
    }
  });

  let compass: Compass;
  let browser: CompassBrowser;

  beforeEach(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();

    await createNumbersCollection();
    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      getDefaultConnectionNames(0),
      'test',
      'numbers',
      'Documents'
    );
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
    await cleanup(compass);
  });

  it('should load preferences from atlas', async function () {
    const ENVIRONMENT_TO_PRESET = {
      dev: 'atlas-dev',
      qa: 'atlas-qa',
      staging: 'atlas-staging',
      prod: 'atlas',
    } as const;

    const {
      telemetryAtlasUserId,
      atlasServiceBackendPreset,
      optInGenAIFeatures,
      enableGenAIFeaturesAtlasOrg,
      enableGlobalWrites,
      enableRollingIndexes,
      enableAIAssistant,
      enableGenAIToolCallingAtlasProject,
      enableMyQueries,
      readOnly,
      readWrite,
    } = await browser.getFeatures();

    const preferenceStates = await browser.execute(async () => {
      const kSandboxPreferencesAccess = Symbol.for(
        '@compass-web-sandbox-preferences-access'
      );
      const access = (globalThis as Record<symbol, unknown>)[
        kSandboxPreferencesAccess
      ] as {
        getPreferenceStates(): Promise<Record<string, string | undefined>>;
      };
      return await access.getPreferenceStates();
    });

    // telemetryAtlasUserId is undefined by default; a non-empty string proves
    // the API was called and userAuid was mapped.
    expect(telemetryAtlasUserId).to.be.a('string').and.not.equal('');
    expect(preferenceStates.telemetryAtlasUserId).to.equal('set-cloud-user');

    // atlasServiceBackendPreset is derived from window.location.host inside
    // the API response handler; its value must match the test environment.
    expect(atlasServiceBackendPreset).to.equal(
      ENVIRONMENT_TO_PRESET[
        context.atlasCloudEnvironment as keyof typeof ENVIRONMENT_TO_PRESET
      ]
    );
    expect(preferenceStates.atlasServiceBackendPreset).to.equal(
      'set-cloud-user'
    );

    // User
    expect(optInGenAIFeatures).to.be.a('boolean');
    expect(preferenceStates.optInGenAIFeatures).to.equal('set-cloud-user');

    // Org
    expect(enableGenAIFeaturesAtlasOrg).to.be.a('boolean');
    expect(preferenceStates.enableGenAIFeaturesAtlasOrg).to.equal(
      'set-cloud-org'
    );

    // Project
    expect(preferenceStates.enableGlobalWrites).to.equal('set-cloud-project');
    expect(enableGlobalWrites).to.equal(true);
    expect(preferenceStates.enableRollingIndexes).to.equal('set-cloud-project');
    expect(enableRollingIndexes).to.equal(true);
    expect(preferenceStates.enableAIAssistant).to.equal('set-cloud-project');
    expect(enableAIAssistant).to.equal(true);

    // Non-feature-flag preferences from featureFlags land in the user bucket.
    expect(preferenceStates.enableGenAIToolCallingAtlasProject).to.equal(
      'set-cloud-user'
    );
    expect(enableGenAIToolCallingAtlasProject).to.equal(true);
    expect(preferenceStates.enableMyQueries).to.equal('set-cloud-user');
    expect(enableMyQueries).to.equal(true);

    // readOnly and readWrite are mapped from userRoles. The test user has admin
    // access, so neither restriction is set.
    expect(readOnly).to.equal(false);
    expect(readWrite).to.equal(false);
  });
});
