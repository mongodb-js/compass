import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import retryWithBackoff from '../retry-with-backoff';
import * as Selectors from '../selectors';

export async function hideShell(
  browser: CompassBrowser,
  connectionName: string
): Promise<void> {
  if (TEST_MULTIPLE_CONNECTIONS) {
    await browser.closeWorkspaceTab({
      connectionName,
      type: 'Shell',
    });
  } else {
    await retryWithBackoff(async function () {
      const shellContentElement = await browser.$(Selectors.ShellContent);
      if (await shellContentElement.isDisplayed()) {
        await browser.clickVisible(Selectors.ShellExpandButton);
      }
    });
  }
}
