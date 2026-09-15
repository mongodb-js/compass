import { expect } from 'chai';
import type { CompassBrowser } from '../../helpers/compass-browser.ts';
import { init, screenshotPathName } from '../../helpers/compass.ts';
import type { Compass } from '../../helpers/compass.ts';
import * as Selectors from '../../helpers/selectors.ts';
import {
  assertTestingDesktopWithAtlasCloud,
  context,
  getAtlasCloudEnvironmentFromContext,
} from '../../helpers/test-runner-context.ts';

export const PROVISIONING_TIMEOUT = 35 * 60_000;

function getAtlasServiceBackendPreset() {
  const env = getAtlasCloudEnvironmentFromContext();
  return env === 'prod' ? 'atlas' : `atlas-${env}`;
}

export async function initCompassWithDebugger(
  testTitle: string | undefined
): Promise<Compass> {
  const backendPreset = getAtlasServiceBackendPreset();
  const compass = await init(testTitle, {
    extraSpawnArgs: [
      // Windows transforms --atlasServiceBackendPreset to
      // --atlasservicebackendpreset, which then fails the test
      // as the env is not loaded properly. In order to avoid this,
      // we need to use kebab-case when passing arguments to Windows
      process.platform === 'win32'
        ? `--atlas-service-backend-preset=${backendPreset}`
        : `--atlasServiceBackendPreset=${backendPreset}`,
    ],
  });
  const { browser } = compass;

  try {
    expect(await browser.getFeature('atlasServiceBackendPreset')).to.equal(
      backendPreset
    );

    await browser.setFeature('enableAtlasSignIn', true);
    await browser.setFeature('enableAtlasConnectionErrorDebuggerTool', true);
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

  return compass;
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

/**
 * Connects (and fails), opens the debugger from the error toast, signs in to
 * Atlas and waits for the debugger's response to include the expected text
 */
export async function expectDebuggerToReport(
  browser: CompassBrowser,
  connectionString: string,
  expectedText: string
) {
  assertTestingDesktopWithAtlasCloud(context);

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
    username: context.atlasCloudUsername,
    password: context.atlasCloudPassword,
    env: getAtlasCloudEnvironmentFromContext(),
    triggerSignIn: () => browser.clickVisible(connectToAtlasButton),
    waitForSignedIn: () => isSignedIn(browser),
  });

  await browser.waitUntil(
    async () => {
      return (await chatMessages.getText()).includes(expectedText);
    },
    { timeout: 2 * 60_000 }
  );
}
