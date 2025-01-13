import { expect } from 'chai';
import {
  init,
  cleanup,
  //screenshotIfFailed,
  Selectors,
} from '../helpers/compass';

import type { Package } from '../installers/types';

export async function testAutoUpdateFrom(pkg: Package) {
  // install the app
  console.log(`installing ${pkg.packageFilepath}`);
  const { appPath, uninstall } = await pkg.installer({
    appName: pkg.appName,
    filepath: pkg.packageFilepath,
  });

  console.log(appPath);

  process.env.COMPASS_APP_NAME = pkg.appName;
  process.env.COMPASS_APP_PATH = appPath;

  try {
    // TODO: start the autoupdate server
    try {
      // run the app and wait for it to auto-update
      const compass = await init('auto-update from', { firstRun: true });
      const { browser } = compass;

      await browser.$(Selectors.AutoUpdateToast).waitForDisplayed();

      if (pkg.updatable) {
        await browser.$(Selectors.AutoUpdateRestartButton).waitForDisplayed();
      } else {
        // When auto-update is not supported the toast contains a link to down
        const linkElement = browser.$(Selectors.AutoUpdateDownloadLink);
        await browser.$(linkElement).waitForDisplayed();
        expect(await linkElement.getAttribute('href')).to.equal(
          'https://www.mongodb.com/try/download/compass'
        );
      }

      await cleanup(compass);

      if (pkg.updatable) {
        // run the app again and check that the version changed
        const compass = await init('auto-update from restart', {
          firstRun: false,
        });
        const { browser } = compass;
        await browser.$(Selectors.AutoUpdateToast).waitForDisplayed();
        await browser
          .$(Selectors.AutoUpdateReleaseNotesLink)
          .waitForDisplayed();
      }
    } finally {
      // TODO: stop the autoupdate server
    }
  } finally {
    delete process.env.COMPASS_APP_NAME;
    delete process.env.COMPASS_APP_PATH;

    // remove the app
    await uninstall();
  }
}
