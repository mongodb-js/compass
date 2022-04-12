import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

const defaultTimeoutMS = 30_000;

export async function connectWithConnectionString(
  browser: CompassBrowser,
  connectionString: string,
  timeout = defaultTimeoutMS,
  connectionStatus: 'success' | 'failure' | 'either' = 'success'
): Promise<void> {
  const sidebar = await browser.$(Selectors.SidebarTitle);
  if (await sidebar.isDisplayed()) {
    await browser.disconnect();
  }

  await browser.setValueVisible(
    Selectors.ConnectionStringInput,
    connectionString
  );
  await browser.doConnect(timeout, connectionStatus);
}
