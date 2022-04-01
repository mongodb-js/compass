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
      // Close the tab with keys as the close button focusing
      // is finicky in e2e tests.
      const META = process.platform === 'darwin' ? 'Meta' : 'Control';
      await browser.keys([META, 'w']);
      await browser.keys([META]); // meta a second time to release it

      // Attempt to close the tab using the button.
      const closeButtons = await browser.$$(closeSelector);
      await closeButtons[0]?.click();

      const tabCount = await countTabs();
      return tabCount < numTabs;
    });

    numTabs = await countTabs();
  }
}
