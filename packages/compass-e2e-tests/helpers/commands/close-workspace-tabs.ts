import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function closeWorkspaceTabs(
  browser: CompassBrowser
): Promise<void> {
  const tabSelector = Selectors.WorkspaceTab;
  const closeSelector = Selectors.CloseWorkspaceTab;

  const countTabs = async () => {
    const closeButtons = await browser.$$(closeSelector);
    return closeButtons.length;
  };

  let numTabs = await countTabs();
  while (numTabs > 0) {
    await browser.waitUntil(async () => {
      // Focus the tab so the close button becomes visible.
      await browser.clickVisible(tabSelector);
      await browser.keys(['Tab']);

      // Sometimes for whatever reason clicking to close the tab never closes
      // it so I just moved the click inside the wait loop.
      await browser.clickVisible(closeSelector);

      const tabCount = await countTabs();
      return tabCount < numTabs;
    });

    numTabs = await countTabs();
  }
}
