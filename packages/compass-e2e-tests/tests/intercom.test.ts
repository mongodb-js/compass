import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';

describe('Intercom integration', function () {
  let compass: Compass;

  before(async function () {
    skipForWeb(this, 'not available in compass-web yet');

    compass = await init(this.test?.fullTitle());
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    // clean up if it failed during the before hook
    await cleanup(compass);
  });

  it('should load Intercom script', async function () {
    const isIntercomAvailable = await compass.browser.execute(() => {
      return !!process.env.HADRON_METRICS_INTERCOM_APP_ID;
    });

    // Skip the test if conditions for setting up intercom are not met (they
    // should always be in CI, this is to make sure this test doesn't fail
    // locally)
    if (!isIntercomAvailable && !(process.env.ci || process.env.CI)) {
      this.skip();
    }

    await compass.browser.waitUntil(
      () => {
        return compass.browser.execute(() => {
          return typeof (window as any).Intercom === 'function';
        });
      },
      {
        timeoutMsg:
          'Expected Intercom SDK to load and be available in the global scope',
      }
    );
  });
});
