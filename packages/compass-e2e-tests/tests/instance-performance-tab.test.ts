import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  TEST_COMPASS_WEB,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

describe('Instance performance tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    if (TEST_COMPASS_WEB) {
      this.skip();
    }
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;

    await browser.connectWithConnectionString();
    await browser.navigateToInstanceTab('Performance');
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }
    await cleanup(compass);
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('loads up without issue', async function () {
    const stats = await browser.$(Selectors.ServerStats);
    await stats.waitForDisplayed();
  });
});
