import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  Selectors,
  skipForWeb,
  TEST_COMPASS_WEB,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import type { OIDCMockProviderConfig } from '@mongodb-js/oidc-mock-provider';
import { OIDCMockProvider } from '@mongodb-js/oidc-mock-provider';
import path from 'path';
import { expect } from 'chai';
import { createNumbersCollection } from '../helpers/insert-data';
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
  let numberOfOIDCAuthRequests = 0;

  before(async function () {
    skipForWeb(this, 'atlas-login not supported in compass-web');

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
          case '/authorize':
            numberOfOIDCAuthRequests += 1;
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
    numberOfOIDCAuthRequests = 0;

    getTokenPayload = () => {
      return DEFAULT_TOKEN_PAYLOAD;
    };

    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setFeature(
      'browserCommandForOIDCAuth',
      getTestBrowserShellCommand()
    );
    await browser.setupDefaultConnections();
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
      await browser.openSettingsModal('ai');

      await browser.clickVisible(Selectors.LogInWithAtlasButton);

      const loginStatus = browser.$(Selectors.AtlasLoginStatus);
      await browser.waitUntil(async () => {
        return (
          (await loginStatus.getText()).trim() ===
          'Logged in with Atlas account test@example.com'
        );
      });
      expect(numberOfOIDCAuthRequests).to.eq(1);
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

        await browser.openSettingsModal('ai');

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

    it('should sign out user when "Disconnect" clicked', async function () {
      await browser.openSettingsModal('ai');
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
        return (await loginStatus.getText()).includes(
          'This is a feature powered by generative AI, and may give inaccurate responses'
        );
      });
    });

    it('should sign in user when disconnected and clicking again on "Log in with Atlas" button', async function () {
      await browser.openSettingsModal('ai');
      await browser.clickVisible(Selectors.LogInWithAtlasButton);

      let loginStatus = browser.$(Selectors.AtlasLoginStatus);

      await browser.waitUntil(async () => {
        return (
          (await loginStatus.getText()).trim() ===
          'Logged in with Atlas account test@example.com'
        );
      });

      await browser.clickVisible(Selectors.DisconnectAtlasAccountButton);

      await browser.clickVisible(Selectors.LogInWithAtlasButton);

      loginStatus = browser.$(Selectors.AtlasLoginStatus);
      await browser.waitUntil(async () => {
        return (
          (await loginStatus.getText()).trim() ===
          'Logged in with Atlas account test@example.com'
        );
      });
      expect(numberOfOIDCAuthRequests).to.eq(2);
    });

    it('should show toast with error if sign in failed', async function () {
      getTokenPayload = () => {
        return Promise.reject(new Error('Auth failed'));
      };

      await browser.openSettingsModal('ai');
      await browser.clickVisible(Selectors.LogInWithAtlasButton);

      const errorToast = browser.$(Selectors.AtlasLoginErrorToast);
      await errorToast.waitForDisplayed();

      expect(await errorToast.getText()).to.match(
        /Sign in failed\n+unexpected HTTP response status code.+Auth failed/
      );
    });
  });

  describe('in CRUD view', function () {
    beforeEach(async function () {
      await createNumbersCollection();
      await browser.disconnectAll();
      await browser.connectToDefaults();
      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME_1,
        'test',
        'numbers',
        'Documents'
      );
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

      const aiInput = browser.$(Selectors.GenAITextInput);
      expect(await aiInput.isExisting()).to.eq(false);
      expect(await generateQueryButton.isDisplayed()).to.eq(true);
    });
  });

  describe('in Aggregation Builder view', function () {
    beforeEach(async function () {
      await createNumbersCollection();
      await browser.disconnectAll();
      await browser.connectToDefaults();
      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME_1,
        'test',
        'numbers',
        'Aggregations'
      );
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

      const aiInput = browser.$(Selectors.GenAITextInput);
      expect(await aiInput.isExisting()).to.eq(false);
      expect(await generateQueryButton.isDisplayed()).to.eq(true);
    });
  });
});
