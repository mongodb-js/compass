import { Selectors } from '../compass';
import { type CompassBrowser } from '../compass-browser';

export const selectFocusModeStageOutputOption = async (
  browser: CompassBrowser,
  location: 'stage-input' | 'stage-output',
  option: 'expand' | 'collapse'
) => {
  await browser.clickVisible(Selectors.focusModeOutputOptionBtn(location));
  const actionsMenu = await browser.$(Selectors.PipelineOutputOptionsMenu);
  await actionsMenu.waitForDisplayed();

  await browser.clickVisible(Selectors.PipelineOutputOption(option));
};
