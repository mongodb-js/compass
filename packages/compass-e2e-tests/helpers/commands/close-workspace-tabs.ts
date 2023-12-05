import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function closeWorkspaceTabs(
  browser: CompassBrowser
): Promise<void> {
  const countTabs = async () => {
    return (await browser.$$(Selectors.workspaceTab(null))).length;
  };

  while ((await countTabs()) > 0) {
    const currentActiveTab = await browser.$(
      Selectors.workspaceTab(null, true)
    );
    await currentActiveTab.click();
    await browser.waitUntil(async () => {
      await currentActiveTab.$(Selectors.CloseWorkspaceTab).click();
      return (await currentActiveTab.isExisting()) === false;
    });
  }
}
