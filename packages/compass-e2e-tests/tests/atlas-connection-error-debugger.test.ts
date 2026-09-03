import type { CompassBrowser } from '../helpers/compass-browser.ts';
import {
  createAtlasLoginUser,
  getClusterConnectionStringsFromNames,
} from '../helpers/commands/index.ts';
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
import {
  context,
  ATLAS_CLOUD_TEST_UTILS,
} from '../helpers/test-runner-context.ts';

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

const ENVIRONMENT_TO_PRESET = {
  dev: 'atlas-dev',
  qa: 'atlas-qa',
  staging: 'atlas-staging',
  prod: 'atlas',
} as const;

function getAtlasBackendPresetForEnvironment(ctx = context) {
  return ENVIRONMENT_TO_PRESET[
    (ctx.atlasCloudEnvironment ?? 'qa') as keyof typeof ENVIRONMENT_TO_PRESET
  ];
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
  let deleteAtlasUser: () => Promise<void>;
  let session: CompassBrowser | undefined;

  before(async function () {
    skipForWeb(
      this,
      'the connection error debugger is only available in the desktop app'
    );

    if (!hasAtlasCloudTestUtils()) {
      return this.skip();
    }

    // Driving the Atlas login page (form + consent + redirects against a real
    // Atlas environment) can take longer than the oidc-plugin's default "open
    // browser" timeout.
    process.env.COMPASS_OIDC_OPEN_BROWSER_TIMEOUT_OVERRIDE = String(60_000);

    session = await createExternalBrowser(false);

    try {
      ({
        username,
        password,
        cleanup: deleteAtlasUser,
      } = await createAtlasLoginUser(session, { orgId: QA_ORG_ID }));
    } catch (err) {
      await browser.screenshot(
        screenshotPathName('before-atlas-connection-error-debugger')
      );
      throw err;
    }
  });

  after(async function () {
    await deleteAtlasUser?.();
    await session?.deleteSession().catch(() => {});
  });

  beforeEach(async function () {
    compass = await init(this.test?.fullTitle(), {
      extraSpawnArgs: [
        `--atlasServiceBackendPreset=${getAtlasBackendPresetForEnvironment()}`,
      ],
    });
    browser = compass.browser;

    await browser.setFeature('enableAtlasSignIn', true);
    await browser.setFeature('enableAtlasConnectionErrorDebugger', true);
    await browser.setFeature('enableGenAIFeatures', true);
    await browser.setFeature('optInGenAIFeatures', true);
    await browser.setFeature('enableGenAIToolCalling', true);
    await browser.setFeature('enableGenAIToolCallingAtlasProject', true);
  });

  afterEach(async function () {
    if (compass) {
      await cleanup(compass);
    }
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('reports that the cluster is paused', async function () {
    const pausedClusterConnectionString =
      await getClusterConnectionStringsFromNames(
        session!,
        [PAUSED_CLUSTER_NAME, NETWORK_ACCESS_CLUSTER_NAME],
        username,
        password,
        PAUSED_PROJECT_ID
      ).then(
        (connectionStrings) =>
          connectionStrings.find(([name]) => name === PAUSED_CLUSTER_NAME)?.[1]
      );
    await browser.connectWithConnectionString(pausedClusterConnectionString, {
      connectionStatus: 'failure',
    });

    await browser.clickVisible(
      browser.$(Selectors.ConnectionToastErrorDebugButton)
    );

    const chatMessages = browser.$(Selectors.AssistantChatMessages);
    await chatMessages.waitForDisplayed();

    const connectToAtlasButton = chatMessages.$('button=Connect to Atlas');
    await connectToAtlasButton.waitForDisplayed({ timeout: 60_000 });

    await browser.signInToAtlasDesktop({
      username,
      password,
      triggerSignIn: () => browser.clickVisible(connectToAtlasButton),
      waitForSignedIn: () => isSignedIn(browser),
    });

    await browser.waitUntil(
      async () => {
        const text = await chatMessages.getText();
        return text.includes('PAUSED');
      },
      {
        timeout: 60_000,
        timeoutMsg:
          'Expected the connection error debugger result to report the cluster as PAUSED',
      }
    );
  });

  it('reports ip access not allowed', async function () {
    const connectionString = await getClusterConnectionStringsFromNames(
      session!,
      [NETWORK_ACCESS_CLUSTER_NAME],
      username,
      password,
      NETWORK_ACCESS_PROJECT_ID
    ).then(
      (connectionStrings) =>
        connectionStrings.find(
          ([name]) => name === NETWORK_ACCESS_CLUSTER_NAME
        )?.[1]
    );
    await browser.connectWithConnectionString(connectionString, {
      connectionStatus: 'failure',
    });

    await browser.clickVisible(
      browser.$(Selectors.ConnectionToastErrorDebugButton)
    );

    const chatMessages = browser.$(Selectors.AssistantChatMessages);
    await chatMessages.waitForDisplayed();

    const connectToAtlasButton = chatMessages.$('button=Connect to Atlas');
    await connectToAtlasButton.waitForDisplayed({ timeout: 60_000 });

    await browser.signInToAtlasDesktop({
      username,
      password,
      triggerSignIn: () => browser.clickVisible(connectToAtlasButton),
      waitForSignedIn: () => isSignedIn(browser),
    });

    await browser.waitUntil(
      async () => {
        const text = await chatMessages.getText();
        return text.includes('Client IP Not Allowed');
      },
      {
        timeout: 60_000,
        timeoutMsg:
          'Expected the connection error debugger result to report the client IP as "Client IP Not Allowed"',
      }
    );
  });
});
