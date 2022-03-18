import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function closeWorkspaceTabs(
  browser: CompassBrowser
): Promise<void> {
  const closeSelector = Selectors.CloseWorkspaceTab;

  const countTabs = async () => {
    const closeButtons = await browser.$$(closeSelector);
    return closeButtons.length;
  };

  let numTabs = await countTabs();
  while (numTabs > 0) {
    await browser.waitUntil(async () => {
      // Sometimes for whatever reason clicking to close the tab never closes
      // it so I just moved the click inside the wait loop.
      const closeButtons = await browser.$$(closeSelector);
      // The close tab element is hidden behind a hover, so we dont `clickVisible`.
      await closeButtons[0]?.click();

      const tabCount = await countTabs();
      return tabCount < numTabs;
    });

    numTabs = await countTabs();
  }
}
