import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

type AggregationPanelState = 'opened' | 'closed';

export async function toggleAggregationSidePanel(
  browser: CompassBrowser,
  desiredState?: AggregationPanelState
): Promise<void> {
  const aggSidePanel = await browser.$(Selectors.AggregationSidePanel);
  const currentState: AggregationPanelState = (await aggSidePanel.isExisting())
    ? 'opened'
    : 'closed';
  if (desiredState === currentState) {
    return;
  }

  await browser.clickVisible(Selectors.AggregationSidePanelToggleButton);
  await aggSidePanel.waitForDisplayed({
    reverse: desiredState === 'closed' || currentState === 'opened',
  });
}
