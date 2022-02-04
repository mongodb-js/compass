import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';

describe('Shell', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;
  let screenshot: string | undefined;

  before(async function () {
    screenshot = 'shell-before';
    telemetry = await startTelemetryServer();
    compass = await beforeTests();
    browser = compass.browser;

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');
    screenshot = undefined;
  });

  after(async function () {
    await afterTests(compass, screenshot);
    await telemetry.stop();
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('can be opened, collapsed and resized');
  it('supports running commands');
});
