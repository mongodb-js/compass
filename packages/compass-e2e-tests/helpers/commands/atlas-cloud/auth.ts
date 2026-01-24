import type { CompassBrowser } from '../../compass-browser';

export async function signInToAtlasCloudAccount(
  browser: CompassBrowser,
  signInPageUrl: string,
  atlasCloudPageUrl: string,
  username: string,
  password: string
) {
  await browser.navigateTo(signInPageUrl);

  await browser.waitForLeafygreenEnabled('input[name="username"]');
  await browser.$('input[name="username"]').setValue(username);

  await browser.waitForLeafygreenEnabled('button=Next');
  await browser.$('button=Next').click();

  await browser.$('input[name="password"]').waitForEnabled();
  await browser.$('input[name="password"]').setValue(password);

  await browser.$('button=Login').waitForEnabled();
  await browser.$('button=Login').click();

  let authenticated = false;

  // Atlas Cloud will periodically remind user to enable MFA (which we can't
  // enable in e2e CI environment), so to account for that, in parallel to
  // waiting for auth to finish, we'll wait for the MFA screen to show up and
  // skip it if it appears
  const [, authenticationPromiseSettled] = await Promise.allSettled([
    (async () => {
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
        const pageUrl = await browser.getUrl();
        // We don't check the exact project id, just want to make sure we are in
        // logged in part of atlas cloud
        return (authenticated = pageUrl.startsWith(`${atlasCloudPageUrl}/v2/`));
      },
      // See above
      { interval: 2000 }
    ),
  ]);

  if (authenticationPromiseSettled.status === 'rejected') {
    throw authenticationPromiseSettled.reason;
  }
}
