import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
  DEFAULT_CONNECTION_NAME,
  TEST_MULTIPLE_CONNECTIONS,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import chai from 'chai';
const { expect } = chai;

describe('Shell', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  before(async function () {
    skipForWeb(this, 'shell not available on compass-web');

    telemetry = await startTelemetryServer();
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setFeature('enableShell', true);
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
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

    await browser.openShell(DEFAULT_CONNECTION_NAME);
    await browser.clickVisible(Selectors.ShellInfoButton);

    const infoModalElement = await browser.$(Selectors.ShellInfoModal);
    await infoModalElement.waitForDisplayed();

    await browser.clickVisible(Selectors.ShellInfoModalCloseButton);
    await infoModalElement.waitForDisplayed({ reverse: true });

    await browser.closeShell(DEFAULT_CONNECTION_NAME);
  });

  it('shows and hides shell based on settings', async function () {
    await browser.connectWithConnectionString();

    if (TEST_MULTIPLE_CONNECTIONS) {
      expect(
        await browser.hasConnectionMenuItem(
          DEFAULT_CONNECTION_NAME,
          Selectors.Multiple.OpenShellItem
        )
      ).to.be.equal(true);
    } else {
      // Will fail if shell is not on the screen eventually
      await browser.$(Selectors.ShellSection).waitForExist();
    }

    await browser.openSettingsModal();
    const settingsModal = await browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('enableShell'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    if (TEST_MULTIPLE_CONNECTIONS) {
      expect(
        await browser.hasConnectionMenuItem(
          DEFAULT_CONNECTION_NAME,
          Selectors.Multiple.OpenShellItem
        )
      ).to.be.equal(false);
    } else {
      // Will fail if shell eventually doesn't go away from the screen
      await browser.$(Selectors.ShellSection).waitForExist({ reverse: true });
    }
  });
});
