import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { expect } from 'chai';

describe('Shell', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  before(async function () {
    telemetry = await startTelemetryServer();
    compass = await beforeTests();
    browser = compass.browser;
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
    await telemetry.stop();
  });

  afterEach(async function () {
    await browser.setFeature('enableShell', true);
    await afterTest(compass, this.currentTest);
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

    let shellSection = await browser.$(Selectors.ShellSection);
    let isShellSectionExisting = await shellSection.isExisting();
    expect(isShellSectionExisting).to.be.equal(true);

    await browser.openSettingsModal();
    const settingsModal = await browser.$(Selectors.SettingsModal);
    await settingsModal.waitForDisplayed();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('enableShell'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await settingsModal.waitForDisplayed({ reverse: true });

    shellSection = await browser.$(Selectors.ShellSection);
    isShellSectionExisting = await shellSection.isExisting();
    expect(isShellSectionExisting).to.be.equal(false);
  });
});
