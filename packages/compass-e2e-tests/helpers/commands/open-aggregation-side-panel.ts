import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function openAggregationSidePanel(
  browser: CompassBrowser
): Promise<void> {
  await browser.clickVisible(Selectors.AggregationSidePanelToggleButton);
  const aggSidePanel = await browser.$(Selectors.AggregationSidePanel);
  await aggSidePanel.waitForDisplayed();
}
