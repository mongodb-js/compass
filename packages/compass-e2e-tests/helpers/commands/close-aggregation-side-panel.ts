import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function closeAggregationSidePanel(
  browser: CompassBrowser
): Promise<void> {
  const aggSidePanel = await browser.$(Selectors.AggregationSidePanel);
  if (await aggSidePanel.isExisting()) {
    await browser.clickVisible(Selectors.AggregationSidePanelToggleButton);
    await aggSidePanel.waitForDisplayed({ reverse: true });
  }
}
