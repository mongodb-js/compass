import type { CompassBrowser } from '../compass-browser';
import retryWithBackoff from '../retry-with-backoff';
import * as Selectors from '../selectors';

export async function showShell(browser: CompassBrowser): Promise<void> {
  // Expand the shVdell
  await retryWithBackoff(async function () {
    const shellContentElement = await browser.$(Selectors.ShellContent);
    if (!(await shellContentElement.isDisplayed())) {
      // The toasts may be covering the shell, so we need to close them.
      await browser.hideToasts();
      await browser.clickVisible(Selectors.ShellExpandButton);
    }

    await browser.clickVisible(Selectors.ShellInputEditor);
  });
}
