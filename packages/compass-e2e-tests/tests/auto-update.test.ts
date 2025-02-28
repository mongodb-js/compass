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
  for (const testName of ['auto-update-from', 'auto-update-to']) {
    it(testName, async function () {
      if (process.env.TEST_NAME !== testName) {
        // we don't want this test to execute along with all the others under
        // normal circumstances because it is destructive - it overwrites Compass
        // itself
        this.skip();
      }

      // run the app and wait for it to auto-update
      console.log('starting compass the first time');
      const compass = await init(testName, { firstRun: true });
      const { browser } = compass;
      try {
        await browser.$(Selectors.AutoUpdateToast).waitForDisplayed();

        if (process.env.AUTO_UPDATE_UPDATABLE === 'true') {
          const restartButton = browser.$(Selectors.AutoUpdateRestartButton);
          // 2 minutes is apparently not always enough for downloading the
          // windows update on GHA. Has to be shorter than the mocha test
          // timeout so this can fail before the test does.
          await restartButton.waitForDisplayed({ timeout: 240_000 });

          if (process.env.EXPECTED_UPDATE_VERSION) {
            expect(
              await browser.$(Selectors.AutoUpdateToast).getText()
            ).to.contain(
              `Compass is ready to update to ${process.env.EXPECTED_UPDATE_VERSION}!`
            );
          }

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

          if (process.env.EXPECTED_UPDATE_VERSION) {
            expect(
              await browser.$(Selectors.AutoUpdateToast).getText()
            ).to.contain(
              `Compass ${process.env.EXPECTED_UPDATE_VERSION} is available`
            );
          }
        }
      } finally {
        await browser.screenshot(screenshotPathName(testName));
        await cleanup(compass);
      }

      if (process.env.AUTO_UPDATE_UPDATABLE === 'true') {
        console.log(
          'pause to make sure the app properly exited before starting again'
        );
        await wait(60_000);

        console.log('starting compass a second time');
        // run the app again and check that the version changed
        const compass = await init(`${testName} restart`, {
          firstRun: false,
        });
        const { browser } = compass;
        try {
          await browser.$(Selectors.AutoUpdateToast).waitForDisplayed();
          const releaseNotesLink = browser.$(
            Selectors.AutoUpdateReleaseNotesLink
          );
          await releaseNotesLink.waitForDisplayed();
          // for now we only know the new version in the auto-update-to case
          if (process.env.EXPECTED_UPDATE_VERSION) {
            expect(
              await browser.$(Selectors.AutoUpdateToast).getText()
            ).to.contain(
              `Compass ${process.env.EXPECTED_UPDATE_VERSION} installed successfully`
            );
            expect(await releaseNotesLink.getAttribute('href')).to.equal(
              `https://github.com/mongodb-js/compass/releases/tag/v${process.env.EXPECTED_UPDATE_VERSION}`
            );
          }
        } finally {
          await browser.screenshot(screenshotPathName(`${testName}-restart`));
          await cleanup(compass);
        }
      }
    });
  }
});
