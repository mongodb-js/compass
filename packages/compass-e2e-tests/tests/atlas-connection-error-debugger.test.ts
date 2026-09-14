import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser.ts';
import { getClusterConnectionStringsFromNames } from '../helpers/commands/index.ts';
import {
  init,
  cleanup,
  createExternalBrowser,
  screenshotIfFailed,
  screenshotPathName,
  skipForWeb,
} from '../helpers/compass.ts';
import type { Compass } from '../helpers/compass.ts';
import * as Selectors from '../helpers/selectors.ts';
import { ATLAS_CLOUD_TEST_UTILS } from '../helpers/test-runner-context.ts';

// This test relies on Atlas resources (org, projects, paused/network-access
// clusters) that only exist in the atlas-qa environment, so it always runs
// against QA regardless of the task it's executed in.
// TODO(COMPASS-10934): dynamically generate these
const ATLAS_ENV = 'qa' as const;
const QA_ORG_ID = '67ec23f45c93b57f2845860f';
const PAUSED_PROJECT_ID = '6a8c5d1677636c0fc4177a8a';
const PAUSED_CLUSTER_NAME = 'paused';
const NETWORK_ACCESS_PROJECT_ID = '6a8c5aef77636c0fc41764f5';
const NETWORK_ACCESS_CLUSTER_NAME = 'network-access';

function hasAtlasCloudTestUtils(): boolean {
  if (!ATLAS_CLOUD_TEST_UTILS) {
    if (process.env.ci || process.env.CI) {
      throw new Error(
        'Missing required ATLAS_CLOUD_TEST_UTILS environmental variable'
      );
    }
    return false;
  }

  return true;
}

async function isSignedIn(browser: CompassBrowser): Promise<boolean> {
  return await browser.execute(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return await require('electron').ipcRenderer.invoke(
      'AtlasService.isAuthenticated',
      {}
    );
  });
}

describe('Atlas connection error debugger', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let username: string;
  let password: string;
  let session: CompassBrowser | undefined;

  before(async function () {
    skipForWeb(
      this,
      'the connection error debugger is only available in the desktop app'
    );

    if (!hasAtlasCloudTestUtils()) {
      return this.skip();
    }

    session = await createExternalBrowser(false);
    ({ username, password } = await session.createAtlasLoginUser(ATLAS_ENV, {
      existingOrgId: QA_ORG_ID,
    }));
  });

  after(async function () {
    if (username) {
      await session?.deleteAtlasUser(username, ATLAS_ENV);
    }

    await session?.deleteSession().catch(() => {});
  });

  beforeEach(async function () {
    try {
      compass = await init(this.test?.fullTitle(), {
        extraSpawnArgs: [
          // Windows transforms --atlasServiceBackendPreset to
          // --atlasservicebackendpreset, which then fails the test
          // as the env is not loaded properly. In order to avoid this,
          // we need to use kebab-case when passing arguments to Windows
          process.platform === 'win32'
            ? '--atlas-service-backend-preset=atlas-qa'
            : '--atlasServiceBackendPreset=atlas-qa',
        ],
      });
      browser = compass.browser;

      const backendPreset = await browser.getFeature(
        'atlasServiceBackendPreset'
      );
      expect(backendPreset).to.equal('atlas-qa');

      await browser.setFeature('enableAtlasSignIn', true);
      await browser.setFeature('enableAtlasConnectionErrorDebugger', true);
      await browser.setFeature('enableGenAIFeatures', true);
      await browser.setFeature('optInGenAIFeatures', true);
      await browser.setFeature('enableGenAIFeaturesAtlasProject', true);
      await browser.setFeature('enableGenAIToolCallingAtlasProject', true);
      await browser.setFeature('enableGenAIToolCalling', true);
      await browser.setFeature('enableGenAIFeaturesAtlasOrg', true);
      await browser.setEnv(
        'COMPASS_ASSISTANT_BASE_URL_OVERRIDE',
        'https://knowledge.mongodb.com/api/v1'
      );
      await browser.$(Selectors.AssistantDrawerButton).waitForDisplayed();
    } catch (err) {
      await browser.screenshot(
        screenshotPathName('before-atlas-connection-error-debugger')
      );
      throw err;
    }
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
    if (compass) {
      await cleanup(compass);
    }
  });

  const useDebugger = async (connectionString: string) => {
    await browser.connectWithConnectionString(connectionString, {
      connectionStatus: 'failure',
    });

    await browser.clickVisible(
      browser.$(Selectors.ConnectionToastErrorDebugButton)
    );

    const chatMessages = browser.$(Selectors.AssistantChatMessages);
    await chatMessages.waitForDisplayed();

    const connectToAtlasButton = chatMessages.$('button=Connect to Atlas');
    await connectToAtlasButton.waitForDisplayed({ timeout: 2 * 60_000 });

    await browser.signInToAtlasDesktop({
      username,
      password,
      env: ATLAS_ENV,
      triggerSignIn: () => browser.clickVisible(connectToAtlasButton),
      waitForSignedIn: () => isSignedIn(browser),
    });

    return { chatMessages };
  };

  it('reports that the cluster is paused', async function () {
    const connectionString = await getClusterConnectionStringsFromNames(
      session!,
      [PAUSED_CLUSTER_NAME],
      username,
      password,
      ATLAS_ENV,
      PAUSED_PROJECT_ID
    );
    const { chatMessages } = await useDebugger(connectionString[0][1]);

    await browser.waitUntil(
      async () => {
        const text = await chatMessages.getText();
        return text.includes('PAUSED');
      },
      {
        timeout: 2 * 60_000,
      }
    );
  });

  it('reports ip access not allowed', async function () {
    const connectionString = await getClusterConnectionStringsFromNames(
      session!,
      [NETWORK_ACCESS_CLUSTER_NAME],
      username,
      password,
      ATLAS_ENV,
      NETWORK_ACCESS_PROJECT_ID
    );
    const { chatMessages } = await useDebugger(connectionString[0][1]);

    await browser.waitUntil(
      async () => {
        const text = await chatMessages.getText();
        return text.includes('Client IP Not Allowed');
      },
      {
        timeout: 2 * 60_000,
      }
    );
  });
});
