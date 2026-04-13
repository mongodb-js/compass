import { Selectors } from '../compass.ts';
import { type CompassBrowser } from '../compass-browser.ts';

export const selectFocusModeStageOutputOption = async (
  browser: CompassBrowser,
  location: 'stage-input' | 'stage-output',
  option: 'expand' | 'collapse'
) => {
  await browser.clickVisible(Selectors.focusModeOutputOptionBtn(location));
  const actionsMenu = browser.$(Selectors.PipelineOutputOptionsMenu);
  await actionsMenu.waitForDisplayed();

  await browser.clickVisible(Selectors.PipelineOutputOption(option));
};
