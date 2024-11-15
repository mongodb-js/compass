import {
  DEFAULT_CONNECTION_STRING_1,
  DEFAULT_CONNECTION_NAME_1,
  connectionNameFromString,
} from '../compass';
import type { CompassBrowser } from '../compass-browser';
import type { ConnectFormState } from '../connect-form-state';
import * as Selectors from '../selectors';
import Debug from 'debug';
import {
  DEFAULT_CONNECTION_NAMES,
  isTestingAtlasCloudExternal,
  isTestingAtlasCloudSandbox,
} from '../test-runner-context';

const debug = Debug('compass-e2e-tests');

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

/**
 * Use this command when you need to add a new connection with a specific
 * connection string. Most test files should just be using
 * browser.connectToDefaults()
 */
export async function connectWithConnectionString(
  browser: CompassBrowser,
  connectionStringOrName?: string,
  options: ConnectOptions = {}
): Promise<void> {
  // When testing Atlas Cloud, we can't really create a new connection, so just
  // assume a connection name was passed (with a fallback to a default one) and
  // try to use it
  if (isTestingAtlasCloudExternal() || isTestingAtlasCloudSandbox()) {
    await browser.connectByName(
      connectionStringOrName ?? DEFAULT_CONNECTION_NAME_1
    );
    return;
  }

  connectionStringOrName ??= DEFAULT_CONNECTION_STRING_1;

  // if the modal is still animating away when we're connecting again, things
  // are going to get confused
  await browser
    .$(Selectors.ConnectionModal)
    .waitForDisplayed({ reverse: true });

  // if a connection with this name already exists, remove it otherwise we'll
  // add a duplicate and things will get complicated fast
  const connectionName = connectionNameFromString(connectionStringOrName);
  if (await browser.removeConnection(connectionName)) {
    debug('Removing existing connection so we do not create a duplicate', {
      connectionName,
    });
  }

  await browser.clickVisible(Selectors.Multiple.SidebarNewConnectionButton);
  await browser.$(Selectors.ConnectionModal).waitForDisplayed();

  await browser.setValueVisible(
    Selectors.ConnectionFormStringInput,
    connectionStringOrName
  );

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

  if (await browser.$(Selectors.SidebarFilterInput).isDisplayed()) {
    // Clear the filter to make sure every connection shows
    await browser.clickVisible(Selectors.SidebarFilterInput);
    await browser.setValueVisible(Selectors.SidebarFilterInput, '');
  }

  if (connectionStatus === 'either') {
    // For the very rare cases where we don't care whether it fails or succeeds.
    // Usually because the exact result is a race condition.
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
  } else if (connectionStatus === 'success') {
    // Wait for the first meaningful thing on the screen after being connected
    // and assume that's a good enough indicator that we are connected to the
    // server
    await browser
      .$(
        Selectors.Multiple.connectionItemByName(connectionName, {
          connected: true,
        })
      )
      .waitForDisplayed();
  } else if (connectionStatus === 'failure') {
    await browser
      .$(Selectors.ConnectionToastErrorText)
      .waitForDisplayed(waitOptions);
    return await browser.$(Selectors.LGToastTitle).getText();
  } else {
    const exhaustiveCheck: never = connectionStatus;
    throw new Error(`Unhandled connectionStatus case: ${exhaustiveCheck}`);
  }

  // make sure the placeholders for databases & collections that are loading are all gone
  await browser
    .$(Selectors.DatabaseCollectionPlaceholder)
    .waitForDisplayed({ reverse: true });
}

export async function connectByName(
  browser: CompassBrowser,
  connectionName: string,
  options: ConnectionResultOptions = {}
) {
  await browser.hover(Selectors.sidebarConnection(connectionName));
  await browser.clickVisible(Selectors.sidebarConnectionButton(connectionName));
  await browser.waitForConnectionResult(connectionName, options);
}

export async function connectToDefaults(browser: CompassBrowser) {
  for (const name of DEFAULT_CONNECTION_NAMES) {
    // See setupDefaultConnections() for the details behind the thinking here.
    await browser.connectByName(name);
  }

  // We assume that we connected successfully, so just close the success toasts
  // early to make sure they aren't in the way of tests. Tests that care about
  // those toasts don't and shouldn't be using this command.
  await browser.hideAllVisibleToasts();
}
