import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser.ts';
import { createAtlasLoginUser } from '../helpers/commands/atlas-cloud/user.ts';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
} from '../helpers/compass.ts';
import type { Compass } from '../helpers/compass.ts';
import {
  context,
  ATLAS_CLOUD_TEST_UTILS,
} from '../helpers/test-runner-context.ts';

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

async function startSignIn(browser: CompassBrowser): Promise<void> {
  await browser.execute(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    void require('electron').ipcRenderer.invoke('AtlasService.signIn', {});
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
  let username: string;
  let password: string;
  let deleteAtlasUser: () => Promise<void>;

  before(async function () {
    skipForWeb(this, 'atlas sign in is only relevant to the desktop app');

    if (!hasAtlasCloudTestUtils()) {
      return this.skip();
    }

    // Driving the Atlas login page (form + consent + redirects against a real
    // Atlas environment) can take longer than the oidc-plugin's default 10s
    // "open browser" timeout.
    process.env.COMPASS_OIDC_OPEN_BROWSER_TIMEOUT_OVERRIDE = String(60_000);

    compass = await init(this.test?.fullTitle(), {
      extraSpawnArgs: [
        `--atlasServiceBackendPreset=${getAtlasBackendPresetForEnvironment()}`,
      ],
    });

    browser = compass.browser;
    ({
      username,
      password,
      cleanup: deleteAtlasUser,
    } = await createAtlasLoginUser());

    await browser.setFeature('enableAtlasSignIn', true);
    await browser.setFeature('enableAtlasConnectionErrorDebugger', true);
  });

  after(async function () {
    if (compass) {
      await cleanup(compass);
    }
    await deleteAtlasUser?.();
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('signs in to Atlas Cloud using the OIDC flow', async function () {
    expect(await isSignedIn(browser)).to.equal(false);

    await browser.signInToAtlasDesktop({
      username,
      password,
      triggerSignIn: () => startSignIn(browser),
      waitForSignedIn: () => isSignedIn(browser),
    });

    expect(await isSignedIn(browser)).to.equal(true);
  });
});
