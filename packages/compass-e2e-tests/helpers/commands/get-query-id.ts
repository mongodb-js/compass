import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function getQueryId(
  browser: CompassBrowser,
  tabName: string
): Promise<string | undefined> {
  const queryBarSelector = Selectors.queryBar(tabName);
  const queryBarSelectorElement = browser.$(queryBarSelector);
  return queryBarSelectorElement.getAttribute('data-result-id');
}

export async function getApplyId(browser: CompassBrowser, tabName: string) {
  const queryBarSelector = Selectors.queryBar(tabName);
  const queryBarSelectorElement = browser.$(queryBarSelector);
  return queryBarSelectorElement.getAttribute('data-apply-id');
}
