import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
  connectionNameFromString,
  DEFAULT_CONNECTION_STRING,
  TEST_MULTIPLE_CONNECTIONS,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

describe('Instance performance tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    skipForWeb(this, 'performance tab not yet available in compass-web');

    // TODO: this requires being able to click the View performance metrics menu
    // item. active connections and saved connections are separate lists and
    // right now we only have browser.selectConnectionMenuItem() which
    // arbitrarily works with saved connections only.
    if (TEST_MULTIPLE_CONNECTIONS) {
      this.skip();
    }

    compass = await init(this.test?.fullTitle());
    browser = compass.browser;

    await browser.connectWithConnectionString();
    await browser.navigateToConnectionTab(
      connectionNameFromString(DEFAULT_CONNECTION_STRING),
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
    const stats = await browser.$(Selectors.ServerStats);
    await stats.waitForDisplayed();
  });
});
