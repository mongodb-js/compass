import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

async function waitForShellToBeReady(
  browser: CompassBrowser,
  connectionName: string
): Promise<void> {
  await browser.waitUntil(async () => {
    const currentActiveTab = browser.$(
      Selectors.workspaceTab({ active: true })
    );
    const activeType = await currentActiveTab.getAttribute('data-type');
    const activeConnectionName = await currentActiveTab.getAttribute(
      'data-connection-name'
    );
    return activeType === 'Shell' && activeConnectionName === connectionName;
  });

  await browser.clickVisible(Selectors.ShellInputEditor);
}

export async function openShellFromSidebar(
  browser: CompassBrowser,
  connectionName: string
): Promise<void> {
  await browser.selectConnectionMenuItem(
    connectionName,
    Selectors.OpenShellItem,
    false // the item is not contained in the three-dot menu
  );

  await waitForShellToBeReady(browser, connectionName);
}

export async function openShellFromCollectionHeader(
  browser: CompassBrowser,
  connectionName: string
): Promise<void> {
  await browser.clickVisible(Selectors.CollectionHeaderOpenShellButton);

  await waitForShellToBeReady(browser, connectionName);
}
