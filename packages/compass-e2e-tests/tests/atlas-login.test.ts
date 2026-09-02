import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser.ts';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
} from '../helpers/compass.ts';
import type { Compass } from '../helpers/compass.ts';

function hasAtlasCloudCredentials(): boolean {
  const missingKeys = [
    'E2E_TESTS_ATLAS_CLOUD_USERNAME',
    'E2E_TESTS_ATLAS_CLOUD_PASSWORD',
  ].filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    if (process.env.ci || process.env.CI) {
      throw new Error(
        `Missing required environmental variable(s): ${missingKeys.join(', ')}`
      );
    }
    return false;
  }

  return true;
}

async function startSignIn(browser: CompassBrowser): Promise<void> {
  await browser.execute(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    await require('electron').ipcRenderer.invoke('AtlasService.signIn', {});
  });
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

describe('Atlas sign in', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    skipForWeb(this, 'atlas sign in is only relevant to the desktop app');

    if (!hasAtlasCloudCredentials()) {
      return this.skip();
    }

    compass = await init(this.test?.fullTitle(), {
      extraSpawnArgs: ['--atlasServiceBackendPreset=atlas-qa'],
    });
    browser = compass.browser;

    await browser.setFeature('enableAtlasSignIn', true);
    await browser.setFeature('enableAtlasConnectionErrorDebugger', true);
  });

  after(async function () {
    if (compass) {
      await cleanup(compass);
    }
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('signs in to Atlas Cloud using the OIDC flow', async function () {
    expect(await isSignedIn(browser)).to.equal(false);

    await browser.signInToAtlasDesktop({
      username: process.env.E2E_TESTS_ATLAS_CLOUD_USERNAME as string,
      password: process.env.E2E_TESTS_ATLAS_CLOUD_PASSWORD as string,
      triggerSignIn: () => startSignIn(browser),
      waitForSignedIn: () => isSignedIn(browser),
    });

    expect(await isSignedIn(browser)).to.equal(true);
  });
});
