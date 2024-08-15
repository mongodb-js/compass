import {
  DEFAULT_CONNECTION_NAME_1,
  DEFAULT_CONNECTION_NAME_2,
  DEFAULT_CONNECTION_STRING_1,
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

type ConnectionResultOptions = {
  connectionStatus?: 'success' | 'failure' | 'either';
  timeout?: number;
};

type ConnectOptions = ConnectionResultOptions & {
  removeConnections?: boolean;
};

export async function connectWithConnectionString(
  browser: CompassBrowser,
  connectionString = DEFAULT_CONNECTION_STRING_1,
  options: ConnectOptions = {}
): Promise<void> {
  // Use this command when you need to add a new connection with a specific
  // connection string. Most test files should just be using
  // browser.connectToDefaults()

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
  options: ConnectOptions = {}
): Promise<void> {
  // Use this command when you need to add a new connection with specific
  // connect form field values. Most test files should just be using
  // browser.connectToDefaults()

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
): Promise<string | undefined> {
  const waitOptions = typeof timeout !== 'undefined' ? { timeout } : undefined;

  if (TEST_MULTIPLE_CONNECTIONS) {
    if (await browser.$(Selectors.SidebarFilterInput).isDisplayed()) {
      // Clear the filter to make sure every connection shows
      await browser.clickVisible(Selectors.SidebarFilterInput);
      await browser.setValueVisible(Selectors.SidebarFilterInput, '');
    }
  }

  if (connectionStatus === 'either') {
    // For the very rare cases where we don't care whether it fails or succeeds.
    // Usually because the exact result is a race condition.
    if (TEST_MULTIPLE_CONNECTIONS) {
      const successSelector = Selectors.Multiple.connectionItemByName(
        connectionName,
        {
          connected: true,
        }
      );
      const failureSelector = Selectors.ConnectionToastErrorText;
      await browser
        .$(`${successSelector},${failureSelector}`)
        .waitForDisplayed(waitOptions);
    } else {
      // TODO(COMPASS-7600): this doesn't support compass-web yet, but also
      // isn't encountered yet
      await browser
        .$(`${Selectors.MyQueriesList},${Selectors.ConnectionFormErrorMessage}`)
        .waitForDisplayed();
    }
  } else if (connectionStatus === 'success') {
    // Wait for the first meaningful thing on the screen after being connected
    // and assume that's a good enough indicator that we are connected to the
    // server
    if (TEST_COMPASS_WEB) {
      // In compass-web, for now, we land on the Databases tab after connecting
      await browser
        .$('[data-testid="workspace-tab-button"][data-type=Databases]')
        .waitForDisplayed({ timeout });
    } else if (TEST_MULTIPLE_CONNECTIONS) {
      await browser
        .$(
          Selectors.Multiple.connectionItemByName(connectionName, {
            connected: true,
          })
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

export async function connectByName(
  browser: CompassBrowser,
  connectionName: string,
  options: ConnectionResultOptions = {}
) {
  await browser.clickVisible(Selectors.sidebarConnectionButton(connectionName));

  if (!TEST_MULTIPLE_CONNECTIONS) {
    // for single connections it only fills the connection form and we still
    // have to click connect. For multiple connections clicking the connection
    // connects
    await browser.pause(1000);
    await browser.clickVisible(Selectors.ConnectButton);
  }

  await browser.waitForConnectionResult(connectionName, options);
}

export async function connectToDefaults(browser: CompassBrowser) {
  if (TEST_COMPASS_WEB) {
    // we can't connect by name with compass-web because we can't save connections yet
    await browser.connectWithConnectionString();
    return;
  }

  // See setupDefaultConnections() for the details behind the thinking here.
  await browser.connectByName(DEFAULT_CONNECTION_NAME_1);

  if (TEST_MULTIPLE_CONNECTIONS) {
    await browser.connectByName(DEFAULT_CONNECTION_NAME_2);
  }

  // We assume that we connected successfully, so just close the success toasts
  // early to make sure they aren't in the way of tests. Tests that care about
  // those toasts don't and shouldn't be using this command.
  await browser.hideAllVisibleToasts();
}
