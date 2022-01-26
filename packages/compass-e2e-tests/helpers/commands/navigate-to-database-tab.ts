import { Browser } from 'webdriverio';
import * as Commands from '../commands';
import * as Selectors from '../selectors';

import { expect } from 'chai';

export async function navigateToDatabaseTab(
  browser: Browser<'async'>,
  dbName: string,
  tabName: string
): Promise<void> {
  await Commands.navigateToInstanceTab(browser, 'Databases');

  await Commands.clickVisible(browser, Selectors.databaseCard(dbName));

  // there is only the one tab for now, so this just just an assertion
  expect(tabName).to.equal('Collections');

  const tabSelectedSelector = Selectors.databaseTab(tabName, true);

  const tabSelectorElement = await browser.$(tabSelectedSelector);
  await tabSelectorElement.waitForDisplayed();
}
