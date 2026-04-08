import { Selectors } from '../compass.ts';
import { type CompassBrowser } from '../compass-browser.ts';

export const selectPipelineResultsOutputOption = async (
  browser: CompassBrowser,
  option: 'expand' | 'collapse'
) => {
  await browser.clickVisible(Selectors.PipelineResultsShowActionsBtn);
  const actionsMenu = browser.$(Selectors.PipelineOutputOptionsMenu);
  await actionsMenu.waitForDisplayed();

  await browser.clickVisible(Selectors.PipelineOutputOption(option));
};
