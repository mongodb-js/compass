import type { CompassBrowser } from '../compass-browser';
import retryWithBackoff from '../retry-with-backoff';
import * as Selectors from '../selectors';

export async function showShell(browser: CompassBrowser): Promise<void> {
  // Expand the shVdell
  await retryWithBackoff(async function () {
    const shellContentElement = await browser.$(Selectors.ShellContent);
    if (!(await shellContentElement.isDisplayed())) {
      await browser.clickVisible(Selectors.ShellExpandButton);
    }

    await browser.clickVisible(Selectors.ShellInput);
  });
}

export async function executeInShell(
  browser: CompassBrowser,
  command: string
): Promise<void> {
  await browser.showShell();
  await browser.setAceValue(Selectors.ShellContent, command);
  await browser.keys(['Enter']);
}
