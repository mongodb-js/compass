import {
  DEFAULT_CONNECTION_STRING_1,
  DEFAULT_CONNECTION_STRING_2,
  TEST_COMPASS_WEB,
  TEST_MULTIPLE_CONNECTIONS,
  connectionNameFromString,
} from '../compass';
import type { CompassBrowser } from '../compass-browser';
import type { ConnectFormState } from '../connect-form-state';
import * as Selectors from '../selectors';
import Debug from 'debug';
const debug = Debug('compass-e2e-tests');

export async function waitForConnectionScreen(
  browser: CompassBrowser
): Promise<void> {
  // there isn't a separate connection screen in multiple connections, just a modal you can access at any time
  if (TEST_MULTIPLE_CONNECTIONS) {
    return;
  }

  const selector = TEST_COMPASS_WEB
    ? Selectors.ConnectionFormStringInput
    : Selectors.ConnectSection;
  const connectScreenElement = await browser.$(selector);
  await connectScreenElement.waitForDisplayed();
}

export async function getConnectFormConnectionString(
  browser: CompassBrowser,
  shouldFocusInput = false
): Promise<string> {
  const inputElem = await browser.$(Selectors.ConnectionFormStringInput);
  await inputElem.waitForDisplayed();
  if (shouldFocusInput) {
    await browser.waitUntil(async () => {
      await inputElem.click();
      return await inputElem.isFocused();
    });
  }
  return await inputElem.getValue();
}

export async function connectWithConnectionString(
  browser: CompassBrowser,
  connectionString = DEFAULT_CONNECTION_STRING_1,
  options: ConnectionResultOptions = {}
): Promise<void> {
  if (TEST_MULTIPLE_CONNECTIONS) {
    // if the modal is still animating away when we're connecting again, things
    // are going to get confused
    await browser
      .$(Selectors.ConnectionModal)
      .waitForDisplayed({ reverse: true });

    // if a connection with this name already exists, remove it otherwise we'll
    // add a duplicate and things will get complicated fast
    const connectionName = connectionNameFromString(connectionString);
    if (await browser.removeConnection(connectionName)) {
      debug('Removing existing connection so we do not create a duplicate', {
        connectionName,
      });
    }

    await browser.clickVisible(Selectors.Multiple.SidebarNewConnectionButton);
    await browser.$(Selectors.ConnectionModal).waitForDisplayed();
  }

  await browser.setValueVisible(
    Selectors.ConnectionFormStringInput,
    connectionString
  );

  const connectionName = connectionNameFromString(connectionString);
  await browser.doConnect(connectionName, options);
}

export async function connectWithConnectionForm(
  browser: CompassBrowser,
  state: ConnectFormState,
  options: ConnectionResultOptions = {}
): Promise<void> {
  // If a connectionName is specified and a connection already exists with this
  // name, make sure we don't add a duplicate so that tests can always address
  // this new connection.
  if (state.connectionName) {
    if (await browser.removeConnection(state.connectionName)) {
      debug('Removing existing connection so we do not create a duplicate', {
        connectionName: state.connectionName,
      });
    }
  }

  await browser.setConnectFormState(state);

  if (!state.connectionName) {
    // In theory we could calculate the auto-generated connectionName here or
    // try an read it out.
    throw new Error('state.connectionName is required');
  }
  const connectionName = state.connectionName;
  await browser.doConnect(connectionName, options);
}

type ConnectionResultOptions = {
  connectionStatus?: 'success' | 'failure' | 'either';
  timeout?: number;
};

export async function doConnect(
  browser: CompassBrowser,
  connectionName: string,
  options: ConnectionResultOptions = {}
) {
  await browser.clickVisible(Selectors.ConnectButton);
  await browser.waitForConnectionResult(connectionName, options);
}

export async function waitForConnectionResult(
  browser: CompassBrowser,
  connectionName: string,
  { connectionStatus = 'success', timeout }: ConnectionResultOptions = {}
) {
  const waitOptions = typeof timeout !== 'undefined' ? { timeout } : undefined;

  if (connectionStatus === 'either') {
    // TODO(COMPASS-7600): this doesn't support compass-web yet, but also isn't
    // encountered yet For the rare cases where we don't care whether it fails
    // or succeeds
    await browser
      .$(`${Selectors.DatabasesTable},${Selectors.ConnectionFormErrorMessage}`)
      .waitForDisplayed();
  } else if (connectionStatus === 'success') {
    // Wait for the first meaningful thing on the screen after being connected
    // and assume that's a good enough indicator that we are connected to the
    // server
    if (TEST_COMPASS_WEB) {
      // In compass-web, for now, we land on the Databases tab after connecting
      await browser
        .$('[data-testid="workspace-tab-button"][title=Databases]')
        .waitForDisplayed();
    } else if (TEST_MULTIPLE_CONNECTIONS) {
      // For multiple connections, make sure the exact named connection is expanded
      await browser
        .$(
          `${Selectors.SidebarTreeItems}[aria-expanded=true] [data-testid="base-navigation-item"][data-connection-name="${connectionName}"]}`
        )
        .waitForDisplayed();
    } else {
      // In the single connection world we land on the My Queries page
      await browser.$(Selectors.MyQueriesList).waitForDisplayed();
    }
  } else if (connectionStatus === 'failure') {
    if (TEST_MULTIPLE_CONNECTIONS) {
      const element = await browser.$(Selectors.ConnectionToastErrorText);
      await element.waitForDisplayed(waitOptions);
      return await element.getText();
    } else {
      // TODO(COMPASS-7600): this doesn't support compass-web yet, but also
      // isn't encountered yet
      const element = await browser.$(Selectors.ConnectionFormErrorMessage);
      await element.waitForDisplayed(waitOptions);
      return await element.getText();
    }
  } else {
    const exhaustiveCheck: never = connectionStatus;
    throw new Error(`Unhandled connectionStatus case: ${exhaustiveCheck}`);
  }

  if (TEST_MULTIPLE_CONNECTIONS) {
    // make sure the placeholders for databases & collections that are loading are all gone
    await browser
      .$(Selectors.DatabaseCollectionPlaceholder)
      .waitForDisplayed({ reverse: true });
  }
}

export async function connectToDefaults(browser: CompassBrowser) {
  await browser.connectWithConnectionString(DEFAULT_CONNECTION_STRING_1);

  if (TEST_MULTIPLE_CONNECTIONS) {
    await browser.connectWithConnectionString(DEFAULT_CONNECTION_STRING_2);
  }

  await browser.hideAllVisibleToasts();
}
