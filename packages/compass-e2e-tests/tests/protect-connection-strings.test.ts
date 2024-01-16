import type { CompassBrowser } from '../helpers/compass-browser';
import { init, cleanup, screenshotIfFailed } from '../helpers/compass';
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

describe('protectConnectionStrings', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setFeature('protectConnectionStrings', false);
  });

  after(async function () {
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
    await browser.saveFavorite(favoriteName, 'color4');
    await browser.selectFavorite(favoriteName);

    expect(await browser.getConnectFormConnectionString()).to.equal(
      'mongodb://foo:*****@localhost:12345/'
    );

    // Enter edit connection string mode
    await browser.clickVisible(Selectors.EditConnectionStringToggle);
    const confirmModal = await browser.$(Selectors.ConfirmationModal);
    await confirmModal.waitForDisplayed();
    await browser.clickVisible(Selectors.ConfirmationModalConfirmButton());

    expect(
      await browser.getConnectFormConnectionString(),
      'hide password when input is not focused'
    ).to.equal('mongodb://foo:*****@localhost:12345/');
    expect(
      await browser.getConnectFormConnectionString(true),
      'shows password when input is focused'
    ).to.equal('mongodb://foo:bar@localhost:12345/');
    await expectCopyConnectionStringToClipboard(
      browser,
      favoriteName,
      'mongodb://foo:bar@localhost:12345/'
    );
    await browser
      .$(Selectors.EditConnectionStringToggle)
      .waitForExist({ reverse: false });
    await browser
      .$(Selectors.ShowConnectionFormButton)
      .waitForExist({ reverse: false });

    await browser.setFeature('protectConnectionStrings', true);

    expect(await browser.getConnectFormConnectionString()).to.equal(
      'mongodb://foo:*****@localhost:12345/'
    );
    await expectCopyConnectionStringToClipboard(
      browser,
      favoriteName,
      'mongodb://<credentials>@localhost:12345/'
    );
    await browser
      .$(Selectors.EditConnectionStringToggle)
      .waitForExist({ reverse: true });
    await browser
      .$(Selectors.ShowConnectionFormButton)
      .waitForExist({ reverse: true });
  });
});
