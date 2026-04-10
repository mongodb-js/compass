import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

export async function getQueryId(
  browser: CompassBrowser,
  tabName: string
): Promise<string | null> {
  const queryBarSelector = Selectors.queryBar(tabName);
  const queryBarSelectorElement = browser.$(queryBarSelector);
  return queryBarSelectorElement.getAttribute('data-result-id');
}

export async function getApplyId(
  browser: CompassBrowser,
  tabName: string
): Promise<string | null> {
  const queryBarSelector = Selectors.queryBar(tabName);
  const queryBarSelectorElement = browser.$(queryBarSelector);
  return queryBarSelectorElement.getAttribute('data-apply-id');
}
