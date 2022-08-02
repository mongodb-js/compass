import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

import { expect } from 'chai';

export async function navigateToDatabaseTab(
  browser: CompassBrowser,
  dbName: string,
  tabName: string
): Promise<void> {
  await browser.navigateToInstanceTab('Databases');

  await browser.clickVisible(Selectors.databaseCardClickable(dbName));

  // there is only the one tab for now, so this is just an assertion
  expect(tabName).to.equal('Collections');

  const tabSelectedSelector = Selectors.databaseTab(tabName, true);

  const tabSelectorElement = await browser.$(tabSelectedSelector);
  await tabSelectorElement.waitForDisplayed();
}
