import { template } from 'lodash';
import type { CompassBrowser } from '../../compass-browser';
import {
  ATLAS_CLOUD_TEST_UTILS,
  getCloudUrlsFromContext,
} from '../../test-runner-context';
import { isAtlasCloudPage, doCloudFetch } from './utils';

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

  await browser.waitForLeafygreenEnabled('input[name="username"]');
  await browser.$('input[name="username"]').setValue(username);

  await browser.waitForLeafygreenEnabled('button=Next');
  await browser.$('button=Next').click();

  await browser.$('input[name="password"]').waitForEnabled();
  await browser.$('input[name="password"]').setValue(password);

  await browser.waitForLeafygreenEnabled('button=Login');
  await browser.$('button=Login').click();

  let authenticated = false;

  // Atlas Cloud will periodically remind user to enable MFA even if
  // encouragement is bypassed, so to account for that, in parallel to waiting
  // for auth to finish, we'll wait for the MFA screen to show up and skip it if
  // it appears
  const [, authenticationPromiseSettled] = await Promise.allSettled([
    (async () => {
      // TODO: figure out why the endpoint call doesn't make this reminder page
      // disappear
      const remindMeLaterButton = 'button*=Remind me later';

      await browser.waitUntil(
        async () => {
          return (
            authenticated ||
            (await browser.$(remindMeLaterButton).isDisplayed())
          );
        },
        // Takes awhile for the redirect to land on this reminder page when it
        // happens, so no need to bombard the browser with displayed checks
        { interval: 2000 }
      );

      if (authenticated) {
        return;
      }

      await browser.clickVisible(remindMeLaterButton);
    })(),
    browser.waitUntil(
      async () => {
        // We don't check the exact project id, just want to make sure we are in
        // logged in part of atlas cloud
        return (authenticated = await isAtlasCloudPage(browser, cloudUrl));
      },
      { interval: 2000 }
    ),
  ]);

  if (authenticationPromiseSettled.status === 'rejected') {
    throw authenticationPromiseSettled.reason;
  }

  // Make sure that user has required roles before proceeding (those are not
  // persistent)
  await doCloudFetch(
    browser,
    ATLAS_CLOUD_TEST_UTILS.addRoles,
    { method: 'POST' },
    { json: ATLAS_CLOUD_TEST_UTILS.testUserRoles }
  );
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
