import type { CompassBrowser } from '../helpers/compass-browser';
import {
  beforeTests,
  afterTests,
  afterTest,
  Compass,
} from '../helpers/compass';

describe('Instance performance tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');
  });

  after(async function () {
    await afterTests(compass);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('can kill slow queries via the performance tab');
});
