import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer, Telemetry } from '../helpers/telemetry';
import {
  beforeTests,
  afterTests,
  afterTest,
  Compass,
} from '../helpers/compass';

describe('Schell', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  before(async function () {
    telemetry = await startTelemetryServer();
    compass = await beforeTests();
    browser = compass.browser;

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');
  });

  after(async function () {
    await afterTests(compass);
    await telemetry.stop();
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('can be opened, collapsed and resized');
  it('supports running commands');
});
