import type { Browser } from 'webdriverio';
import * as Commands from '../commands';
import * as Selectors from '../selectors';

const defaultTimeoutMS = 30_000;

export async function connectWithConnectionString(
  browser: Browser<'async'>,
  connectionString: string,
  timeout = defaultTimeoutMS,
  connectionStatus: 'success' | 'failure' | 'either' = 'success'
): Promise<void> {
  await Commands.setValueVisible(
    browser,
    Selectors.ConnectionStringInput,
    connectionString
  );
  await Commands.doConnect(browser, timeout, connectionStatus);
}
