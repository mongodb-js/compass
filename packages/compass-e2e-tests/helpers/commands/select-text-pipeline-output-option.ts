import { Selectors } from '../compass.ts';
import { type CompassBrowser } from '../compass-browser.ts';

export const selectTextPipelineOutputOption = async (
  browser: CompassBrowser,
  option: 'expand' | 'collapse'
) => {
  await browser.clickVisible(Selectors.AggregationAsTextShowActionsBtn);
  const actionsMenu = browser.$(Selectors.PipelineOutputOptionsMenu);
  await actionsMenu.waitForDisplayed();

  await browser.clickVisible(Selectors.PipelineOutputOption(option));
};
