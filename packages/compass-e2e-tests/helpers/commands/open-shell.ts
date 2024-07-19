import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import retryWithBackoff from '../retry-with-backoff';
import * as Selectors from '../selectors';

export async function openShell(
  browser: CompassBrowser,
  connectionName: string
): Promise<void> {
  if (TEST_MULTIPLE_CONNECTIONS) {
    await browser.selectConnectionMenuItem(
      connectionName,
      Selectors.Multiple.OpenShellItem
    );

    // try and make sure the shell tab is active and ready
    await browser.waitUntil(async () => {
      const currentActiveTab = await browser.$(
        Selectors.workspaceTab({ active: true })
      );
      const activeType = await currentActiveTab.getAttribute('data-type');
      const activeConnectionName = await currentActiveTab.getAttribute(
        'data-connectionName'
      );
      return activeType === 'Shell' && activeConnectionName === connectionName;
    });

    await browser.clickVisible(Selectors.ShellInputEditor);
  } else {
    // Expand the shell
    await retryWithBackoff(async function () {
      const shellContentElement = await browser.$(Selectors.ShellContent);
      if (!(await shellContentElement.isDisplayed())) {
        // The toasts may be covering the shell, so we need to close them.
        await browser.hideAllVisibleToasts();
        await browser.clickVisible(Selectors.ShellExpandButton);
      }

      await browser.clickVisible(Selectors.ShellInputEditor);
    });
  }
}
