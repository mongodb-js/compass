import { expect } from 'chai';
import {
  init,
  cleanup,
  Selectors,
  screenshotPathName,
} from '../helpers/compass';

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('Auto-update', function () {
  it('auto-update from', async function () {
    if (process.env.TEST_NAME !== 'auto-update-from') {
      // we don't want this test to execute along with all the others under
      // normal circumstances because it is destructive - it overwrites Compass
      // itself
      this.skip();
    }

    // run the app and wait for it to auto-update
    console.log('starting compass the first time');
    const compass = await init('auto-update from', { firstRun: true });
    const { browser } = compass;
    try {
      await browser.$(Selectors.AutoUpdateToast).waitForDisplayed();

      if (process.env.AUTO_UPDATE_UPDATABLE === 'true') {
        const restartButton = browser.$(Selectors.AutoUpdateRestartButton);
        await restartButton.waitForDisplayed();

        // We could click the restart button to apply the update and restart the
        // app, but restarting the app confuses webdriverio or at least our test
        // helpers. So we're going to just restart the app manually.
        await browser.pause(1000);
      } else {
        // When auto-update is not supported the toast contains a link to
        // download
        const linkElement = browser.$(Selectors.AutoUpdateDownloadLink);
        await linkElement.waitForDisplayed();
        expect(await linkElement.getAttribute('href')).to.equal(
          'https://www.mongodb.com/try/download/compass?utm_source=compass&utm_medium=product'
        );
      }
    } finally {
      await browser.screenshot(screenshotPathName('auto-update-from'));
      await cleanup(compass);
    }

    if (process.env.AUTO_UPDATE_UPDATABLE === 'true') {
      console.log(
        'pause to make sure the app properly exited before starting again'
      );
      await wait(10_000);

      console.log('starting compass a second time');
      // run the app again and check that the version changed
      const compass = await init('auto-update from restart', {
        firstRun: false,
      });
      const { browser } = compass;
      try {
        await browser.$(Selectors.AutoUpdateToast).waitForDisplayed();
        await browser
          .$(Selectors.AutoUpdateReleaseNotesLink)
          .waitForDisplayed();
      } finally {
        await browser.screenshot(
          screenshotPathName('auto-update-from-restart')
        );
        await cleanup(compass);
      }
    }
  });
});
