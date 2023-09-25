import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import type { OIDCMockProviderConfig } from '@mongodb-js/oidc-mock-provider';
import { OIDCMockProvider } from '@mongodb-js/oidc-mock-provider';
import path from 'path';
import { expect } from 'chai';
import { promisify } from 'util';
import { createNumbersCollection } from '../helpers/insert-data';

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
  let originalDisableKeychainUsage: string | undefined;
  let getTokenPayload: OIDCMockProviderConfig['getTokenPayload'];

  before(async function () {
    originalDisableKeychainUsage =
      process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE;

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
      async overrideRequestHandler(_url, req, res) {
        const url = new URL(_url);
        const end = promisify(res.end.bind(res));

        switch (url.pathname) {
          case '/auth-portal-redirect':
            res.statusCode = 307;
            res.setHeader('Location', url.searchParams.get('fromURI') ?? '');
            await end();
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
              await end();
            } else {
              res.statusCode = 401;
              await end();
            }
            break;
          case '/v1/introspect':
            res.statusCode = 200;
            res.write(JSON.stringify({ active: isAuthorised(req) }));
            await end();
            break;
        }
      },
    });

    process.env.COMPASS_CLIENT_ID_OVERRIDE = 'testServer';
    process.env.COMPASS_OIDC_ISSUER_OVERRIDE = oidcMockProvider.issuer;
    process.env.COMPASS_ATLAS_AUTH_PORTAL_URL_OVERRIDE = `${oidcMockProvider.issuer}/auth-portal-redirect`;
    // To prevent oidc-plugin state from persisting
    process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE = 'true';
  });

  beforeEach(async function () {
    getTokenPayload = () => {
      return DEFAULT_TOKEN_PAYLOAD;
    };

    compass = await beforeTests();
    browser = compass.browser;
    await browser.setFeature(
      'browserCommandForOIDCAuth',
      getTestBrowserShellCommand()
    );
    await browser.setFeature('enableAIWithoutRolloutAccess', true);
  });

  afterEach(async function () {
    await browser.setFeature('browserCommandForOIDCAuth', undefined);
    await browser.setFeature('enableAIWithoutRolloutAccess', false);
    await afterTest(compass, this.currentTest);
    await afterTests(compass, this.currentTest);
  });

  after(async function () {
    await oidcMockProvider?.close();
    delete process.env.COMPASS_CLIENT_ID_OVERRIDE;
    delete process.env.COMPASS_OIDC_ISSUER_OVERRIDE;
    delete process.env.COMPASS_ATLAS_AUTH_PORTAL_URL_OVERRIDE;
    process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE =
      originalDisableKeychainUsage;
  });

  describe('in settings', function () {
    it('should sign in user when clicking on "Log in with Atlas" button', async function () {
      await browser.openSettingsModal('Feature Preview');
      const logInButton = browser.$('button=Log in with Atlas');
      await logInButton.waitForClickable();
      await logInButton.click();

      const loginStatus = browser.$('[data-testid="atlas-login-status"]');
      await browser.waitUntil(async () => {
        return (
          (await loginStatus.getText()).trim() ===
          'Logged in with Atlas account test@example.com'
        );
      });
    });

    it('should allow to accept TOS when signed in', async function () {
      await browser.openSettingsModal('Feature Preview');
      const logInButton = browser.$('button=Log in with Atlas');
      await logInButton.waitForClickable();
      await logInButton.click();

      const loginStatus = browser.$('[data-testid="atlas-login-status"]');
      await browser.waitUntil(async () => {
        return (
          (await loginStatus.getText()).trim() ===
          'Logged in with Atlas account test@example.com'
        );
      });

      const acceptTOSToggle = browser.$('button#use-ai-toggle');

      expect(await acceptTOSToggle.getAttribute('aria-checked')).to.eq('false');

      await acceptTOSToggle.waitForClickable();
      await acceptTOSToggle.click();

      const agreeAndContinueButton = browser.$('button=Agree and continue');

      await agreeAndContinueButton.waitForClickable();
      await agreeAndContinueButton.click();

      expect(await acceptTOSToggle.getAttribute('aria-checked')).to.eq('true');
    });

    it('should sign out user when "Disconnect" clicked', async function () {
      await browser.openSettingsModal('Feature Preview');
      const logInButton = browser.$('button=Log in with Atlas');
      await logInButton.waitForClickable();
      await logInButton.click();

      const loginStatus = browser.$('[data-testid="atlas-login-status"]');

      await browser.waitUntil(async () => {
        return (
          (await loginStatus.getText()).trim() ===
          'Logged in with Atlas account test@example.com'
        );
      });

      const disconnectButton = browser.$('button=Disconnect');
      await disconnectButton.waitForClickable();
      await disconnectButton.click();

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
      const logInButton = browser.$('button=Log in with Atlas');
      await logInButton.waitForClickable();
      await logInButton.click();

      const errorToast = browser.$('#atlas-sign-in-error');

      expect(await errorToast.getText()).to.match(
        /Sign in failed\n\nAuth failed/
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
      const generateQueryButton = browser.$('button*=Generate query');
      await generateQueryButton.waitForClickable();
      await generateQueryButton.click();

      const logInButton = browser.$('button*=Log in to Atlas');
      await logInButton.waitForClickable();
      await logInButton.click();

      const agreeAndContinueButton = browser.$('button=Agree and continue');
      await agreeAndContinueButton.waitForClickable();
      await agreeAndContinueButton.click();

      // If the flow failed, we will not see the input
      const aiInput = browser.$('[data-testid="ai-user-text-input"]');
      await aiInput.waitForDisplayed();
    });

    it('should not show AI input if sign in flow was not finished', async function () {
      getTokenPayload = () => {
        return new Promise(() => {});
      };

      const generateQueryButton = browser.$('button*=Generate query');
      await generateQueryButton.waitForClickable();
      await generateQueryButton.click();

      const logInButton = browser.$('button*=Log in to Atlas');
      await logInButton.waitForClickable();
      await logInButton.click();

      // Because leafygreen doesn't render a button there and we don't have any
      // control over it
      const cancelButton = browser.$('span=Not now');
      await cancelButton.waitForClickable();
      await cancelButton.click();

      const aiInput = browser.$('[data-testid="ai-user-text-input"]');
      expect(await aiInput.isExisting()).to.eq(false);
      expect(await generateQueryButton.isDisplayed()).to.eq(true);
    });

    it('should not show AI input if declined TOS', async function () {
      const generateQueryButton = browser.$('button*=Generate query');
      await generateQueryButton.waitForClickable();
      await generateQueryButton.click();

      const logInButton = browser.$('button*=Log in to Atlas');
      await logInButton.waitForClickable();
      await logInButton.click();

      const cancelButton = browser.$('button=Cancel');
      await cancelButton.waitForClickable();
      await cancelButton.click();

      const aiInput = browser.$('[data-testid="ai-user-text-input"]');
      expect(await aiInput.isExisting()).to.eq(false);
      expect(await generateQueryButton.isDisplayed()).to.eq(true);
    });

    it('should hide AI input if declined TOS after sign in', async function () {
      const generateQueryButton = browser.$('button*=Generate query');
      await generateQueryButton.waitForClickable();
      await generateQueryButton.click();

      const logInButton = browser.$('button*=Log in to Atlas');
      await logInButton.waitForClickable();
      await logInButton.click();

      const agreeAndContinueButton = browser.$('button=Agree and continue');
      await agreeAndContinueButton.waitForClickable();
      await agreeAndContinueButton.click();

      await browser.openSettingsModal('Feature Preview');

      const acceptTOSToggle = browser.$('button#use-ai-toggle');
      await acceptTOSToggle.waitForClickable();
      await acceptTOSToggle.click();

      expect(await acceptTOSToggle.getAttribute('aria-checked')).to.eq('false');

      await browser.closeSettingsModal();

      const aiInput = browser.$('[data-testid="ai-user-text-input"]');
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
      await generateQueryButton.waitForClickable();
      await generateQueryButton.click();

      const logInButton = browser.$('button*=Log in to Atlas');
      await logInButton.waitForClickable();
      await logInButton.click();

      const agreeAndContinueButton = browser.$('button=Agree and continue');
      await agreeAndContinueButton.waitForClickable();
      await agreeAndContinueButton.click();

      // If the flow failed, we will not see the input
      const aiInput = browser.$('[data-testid="ai-user-text-input"]');
      await aiInput.waitForDisplayed();
    });

    it('should not show AI input if sign in flow was not finished', async function () {
      getTokenPayload = () => {
        return new Promise(() => {});
      };

      const generateQueryButton = browser.$('button*=Generate aggregation');
      await generateQueryButton.waitForClickable();
      await generateQueryButton.click();

      const logInButton = browser.$('button*=Log in to Atlas');
      await logInButton.waitForClickable();
      await logInButton.click();

      // Because leafygreen doesn't render a button there and we don't have any
      // control over it
      const cancelButton = browser.$('span=Not now');
      await cancelButton.waitForClickable();
      await cancelButton.click();

      const aiInput = browser.$('[data-testid="ai-user-text-input"]');
      expect(await aiInput.isExisting()).to.eq(false);
      expect(await generateQueryButton.isDisplayed()).to.eq(true);
    });

    it('should not show AI input if declined TOS', async function () {
      const generateQueryButton = browser.$('button*=Generate aggregation');
      await generateQueryButton.waitForClickable();
      await generateQueryButton.click();

      const logInButton = browser.$('button*=Log in to Atlas');
      await logInButton.waitForClickable();
      await logInButton.click();

      const cancelButton = browser.$('button=Cancel');
      await cancelButton.waitForClickable();
      await cancelButton.click();

      const aiInput = browser.$('[data-testid="ai-user-text-input"]');
      expect(await aiInput.isExisting()).to.eq(false);
      expect(await generateQueryButton.isDisplayed()).to.eq(true);
    });

    it('should hide AI input if declined TOS after sign in', async function () {
      const generateQueryButton = browser.$('button*=Generate aggregation');
      await generateQueryButton.waitForClickable();
      await generateQueryButton.click();

      const logInButton = browser.$('button*=Log in to Atlas');
      await logInButton.waitForClickable();
      await logInButton.click();

      const agreeAndContinueButton = browser.$('button=Agree and continue');
      await agreeAndContinueButton.waitForClickable();
      await agreeAndContinueButton.click();

      await browser.openSettingsModal('Feature Preview');

      const acceptTOSToggle = browser.$('button#use-ai-toggle');
      await acceptTOSToggle.waitForClickable();
      await acceptTOSToggle.click();

      expect(await acceptTOSToggle.getAttribute('aria-checked')).to.eq('false');

      await browser.closeSettingsModal();

      const aiInput = browser.$('[data-testid="ai-user-text-input"]');
      expect(await aiInput.isExisting()).to.eq(false);
      expect(await generateQueryButton.isDisplayed()).to.eq(true);
    });
  });
});
