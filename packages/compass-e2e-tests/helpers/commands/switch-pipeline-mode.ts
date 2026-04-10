import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

export async function switchPipelineMode(
  browser: CompassBrowser,
  mode: 'as-text' | 'builder-ui'
): Promise<void> {
  await browser.clickVisible(Selectors.aggregationPipelineModeToggle(mode));
  await browser.waitForAnimations(Selectors.AggregationBuilderWorkspace);
}
