import type { CompassBrowser } from '../compass-browser';
import retryWithBackoff from '../retry-with-backoff';
import * as Selectors from '../selectors';

export async function hideShell(browser: CompassBrowser): Promise<void> {
  await retryWithBackoff(async function () {
    const shellContentElement = await browser.$(Selectors.ShellContent);
    if (await shellContentElement.isDisplayed()) {
      await browser.clickVisible(Selectors.ShellExpandButton);
    }
  });
}
