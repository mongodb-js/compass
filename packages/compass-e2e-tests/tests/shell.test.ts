import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

describe('Shell', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  before(async function () {
    telemetry = await startTelemetryServer();
    compass = await beforeTests();
    browser = compass.browser;
  });

  beforeEach(async function () {
    await browser.connectWithConnectionString('mongodb://localhost:27091/test');
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
    await telemetry.stop();
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('has an info modal', async function () {
    await browser.showShell();
    await browser.clickVisible(Selectors.ShellInfoButton);

    const infoModalElement = await browser.$(Selectors.ShellInfoModal);
    await infoModalElement.waitForDisplayed();

    await browser.screenshot('shell-info-modal.png');

    await browser.clickVisible(Selectors.ShellInfoModalCloseButton);
    await infoModalElement.waitForDisplayed({ reverse: true });

    await browser.hideShell();
  });
});
