import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function runFind(
  browser: CompassBrowser,
  tabName: string,
  waitForResult: boolean
): Promise<void> {
  // look up the current resultId
  const initialResultId = await browser.getQueryId(tabName);

  await browser.clickVisible(Selectors.queryBarApplyFilterButton(tabName));

  if (waitForResult) {
    // now we can easily see if we get a new resultId
    await browser.waitUntil(async () => {
      const resultId = await browser.getQueryId(tabName);
      return resultId !== initialResultId;
    });
  }
}
