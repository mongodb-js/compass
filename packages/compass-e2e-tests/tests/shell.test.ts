import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
  TEST_MULTIPLE_CONNECTIONS,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

describe('Shell', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  before(async function () {
    skipForWeb(this, 'shell not available on compass-web');

    // TODO(COMPASS-8004): best to just port this once the shell works with multiple connections
    if (TEST_MULTIPLE_CONNECTIONS) {
      this.skip();
    }

    telemetry = await startTelemetryServer();
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    if (TEST_MULTIPLE_CONNECTIONS) {
      return;
    }

    await cleanup(compass);
    await telemetry.stop();
  });

  afterEach(async function () {
    await browser.setFeature('enableShell', true);
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('has an info modal', async function () {
    await browser.connectWithConnectionString();

    await browser.showShell();
    await browser.clickVisible(Selectors.ShellInfoButton);

    const infoModalElement = await browser.$(Selectors.ShellInfoModal);
    await infoModalElement.waitForDisplayed();

    await browser.clickVisible(Selectors.ShellInfoModalCloseButton);
    await infoModalElement.waitForDisplayed({ reverse: true });

    await browser.hideShell();
  });

  it('shows and hides shell based on settings', async function () {
    await browser.connectWithConnectionString();

    // Will fail if shell is not on the screen eventually
    await browser.$(Selectors.ShellSection).waitForExist();

    await browser.openSettingsModal();
    const settingsModal = await browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('enableShell'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    // Will fail if shell eventually doesn't go away from the screen
    await browser.$(Selectors.ShellSection).waitForExist({ reverse: true });
  });
});
