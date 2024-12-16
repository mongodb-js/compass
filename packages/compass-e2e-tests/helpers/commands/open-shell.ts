import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function openShell(
  browser: CompassBrowser,
  connectionName: string
): Promise<void> {
  await browser.selectConnectionMenuItem(
    connectionName,
    Selectors.Multiple.OpenShellItem,
    false // the item is not contained in the three-dot menu
  );

  // try and make sure the shell tab is active and ready
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
