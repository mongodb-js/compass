import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
  TEST_MULTIPLE_CONNECTIONS,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import clipboard from 'clipboardy';
import { expect } from 'chai';
import * as Selectors from '../helpers/selectors';
import type { ConnectFormState } from '../helpers/connect-form-state';

async function expectCopyConnectionStringToClipboard(
  browser: CompassBrowser,
  favoriteName: string,
  expected: string
): Promise<void> {
  if (process.env.COMPASS_E2E_DISABLE_CLIPBOARD_USAGE !== 'true') {
    await browser.selectConnectionMenuItem(
      favoriteName,
      Selectors.CopyConnectionStringItem
    );
    let actual = '';
    await browser.waitUntil(
      async () => {
        return (actual = await clipboard.read()) === expected;
      },
      {
        timeoutMsg: `Expected copy to clipboard to contain '${expected}', saw '${actual}'`,
      }
    );
  }
}

/**
 * @securityTest Connection String Credential Protection Tests
 *
 * Compass provides a user- or administrator-configurable setting that prevents the application
 * from displaying credentials to avoid accidental leakage. Our tests verify that features
 * which expose connection information honor this setting.
 */
describe('protectConnectionStrings', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    skipForWeb(this, 'connection form not available in compass-web');

    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setFeature('protectConnectionStrings', false);
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await browser.setFeature('protectConnectionStrings', false);
    await cleanup(compass);
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('hides connection string credentials from users', async function () {
    const favoriteName = 'protected fave';
    const state: ConnectFormState = {
      hosts: ['localhost:12345'],
      authMethod: 'DEFAULT',
      defaultUsername: 'foo',
      defaultPassword: 'bar',
    };
    await browser.setConnectFormState(state);
    await browser.saveFavorite(
      favoriteName,
      TEST_MULTIPLE_CONNECTIONS ? 'Yellow' : 'color4'
    );
    await browser.selectFavorite(favoriteName);

    console.log('XXX checking connection string');

    expect(await browser.getConnectFormConnectionString()).to.equal(
      'mongodb://foo:*****@localhost:12345/'
    );

    console.log('XXX Enter edit connection string mode');

    // Enter edit connection string mode
    await browser.clickVisible(Selectors.EditConnectionStringToggle);
    const confirmModal = await browser.$(Selectors.ConfirmationModal);
    await confirmModal.waitForDisplayed();
    await browser.clickVisible(Selectors.ConfirmationModalConfirmButton());

    console.log('XXX checking connection string (unprotected)');
    expect(
      await browser.getConnectFormConnectionString(),
      'hide password when input is not focused'
    ).to.equal('mongodb://foo:*****@localhost:12345/');
    expect(
      await browser.getConnectFormConnectionString(true),
      'shows password when input is focused'
    ).to.equal('mongodb://foo:bar@localhost:12345/');

    if (TEST_MULTIPLE_CONNECTIONS) {
      await browser.clickVisible(Selectors.ConnectionnModalCloseButton);
    }

    await expectCopyConnectionStringToClipboard(
      browser,
      favoriteName,
      'mongodb://foo:bar@localhost:12345/'
    );

    if (TEST_MULTIPLE_CONNECTIONS) {
      await browser.selectFavorite(favoriteName);
    }

    /*
    console.log(`XXX wait for ${Selectors.EditConnectionStringToggle} to go away`);
    await browser
      .$(Selectors.EditConnectionStringToggle)
      .waitForExist({ reverse: false });

    console.log(`XXX wait for ${Selectors.ShowConnectionFormButton} to go away`);
    await browser
      .$(Selectors.ShowConnectionFormButton)
      .waitForExist({ reverse: false });
    */

    console.log('XXX turn on protectConnectionStrings');
    await browser.setFeature('protectConnectionStrings', true);

    console.log('XXX checking connection string (protected)');
    expect(await browser.getConnectFormConnectionString()).to.equal(
      'mongodb://foo:*****@localhost:12345/'
    );

    if (TEST_MULTIPLE_CONNECTIONS) {
      await browser.clickVisible(Selectors.ConnectionnModalCloseButton);
    }

    await expectCopyConnectionStringToClipboard(
      browser,
      favoriteName,
      'mongodb://<credentials>@localhost:12345/'
    );

    /*
    console.log(`XXX wait for ${Selectors.EditConnectionStringToggle} to go away`);
    await browser
      .$(Selectors.EditConnectionStringToggle)
      .waitForExist({ reverse: true });

    console.log(`XXX wait for ${Selectors.ShowConnectionFormButton} to go away`);
    await browser
      .$(Selectors.ShowConnectionFormButton)
      .waitForExist({ reverse: true });
    */
  });
});
