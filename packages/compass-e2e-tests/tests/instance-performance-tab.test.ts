import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

describe('Instance performance tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    skipForWeb(this, 'performance tab not yet available in compass-web');

    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();

    await browser.disconnectAll();
    await browser.connectToDefaults();
    await browser.navigateToConnectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'Performance'
    );
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
    const stats = browser.$(Selectors.ServerStats);
    await stats.waitForDisplayed();
  });
});
