import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function focusStageOperator(
  browser: CompassBrowser,
  index: number
): Promise<void> {
  await browser.clickVisible(Selectors.stageCollapseButton(index));
  await browser.clickVisible(Selectors.stageExpandButton(index));
  await browser.keys(['Tab']);
  await browser.keys(['Enter']); // show the list of stages
  const stageSelectorElement = await browser.$(
    Selectors.stageSelectControlInput(index, true)
  );
  await stageSelectorElement.waitForDisplayed();
}
