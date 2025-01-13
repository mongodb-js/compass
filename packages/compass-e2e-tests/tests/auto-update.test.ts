import { expect } from 'chai';
import {
  init,
  cleanup,
  //screenshotIfFailed,
  Selectors,
} from '../helpers/compass';

describe('Auto-update', function () {
  it('auto-update from', async function () {
    if (!process.env.AUTO_UPDATE_FROM) {
      // we don't want this test to execute along with all the others under
      // normal circumstances because it is destructive - it overwrites Compass
      // itself
      this.skip();
    }

    // run the app and wait for it to auto-update
    const compass = await init('auto-update from', { firstRun: true });
    try {
      const { browser } = compass;

      await browser.$(Selectors.AutoUpdateToast).waitForDisplayed();

      if (process.env.AUTO_UPDATE_UPDATABLE === 'true') {
        const restartButton = browser.$(Selectors.AutoUpdateRestartButton);
        await restartButton.waitForDisplayed();

        // We could click the restart button to apply the update and restart the
        // app, but restarting the app confuses webdriverio or at least our test
        // helpers. So we're going to just restart the app manually.
      } else {
        // When auto-update is not supported the toast contains a link to
        // download
        const linkElement = browser.$(Selectors.AutoUpdateDownloadLink);
        await linkElement.waitForDisplayed();
        expect(await linkElement.getAttribute('href')).to.equal(
          'https://www.mongodb.com/try/download/compass'
        );
      }
    } finally {
      await cleanup(compass);
    }

    if (process.env.AUTO_UPDATE_UPDATABLE === 'true') {
      // run the app again and check that the version changed
      const compass = await init('auto-update from restart', {
        firstRun: false,
      });
      try {
        const { browser } = compass;
        await browser.$(Selectors.AutoUpdateToast).waitForDisplayed();
        await browser
          .$(Selectors.AutoUpdateReleaseNotesLink)
          .waitForDisplayed();
      } finally {
        await cleanup(compass);
      }
    }
  });

  it('auto-update to', function () {
    if (!process.env.AUTO_UPDATE_TO) {
      // we don't want this test to execute along with all the others under
      // normal circumstances because it is destructive - it overwrites Compass
      // itself
      this.skip();
    }

    // TODO
  });
});
