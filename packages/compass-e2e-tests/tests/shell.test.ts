import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
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
    await browser.setupDefaultConnections();
  });

  beforeEach(async function () {
    await browser.disconnectAll();
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
    await browser.connectToDefaults();

    await browser.openShell(DEFAULT_CONNECTION_NAME_1);
    await browser.clickVisible(Selectors.ShellInfoButton);

    const infoModalElement = browser.$(Selectors.ShellInfoModal);
    await infoModalElement.waitForDisplayed();

    await browser.clickVisible(Selectors.ShellInfoModalCloseButton);
    await infoModalElement.waitForDisplayed({ reverse: true });

    await browser.closeShell(DEFAULT_CONNECTION_NAME_1);
  });

  it('shows and hides shell based on settings', async function () {
    await browser.connectToDefaults();

    expect(
      await browser.hasConnectionMenuItem(
        DEFAULT_CONNECTION_NAME_1,
        Selectors.Multiple.OpenShellItem
      )
    ).to.be.equal(true);

    await browser.openSettingsModal();
    const settingsModal = browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('enableShell'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    expect(
      await browser.hasConnectionMenuItem(
        DEFAULT_CONNECTION_NAME_1,
        Selectors.Multiple.OpenShellItem
      )
    ).to.be.equal(false);
  });
});
