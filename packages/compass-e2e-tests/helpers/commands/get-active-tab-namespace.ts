import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function getActiveTabNamespace(
  browser: CompassBrowser
): Promise<string | null> {
  // All the namespace tabs are rendered on the screen simultaneously
  const collectionTabHeaders = await browser.$$(
    Selectors.CollectionHeaderNamespace
  );
  for (const headerEl of collectionTabHeaders) {
    // Find the displayed one and return its trimmed text content
    if (await headerEl.isDisplayed()) {
      return (await headerEl.getText()).replace(/(\s|\n)/gm, '');
    }
  }
  return null;
}
