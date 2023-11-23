import { expect } from 'chai';
import { Selectors } from '../compass';
import { type CompassBrowser } from '../compass-browser';

export async function navigateWithinCurrentCollectionTabs(
  browser: CompassBrowser,
  tabName: string
): Promise<void> {
  const tabSelector = Selectors.collectionTab(tabName);
  const tabSelectedSelector = Selectors.collectionTab(tabName, true);

  const tabSelectedSelectorElement = await browser.$(tabSelectedSelector);
  // if the correct tab is already visible, do nothing
  if (await tabSelectedSelectorElement.isExisting()) {
    return;
  }

  // otherwise select the tab and wait for it to become selected
  await browser.clickVisible(tabSelector);

  await tabSelectedSelectorElement.waitForDisplayed();

  // regression test: The workspace tab should contain the document tab name.
  const workspaceTabText = await browser
    .$(Selectors.SelectedWorkspaceTabButton)
    .getText();
  // example: 'Indexestest.test'
  expect(workspaceTabText).to.contain(tabName);
}
