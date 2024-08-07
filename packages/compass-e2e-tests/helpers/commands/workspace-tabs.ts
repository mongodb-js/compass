import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import type { WorkspaceTabSelectorOptions } from '../selectors';
import Debug from 'debug';
const debug = Debug('compass-e2e-tests');

export async function navigateToMyQueries(browser: CompassBrowser) {
  await browser.clickVisible(Selectors.SidebarMyQueriesTab);
  await browser
    .$(Selectors.workspaceTab({ type: 'My Queries', active: true }))
    .waitForDisplayed();
}

async function closeTab(
  browser: CompassBrowser,
  selectorOptions: WorkspaceTabSelectorOptions,
  autoConfirmTabClose: boolean
): Promise<void> {
  // wait until the tab goes away and if the confirmation modal opens, maybe confirm
  await browser.waitUntil(
    async () => {
      // first hover the tab so that the close button shows up
      await browser.hover(Selectors.workspaceTab(selectorOptions));
      // keep retrying the click :(
      await browser.clickVisible(
        browser
          .$(Selectors.workspaceTab(selectorOptions))
          .$(Selectors.CloseWorkspaceTab)
      );

      if (autoConfirmTabClose) {
        // Tabs in "dirty" state can't be closed without confirmation
        if (await browser.$(Selectors.ConfirmTabCloseModal).isExisting()) {
          await browser.clickVisible(
            browser.$(Selectors.ConfirmTabCloseModal).$('button=Close tab')
          );
          await browser
            .$(Selectors.ConfirmTabCloseModal)
            .waitForDisplayed({ reverse: true });
        }
      }
      return (
        (await browser
          .$(Selectors.workspaceTab(selectorOptions))
          .isExisting()) === false
      );
    },
    // Don't wait longer than the wait in closeWorkspaceTabs
    { timeout: 10_000 }
  );
}

export async function closeWorkspaceTabs(
  browser: CompassBrowser,
  autoConfirmTabClose = true
): Promise<void> {
  const countTabs = async () => {
    return (await browser.$$(Selectors.workspaceTab())).length;
  };

  await browser.waitUntil(async () => {
    const numTabsStart = await countTabs();
    if (numTabsStart > 0) {
      const currentActiveTab = await browser.$(
        Selectors.workspaceTab({ active: true })
      );

      // Close this exact active tab rather than "the active one" because if there
      // are multiple tabs then another tab will immediately become active and
      // trip up the logic that checks that the tab you closed went away.
      const id = await currentActiveTab.getAttribute('id');
      debug('closing tab', { numTabsStart, id });
      await closeTab(browser, { id }, autoConfirmTabClose);

      const numTabsEnd = await countTabs();
      debug('after closing tab', { id, numTabsStart, numTabsEnd });
      return numTabsEnd === 0;
    } else {
      return true;
    }
  });
}

export async function closeWorkspaceTab(
  browser: CompassBrowser,
  selectorOptions: WorkspaceTabSelectorOptions
): Promise<void> {
  const currentTabId = await browser
    .$(Selectors.workspaceTab({ active: true }))
    .getAttribute('id');
  const targetTabId = await browser
    .$(Selectors.workspaceTab(selectorOptions))
    .getAttribute('id');

  if (currentTabId !== targetTabId) {
    // The tab we want to close isn't the active one so the close button isn't
    // visible. We can either focus it which would have the side-effect of
    // changing the tab focus or we can try and hover over it.
    await browser.hover(Selectors.workspaceTab(selectorOptions));
  }

  await closeTab(browser, selectorOptions, true);
}
