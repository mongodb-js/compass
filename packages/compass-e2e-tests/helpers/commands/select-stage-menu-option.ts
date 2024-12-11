import { Selectors } from '../compass';
import type { CompassBrowser } from '../compass-browser';

export async function selectStageMenuOption(
  browser: CompassBrowser,
  stageIndex: number,
  optionSelector: string
): Promise<void> {
  await browser.clickVisible(Selectors.stageMoreOptions(stageIndex));
  const menuElement = browser.$(Selectors.StageMoreOptionsContent);
  await menuElement.waitForDisplayed();
  await browser.clickVisible(optionSelector);
}
