import { TEST_COMPASS_WEB, TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function waitForConnectionResult(
  browser: CompassBrowser,
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
      ? Selectors.Multiple.ConnectionItemConnected
      : Selectors.MyQueriesList;
  } else {
    // TODO(COMPASS-7600): this doesn't support compass-web yet, but also isn't
    // encountered yet
    // TODO(COMPASS-7397): as explained below, for multiple connections we
    // ideally want to wait for the error toast, but at the time of writing the
    // error toast does not appear for autoconnect failures which is the main
    // use case for waiting for connection failures at present.
    selector = TEST_MULTIPLE_CONNECTIONS
      ? Selectors.Multiple.ConnectionItemFailed
      : Selectors.ConnectionFormErrorMessage;
  }
  console.log({ selector });
  const element = await browser.$(selector);
  await element.waitForDisplayed(
    typeof timeout !== 'undefined' ? { timeout } : undefined
  );

  if (TEST_MULTIPLE_CONNECTIONS) {
    await browser
      .$(Selectors.ConnectionModal)
      .waitForDisplayed({ reverse: true });
  }

  // TODO(COMPASS-7397): In the single connection case the element we wait for
  // happens to contain the useful error message. In the multiple connections
  // case it does not because we're just waiting for the status on the
  // connection item in the sidebar. Once the error toast appears for
  // autoconnect failures in multiple connections we can wait for the error
  // toast and return its text so that the calling code can check that.
  if (connectionStatus === 'failure' && !TEST_MULTIPLE_CONNECTIONS) {
    return await element.getText();
  }
}
