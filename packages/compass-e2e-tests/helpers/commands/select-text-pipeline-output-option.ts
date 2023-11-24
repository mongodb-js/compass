import { Selectors } from '../compass';
import { type CompassBrowser } from '../compass-browser';

export const selectTextPipelineOutputOption = async (
  browser: CompassBrowser,
  option: 'expand' | 'collapse'
) => {
  await browser.clickVisible(Selectors.AggregationAsTextShowActionsBtn);
  const actionsMenu = await browser.$(Selectors.PipelineOutputOptionsMenu);
  await actionsMenu.waitForDisplayed();

  await browser.clickVisible(Selectors.PipelineOutputOption(option));
};
