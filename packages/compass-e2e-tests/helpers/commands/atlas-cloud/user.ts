import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { remote } from 'webdriverio';
import lodash from 'lodash';
import type { CompassBrowser } from '../../compass-browser.ts';
import {
  ATLAS_CLOUD_TEST_UTILS,
  context,
  getCloudUrlsFromContext,
} from '../../test-runner-context.ts';
import {
  FIXTURES_PATH,
  MONOREPO_ELECTRON_CHROMIUM_VERSION,
} from '../../test-runner-paths.ts';
import { isAtlasCloudPage, doCloudFetch } from './utils.ts';

const { template } = lodash;

export async function fillAtlasLoginForm(
  session: WebdriverIO.Browser,
  username: string,
  password: string,
  waitForAuthenticated: () => Promise<boolean>
) {
  const waitForLeafygreenEnabled = async (selector: string) => {
    await session.waitUntil(async () => {
      const el = session.$(selector);
      return (
        (await el.getAttribute('aria-disabled')) !== 'true' &&
        (await el.isEnabled())
      );
    });
  };

  await waitForLeafygreenEnabled('input[name="username"]');
  await session.$('input[name="username"]').setValue(username);

  await waitForLeafygreenEnabled('button=Next');
  await session.$('button=Next').click();

  await session.$('input[name="password"]').waitForEnabled();
  await session.$('input[name="password"]').setValue(password);

  await waitForLeafygreenEnabled('button=Login');
  await session.$('button=Login').click();

  let authenticated = false;

  const [, authenticationPromiseSettled] = await Promise.allSettled([
    (async () => {
      const remindMeLaterButton = 'button*=Remind me later';

      await session.waitUntil(
        async () => {
          return (
            authenticated ||
            (await session.$(remindMeLaterButton).isDisplayed())
          );
        },
        { interval: 2000 }
      );

      if (authenticated) {
        return;
      }

      await session.$(remindMeLaterButton).click();
    })(),
    session.waitUntil(
      async () => {
        return (authenticated = await waitForAuthenticated());
      },
      { interval: 2000 }
    ),
  ]);

  if (authenticationPromiseSettled.status === 'rejected') {
    throw authenticationPromiseSettled.reason;
  }
}

export async function signInToAtlas(
  browser: CompassBrowser,
  username: string,
  password: string
) {
  const { accountUrl, cloudUrl } = getCloudUrlsFromContext();

  await browser.navigateTo(`${accountUrl}/account/login?signedOut=true`);

  /**
   * Before proceeding, make sure that email is verified and mfa encouragement
   * is not shown. We are doing this before every login, because these values
   * can reset between sessions
   */
  await doCloudFetch(
    browser,
    ATLAS_CLOUD_TEST_UTILS.bypassEncouragement,
    { method: 'PATCH' },
    { form: { username } }
  );

  await doCloudFetch(
    browser,
    ATLAS_CLOUD_TEST_UTILS.verifyEmail,
    { method: 'POST' },
    { form: { username } }
  );

  // We don't check the exact project id, just want to make sure we are in the
  // logged in part of atlas cloud
  await fillAtlasLoginForm(browser, username, password, () =>
    isAtlasCloudPage(browser, cloudUrl)
  );

  // Make sure that user has required roles before proceeding (those are not
  // persistent)
  await doCloudFetch(
    browser,
    ATLAS_CLOUD_TEST_UTILS.addRoles,
    { method: 'POST' },
    { json: ATLAS_CLOUD_TEST_UTILS.testUserRoles }
  );
}

function getCaptureOidcUrlCommand() {
  return `${process.execPath} ${path.resolve(
    FIXTURES_PATH,
    'capture-oidc-url.js'
  )}`;
}

export async function signInToAtlasDesktop(
  browser: CompassBrowser,
  {
    username,
    password,
    triggerSignIn,
    waitForSignedIn,
  }: {
    username: string;
    password: string;
    triggerSignIn: () => Promise<void>;
    waitForSignedIn: () => Promise<boolean>;
  }
) {
  const authUrlFile = path.join(
    os.tmpdir(),
    `compass-oidc-auth-url-${Date.now().toString(32)}`
  );
  await fs.rm(authUrlFile, { force: true });

  // The capture fixture writes the auth URL to this file instead of opening it
  // in the system browser.
  await browser.setEnv('OIDC_AUTH_URL_FILE', authUrlFile);
  await browser.setFeature(
    'browserCommandForOIDCAuth',
    getCaptureOidcUrlCommand()
  );

  let loginSession: WebdriverIO.Browser | undefined;

  try {
    void triggerSignIn();

    const authUrl = await browser.waitUntil(
      async () => {
        return await fs.readFile(authUrlFile, 'utf8').catch(() => '');
      },
      {
        timeoutMsg: 'Timed out waiting for the OIDC auth URL to be captured',
      }
    );

    loginSession = await remote({
      capabilities: {
        browserName: 'chrome',
        browserVersion: MONOREPO_ELECTRON_CHROMIUM_VERSION,
        'wdio:enforceWebDriverClassic': true,
      },
      waitforTimeout: context.webdriverWaitforTimeout,
      waitforInterval: context.webdriverWaitforInterval,
    });

    await loginSession.url(authUrl);

    await fillAtlasLoginForm(loginSession, username, password, waitForSignedIn);
  } finally {
    await loginSession?.deleteSession().catch(() => {
      // Ignore errors closing the login session, we don't want them to mask a
      // real test failure.
    });
    await browser.setFeature('browserCommandForOIDCAuth', undefined);
    await fs.rm(authUrlFile, { force: true });
  }
}

export async function createAtlasUser(
  browser: CompassBrowser,
  username: string,
  password: string
) {
  const { accountUrl } = getCloudUrlsFromContext();

  await browser.navigateTo(`${accountUrl}/account/login?signedOut=true`);

  await doCloudFetch(
    browser,
    ATLAS_CLOUD_TEST_UTILS.registerUser,
    { method: 'POST' },
    {
      json: {
        username,
        password,
        firstName: 'Test',
        lastName: 'User',
        company: 'Compass E2E Test Suite',
      },
    }
  );

  // Sign in before proceeding: this will apply some extra configuration steps
  // and is required to run some further operations in the flow
  await signInToAtlas(browser, username, password);

  const { orgId, groupId } = await doCloudFetch(
    browser,
    ATLAS_CLOUD_TEST_UTILS.getCurrentGroup
  );

  // Adding payment method is not directly related to setting up a new user, but
  // it's easier to do it here once while creating one
  await doCloudFetch(
    browser,
    template(ATLAS_CLOUD_TEST_UTILS.addPaymentMethod)({ orgId }),
    { method: 'POST' }
  );

  return { orgId, projectId: groupId };
}

export async function deleteAtlasUser(
  _browser: CompassBrowser,
  username: string
) {
  const { cloudUrl } = getCloudUrlsFromContext();
  // Using fetch directly so that we can clean-up even after tests are done
  await fetch(
    new URL(
      template(ATLAS_CLOUD_TEST_UTILS.deleteUser)({
        username,
      }),
      cloudUrl
    ),
    { method: 'DELETE' }
  );
}
