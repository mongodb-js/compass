import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  Selectors,
  TEST_COMPASS_WEB,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import type { OIDCMockProviderConfig } from '@mongodb-js/oidc-mock-provider';
import { OIDCMockProvider } from '@mongodb-js/oidc-mock-provider';
import path from 'path';
import { expect } from 'chai';
import { createNumbersCollection } from '../helpers/insert-data';
import { AcceptTOSToggle } from '../helpers/selectors';
import { startMockAtlasServiceServer } from '../helpers/atlas-service';
import type { Telemetry } from '../helpers/telemetry';
import { startTelemetryServer } from '../helpers/telemetry';

const DEFAULT_TOKEN_PAYLOAD = {
  expires_in: 3600,
  payload: {
    groups: ['testgroup'],
    sub: 'testuser',
    aud: 'resource-server-audience-value',
  },
};

function getTestBrowserShellCommand() {
  return `${process.execPath} ${path.resolve(
    __dirname,
    '..',
    'fixtures',
    'curl.js'
  )}`;
}

describe('Atlas Login', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let oidcMockProvider: OIDCMockProvider;
  let getTokenPayload: OIDCMockProviderConfig['getTokenPayload'];
  let stopMockAtlasServer: () => Promise<void>;

  before(async function () {
    if (TEST_COMPASS_WEB) {
      this.skip();
    }
    // Start a mock server to pass an ai response.
    const { endpoint, stop } = await startMockAtlasServiceServer();
    stopMockAtlasServer = stop;
    process.env.COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE = endpoint;

    function isAuthorised(req: { headers: { authorization?: string } }) {
      const [, token] = req.headers.authorization?.split(' ') ?? [];
      // We can't check that the issued token is the one received by oidc-plugin
      // so we are only checking that it was passed and assuming that it's good
      // enough of a validation
      return !!token;
    }

    oidcMockProvider = await OIDCMockProvider.create({
      getTokenPayload(metadata) {
        return getTokenPayload(metadata);
      },
      overrideRequestHandler(_url, req, res) {
        const url = new URL(_url);

        switch (url.pathname) {
          case '/auth-portal-redirect':
            res.statusCode = 307;
            res.setHeader('Location', url.searchParams.get('fromURI') ?? '');
            res.end();
            break;
          case '/v1/userinfo':
            if (isAuthorised(req)) {
              res.statusCode = 200;
              res.write(
                JSON.stringify({
                  sub: Date.now().toString(32),
                  firstName: 'First',
                  lastName: 'Last',
                  primaryEmail: 'test@example.com',
                  login: 'test@example.com',
                })
              );
              res.end();
            } else {
              res.statusCode = 401;
              res.end();
            }
            break;
          case '/v1/introspect':
            res.statusCode = 200;
            res.write(JSON.stringify({ active: isAuthorised(req) }));
            res.end();
            break;
        }
      },
    });

    process.env.COMPASS_CLIENT_ID_OVERRIDE = 'testServer';
    process.env.COMPASS_OIDC_ISSUER_OVERRIDE = oidcMockProvider.issuer;
    process.env.COMPASS_ATLAS_AUTH_PORTAL_URL_OVERRIDE = `${oidcMockProvider.issuer}/auth-portal-redirect`;
  });

  beforeEach(async function () {
    getTokenPayload = () => {
      return DEFAULT_TOKEN_PAYLOAD;
    };

    compass = await init(this.test?.fullTitle(), {
      // With this flag enabled, we are not persisting the data between tests
      firstRun: true,
    });
    browser = compass.browser;
    await browser.setFeature(
      'browserCommandForOIDCAuth',
      getTestBrowserShellCommand()
    );
  });

  afterEach(async function () {
    await browser.setFeature('browserCommandForOIDCAuth', undefined);
    await screenshotIfFailed(compass, this.currentTest);
    await cleanup(compass);
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await oidcMockProvider?.close();
    delete process.env.COMPASS_CLIENT_ID_OVERRIDE;
    delete process.env.COMPASS_OIDC_ISSUER_OVERRIDE;
    delete process.env.COMPASS_ATLAS_AUTH_PORTAL_URL_OVERRIDE;

    await stopMockAtlasServer();
    delete process.env.COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE;
  });

  describe('in settings', function () {
    it('should sign in user when clicking on "Log in with Atlas" button', async function () {
      await browser.openSettingsModal('Feature Preview');

      await browser.clickVisible(Selectors.LogInWithAtlasButton);

      const loginStatus = browser.$(Selectors.AtlasLoginStatus);
      await browser.waitUntil(async () => {
        return (
          (await loginStatus.getText()).trim() ===
          'Logged in with Atlas account test@example.com'
        );
      });
    });

    describe('telemetry', () => {
      let telemetry: Telemetry;

      before(async function () {
        telemetry = await startTelemetryServer();
      });

      after(async function () {
        await telemetry.stop();
      });

      it('should send identify after the user has logged in', async function () {
        const atlasUserIdBefore = await browser.getFeature(
          'telemetryAtlasUserId'
        );
        expect(atlasUserIdBefore).to.not.exist;

        await browser.openSettingsModal('Feature Preview');

        await browser.clickVisible(Selectors.LogInWithAtlasButton);

        const loginStatus = browser.$(Selectors.AtlasLoginStatus);
        await browser.waitUntil(async () => {
          return (
            (await loginStatus.getText()).trim() ===
            'Logged in with Atlas account test@example.com'
          );
        });

        const atlasUserIdAfter = await browser.getFeature(
          'telemetryAtlasUserId'
        );
        expect(atlasUserIdAfter).to.be.a('string');

        const identify = telemetry
          .events()
          .find((entry) => entry.type === 'identify');
        expect(identify.traits.platform).to.equal(process.platform);
        expect(identify.traits.arch).to.match(/^(x64|arm64)$/);
      });
    });

    it('should allow to accept TOS when signed in', async function () {
      await browser.openSettingsModal('Feature Preview');

      await browser.clickVisible(Selectors.LogInWithAtlasButton);

      const loginStatus = browser.$(Selectors.AtlasLoginStatus);
      await browser.waitUntil(async () => {
        return (
          (await loginStatus.getText()).trim() ===
          'Logged in with Atlas account test@example.com'
        );
      });

      const acceptTOSToggle = browser.$(Selectors.AcceptTOSToggle);

      expect(await acceptTOSToggle.getAttribute('aria-checked')).to.eq(
        'false',
        'Expected TOS toggle to be unchecked'
      );

      await browser.clickVisible(acceptTOSToggle);

      await browser.clickVisible(Selectors.AgreeAndContinueButton);

      // We are not just waiting here, this is asserting that toggle was
      // switched on, indicating that TOS was accepted
      await browser.waitUntil(
        async () => {
          return (
            (await acceptTOSToggle.getAttribute('aria-checked')) === 'true'
          );
        },
        { timeoutMsg: 'Expected TOS toggle to be checked' }
      );
    });

    it('should sign out user when "Disconnect" clicked', async function () {
      await browser.openSettingsModal('Feature Preview');
      await browser.clickVisible(Selectors.LogInWithAtlasButton);

      const loginStatus = browser.$(Selectors.AtlasLoginStatus);

      await browser.waitUntil(async () => {
        return (
          (await loginStatus.getText()).trim() ===
          'Logged in with Atlas account test@example.com'
        );
      });

      await browser.clickVisible(Selectors.DisconnectAtlasAccountButton);

      await browser.waitUntil(async () => {
        return (
          (await loginStatus.getText()).trim() ===
          'You must first connect your Atlas account to use this feature.'
        );
      });
    });

    it('should show toast with error if sign in failed', async function () {
      getTokenPayload = () => {
        return Promise.reject(new Error('Auth failed'));
      };

      await browser.openSettingsModal('Feature Preview');
      await browser.clickVisible(Selectors.LogInWithAtlasButton);

      const errorToast = browser.$(Selectors.AtlasLoginErrorToast);
      await errorToast.waitForDisplayed();

      expect(await errorToast.getText()).to.match(
        /Sign in failed\n+Auth failed/
      );
    });
  });

  describe('in CRUD view', function () {
    beforeEach(async function () {
      await createNumbersCollection();
      await browser.connectWithConnectionString();
      await browser.navigateToCollectionTab('test', 'numbers', 'Documents');
    });

    it('should allow to sign in and accept TOS when clicking AI CTA', async function () {
      await browser.clickVisible('button*=Generate query');

      await browser.clickVisible(Selectors.LogInWithAtlasModalButton);

      await browser.clickVisible(Selectors.AgreeAndContinueButton);

      // If the flow failed, we will not see the input
      const aiInput = browser.$(Selectors.QueryBarAITextInput);
      await aiInput.waitForDisplayed();
    });

    it('should not show AI input if sign in flow was not finished', async function () {
      getTokenPayload = () => {
        return new Promise(() => {});
      };

      const generateQueryButton = browser.$('button*=Generate query');
      await browser.clickVisible(generateQueryButton);

      await browser.clickVisible(Selectors.LogInWithAtlasModalButton);

      // Because leafygreen doesn't render a button there and we don't have any
      // control over it
      await browser.clickVisible('span=Not now');

      const aiInput = browser.$(Selectors.QueryBarAITextInput);
      expect(await aiInput.isExisting()).to.eq(false);
      expect(await generateQueryButton.isDisplayed()).to.eq(true);
    });

    it('should not show AI input if declined TOS', async function () {
      const generateQueryButton = browser.$('button*=Generate query');
      await browser.clickVisible(generateQueryButton);

      await browser.clickVisible(Selectors.LogInWithAtlasModalButton);

      await browser.clickVisible('button=Cancel');

      const aiInput = browser.$(Selectors.QueryBarAITextInput);
      expect(await aiInput.isExisting()).to.eq(false);
      expect(await generateQueryButton.isDisplayed()).to.eq(true);
    });

    it('should hide AI input if declined TOS after sign in', async function () {
      const generateQueryButton = browser.$('button*=Generate query');
      await browser.clickVisible(generateQueryButton);

      await browser.clickVisible(Selectors.LogInWithAtlasModalButton);

      await browser.clickVisible(Selectors.AgreeAndContinueButton);

      await browser.openSettingsModal('Feature Preview');

      const acceptTOSToggle = browser.$(Selectors.AcceptTOSToggle);
      await browser.clickVisible(AcceptTOSToggle);

      expect(await acceptTOSToggle.getAttribute('aria-checked')).to.eq('false');

      await browser.closeSettingsModal();

      const aiInput = browser.$(Selectors.QueryBarAITextInput);
      expect(await aiInput.isExisting()).to.eq(false);
      expect(await generateQueryButton.isDisplayed()).to.eq(true);
    });
  });

  describe('in Aggregation Builder view', function () {
    beforeEach(async function () {
      await createNumbersCollection();
      await browser.connectWithConnectionString();
      await browser.navigateToCollectionTab('test', 'numbers', 'Aggregations');
    });

    it('should allow to sign in and accept TOS when clicking AI CTA', async function () {
      const generateQueryButton = browser.$('button*=Generate aggregation');
      await browser.clickVisible(generateQueryButton);

      await browser.clickVisible(Selectors.LogInWithAtlasModalButton);

      await browser.clickVisible(Selectors.AgreeAndContinueButton);

      // If the flow failed, we will not see the input
      const aiInput = browser.$(Selectors.QueryBarAITextInput);
      await aiInput.waitForDisplayed();
    });

    it('should not show AI input if sign in flow was not finished', async function () {
      getTokenPayload = () => {
        return new Promise(() => {});
      };

      const generateQueryButton = browser.$('button*=Generate aggregation');
      await browser.clickVisible(generateQueryButton);

      await browser.clickVisible(Selectors.LogInWithAtlasModalButton);

      // Because leafygreen doesn't render a button there and we don't have any
      // control over it
      await browser.clickVisible('span=Not now');

      const aiInput = browser.$(Selectors.QueryBarAITextInput);
      expect(await aiInput.isExisting()).to.eq(false);
      expect(await generateQueryButton.isDisplayed()).to.eq(true);
    });

    it('should not show AI input if declined TOS', async function () {
      const generateQueryButton = browser.$('button*=Generate aggregation');
      await browser.clickVisible(generateQueryButton);

      await browser.clickVisible(Selectors.LogInWithAtlasModalButton);

      await browser.clickVisible('button=Cancel');

      const aiInput = browser.$(Selectors.QueryBarAITextInput);
      expect(await aiInput.isExisting()).to.eq(false);
      expect(await generateQueryButton.isDisplayed()).to.eq(true);
    });

    it('should hide AI input if declined TOS after sign in', async function () {
      const generateQueryButton = browser.$('button*=Generate aggregation');
      await browser.clickVisible(generateQueryButton);

      await browser.clickVisible(Selectors.LogInWithAtlasModalButton);

      await browser.clickVisible(Selectors.AgreeAndContinueButton);

      await browser.openSettingsModal('Feature Preview');

      const acceptTOSToggle = browser.$(Selectors.AcceptTOSToggle);
      await browser.clickVisible(acceptTOSToggle);

      expect(await acceptTOSToggle.getAttribute('aria-checked')).to.eq('false');

      await browser.closeSettingsModal();

      const aiInput = browser.$(Selectors.QueryBarAITextInput);
      expect(await aiInput.isExisting()).to.eq(false);
      expect(await generateQueryButton.isDisplayed()).to.eq(true);
    });
  });
});
