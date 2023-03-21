import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function runFind(
  browser: CompassBrowser,
  tabName: string,
  waitForResult: boolean
): Promise<void> {
  // look up the current resultId and applyId
  const initialResultId = await browser.getQueryId(tabName);
  const initialApplyId = await browser.getApplyId(tabName);

  // In some rare cases in ci (for example when clicking button in a query bar
  // right after closing a modal, clicks are not registering correctly on
  // certain machine types, in this case we continue clicking until we see that
  // applyId changed
  await browser.waitUntil(async () => {
    await browser.clickVisible(Selectors.queryBarApplyFilterButton(tabName));
    await browser.pause(50);
    return (await browser.getApplyId(tabName)) !== initialApplyId;
  });

  if (waitForResult) {
    // now we can easily see if we get a new resultId
    await browser.waitUntil(async () => {
      const resultId = await browser.getQueryId(tabName);
      return resultId !== initialResultId;
    });
  }
}
