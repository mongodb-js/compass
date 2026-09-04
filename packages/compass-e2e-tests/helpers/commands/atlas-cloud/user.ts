import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { randomBytes } from 'crypto';
import lodash from 'lodash';
import type { CompassBrowser } from '../../compass-browser.ts';
import {
  ATLAS_CLOUD_TEST_UTILS,
  getCloudUrlsForEnvironment,
  RUN_ID,
} from '../../test-runner-context.ts';
import type { AtlasEnvironment } from '../../test-runner-context.ts';
import { FIXTURES_PATH } from '../../test-runner-paths.ts';
import { isAtlasCloudPage, doCloudFetch } from './utils.ts';
import { createExternalBrowser } from '../../compass.ts';
import { waitForLeafygreenEnabled } from '../leafygreen.ts';

const { template } = lodash;

export async function fillAtlasLoginForm(
  browser: CompassBrowser,
  username: string,
  password: string,
  waitForAuthenticated: () => Promise<boolean>
) {
  await waitForLeafygreenEnabled(browser, 'input[name="username"]');
  await browser.$('input[name="username"]').setValue(username);

  await waitForLeafygreenEnabled(browser, 'button=Next');
  await browser.$('button=Next').click();

  await browser.$('input[name="password"]').waitForEnabled();
  await browser.$('input[name="password"]').setValue(password);

  await waitForLeafygreenEnabled(browser, 'button=Login');
  await browser.$('button=Login').click();

  let authenticated = false;

  const clickWhenDisplayed = (selector: string) =>
    browser.waitUntil(
      async () => {
        if (authenticated) {
          return true;
        }
        const button = browser.$(selector);
        if (await button.isDisplayed().catch(() => false)) {
          await button.click().catch(() => {});
        }
        return authenticated;
      },
      { interval: 500 }
    );

  const [, , authenticationPromiseSettled] = await Promise.allSettled([
    // bypass MFA
    clickWhenDisplayed('button*=Remind me later'),
    // authorize Compass screen
    clickWhenDisplayed('button=Authorize'),
    browser.waitUntil(
      async () => {
        return (authenticated = await waitForAuthenticated());
      },
      { interval: 500 }
    ),
  ]);

  if (authenticationPromiseSettled.status === 'rejected') {
    throw authenticationPromiseSettled.reason;
  }
}

export async function signInToAtlas(
  browser: CompassBrowser,
  username: string,
  password: string,
  env: AtlasEnvironment
) {
  const { accountUrl, cloudUrl } = getCloudUrlsForEnvironment(env);

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
    env,
    triggerSignIn,
    waitForSignedIn,
  }: {
    username: string;
    password: string;
    env: AtlasEnvironment;
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

  let loginSessionBrowser: CompassBrowser | undefined;

  try {
    loginSessionBrowser = await createExternalBrowser(false);

    await triggerSignIn();

    const authUrl = await browser.waitUntil(
      async () => {
        return await fs.readFile(authUrlFile, 'utf8').catch(() => '');
      },
      {
        timeoutMsg: 'Timed out waiting for the OIDC auth URL to be captured',
      }
    );

    const { accountUrl } = getCloudUrlsForEnvironment(env);
    await loginSessionBrowser.navigateTo(
      `${accountUrl}/account/login?signedOut=true`
    );

    // eslint-disable-next-line no-console
    console.log('[atlas-debug] accountUrl', {
      accountUrl,
    });
    await doCloudFetch(
      loginSessionBrowser,
      ATLAS_CLOUD_TEST_UTILS.bypassEncouragement,
      { method: 'PATCH' },
      { form: { username } }
    );
    await doCloudFetch(
      loginSessionBrowser,
      ATLAS_CLOUD_TEST_UTILS.verifyEmail,
      { method: 'POST' },
      { form: { username } }
    );

    await loginSessionBrowser.url(authUrl);

    await fillAtlasLoginForm(
      loginSessionBrowser,
      username,
      password,
      waitForSignedIn
    );
  } finally {
    await loginSessionBrowser?.deleteSession().catch(() => {});
    await browser
      .setFeature('browserCommandForOIDCAuth', undefined)
      .catch(() => {});
    await fs.rm(authUrlFile, { force: true }).catch(() => {});
  }
}

export async function createAtlasUser(
  browser: CompassBrowser,
  username: string,
  password: string,
  env: AtlasEnvironment
) {
  const { accountUrl } = getCloudUrlsForEnvironment(env);

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
  await signInToAtlas(browser, username, password, env);

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

function assertAtlasCloudTestUtils() {
  if (!ATLAS_CLOUD_TEST_UTILS) {
    throw new Error(
      'Atlas Cloud test utils config is not provided. Make sure that the ATLAS_CLOUD_TEST_UTILS env variable is available'
    );
  }
}

export async function createAtlasLoginUser(
  session: CompassBrowser,
  env: AtlasEnvironment,
  {
    existingOrgId,
  }: {
    existingOrgId?: string;
  } = {}
): Promise<{
  username: string;
  password: string;
  orgId: string;
  projectId: string;
}> {
  assertAtlasCloudTestUtils();

  const username = template(ATLAS_CLOUD_TEST_UTILS.testUserUsernameTemplate)({
    username: `compass-usr-${RUN_ID}`,
  });
  const password = randomBytes(20).toString('hex');

  const { orgId, projectId } = await createAtlasUser(
    session,
    username,
    password,
    env
  );

  if (existingOrgId) {
    if (!ATLAS_CLOUD_TEST_UTILS.addOrgUser) {
      throw new Error(
        `addOrgUser missing at runtime. Keys present: ${Object.keys(
          ATLAS_CLOUD_TEST_UTILS
        ).join(', ')}`
      );
    }
    await doCloudFetch(
      session,
      template(ATLAS_CLOUD_TEST_UTILS.addOrgUser)({ orgId: existingOrgId }),
      { method: 'POST' },
      { json: { username, roles: ['ORG_OWNER'] } }
    );
  }

  return {
    username,
    password,
    orgId,
    projectId,
  };
}

export async function deleteAtlasUser(
  _browser: CompassBrowser,
  username: string,
  env: AtlasEnvironment
) {
  const { cloudUrl } = getCloudUrlsForEnvironment(env);
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
