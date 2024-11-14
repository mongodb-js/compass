import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import clipboard from 'clipboardy';
import { expect } from 'chai';
import * as Selectors from '../helpers/selectors';
import type { ConnectFormState } from '../helpers/connect-form-state';
import { context } from '../helpers/test-runner-context';

async function expectCopyConnectionStringToClipboard(
  browser: CompassBrowser,
  favoriteName: string,
  expected: string
): Promise<void> {
  const Sidebar = Selectors.Multiple;
  if (!context.disableClipboardUsage) {
    await browser.selectConnectionMenuItem(
      favoriteName,
      Sidebar.CopyConnectionStringItem
    );
    let actual = '';
    await browser.waitUntil(
      async () => {
        actual = await clipboard.read();
        console.log({ actual, expected });
        return actual === expected;
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
    skipForWeb(
      this,
      'connection form is not used meaningfully outside of the local dev sandbox environment'
    );

    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setFeature('protectConnectionStrings', false);
  });

  after(async function () {
    if (compass) {
      await browser.setFeature('protectConnectionStrings', false);
      await cleanup(compass);
    }
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
    await browser.saveFavorite(favoriteName, 'Yellow');
    await browser.selectConnection(favoriteName);

    expect(await browser.getConnectFormConnectionString()).to.equal(
      'mongodb://foo:*****@localhost:12345/'
    );

    // Enter edit connection string mode
    await browser.clickConfirmationAction(Selectors.EditConnectionStringToggle);

    expect(
      await browser.getConnectFormConnectionString(),
      'hide password when input is not focused'
    ).to.equal('mongodb://foo:*****@localhost:12345/');
    expect(
      await browser.getConnectFormConnectionString(true),
      'shows password when input is focused'
    ).to.equal('mongodb://foo:bar@localhost:12345/');

    await browser.clickVisible(Selectors.ConnectionModalCloseButton);

    await expectCopyConnectionStringToClipboard(
      browser,
      favoriteName,
      'mongodb://foo:bar@localhost:12345/'
    );

    await browser.selectConnection(favoriteName);

    await browser.setFeature('protectConnectionStrings', true);

    expect(await browser.getConnectFormConnectionString()).to.equal(
      'mongodb://foo:*****@localhost:12345/'
    );

    await browser.clickVisible(Selectors.ConnectionModalCloseButton);

    await expectCopyConnectionStringToClipboard(
      browser,
      favoriteName,
      'mongodb://<credentials>@localhost:12345/'
    );
  });
});
