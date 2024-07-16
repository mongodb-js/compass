import { TEST_COMPASS_WEB, TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function waitForConnectionResult(
  browser: CompassBrowser,
  fromForm: boolean,
  connectionStatus: 'success' | 'failure' | 'either' = 'success',
  timeout?: number
): Promise<undefined | string> {
  let selector: string;
  if (connectionStatus === 'either') {
    // TODO(COMPASS-7600): this doesn't support compass-web yet, but also isn't
    // encountered yet For the rare cases where we don't care whether it fails
    // or succeeds
    selector = `${Selectors.DatabasesTable},${Selectors.ConnectionFormErrorMessage}`;
  } else if (connectionStatus === 'success') {
    // First meaningful thing on the screen after being connected, good enough
    // indicator that we are connected to the server
    // TODO(COMPASS-8023): wait for the specific connection to appear in the
    // sidebar and be connected
    selector = TEST_COMPASS_WEB
      ? '[data-testid="workspace-tab-button"][title=Databases]'
      : TEST_MULTIPLE_CONNECTIONS
      ? `${Selectors.SidebarTreeItems}[aria-expanded=true]`
      : Selectors.MyQueriesList;
  } else {
    // TODO(COMPASS-7600): this doesn't support compass-web yet, but also isn't
    // encountered yet
    selector = TEST_MULTIPLE_CONNECTIONS
      ? Selectors.ConnectionToastErrorText
      : Selectors.ConnectionFormErrorMessage;
  }
  const element = await browser.$(selector);
  await element.waitForDisplayed(
    typeof timeout !== 'undefined' ? { timeout } : undefined
  );
  if (connectionStatus === 'failure') {
    return await element.getText();
  }

  if (TEST_MULTIPLE_CONNECTIONS) {
    if (fromForm) {
      await browser
        .$(Selectors.ConnectionModal)
        .waitForDisplayed({ reverse: true });
    }

    // make sure the placeholders for databases & collections that are loading are all gone
    await browser
      .$(Selectors.DatabaseCollectionPlaceholder)
      .waitForDisplayed({ reverse: true });
  }
}
