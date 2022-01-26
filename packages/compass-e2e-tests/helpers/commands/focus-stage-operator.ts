import type { Browser } from 'webdriverio';
import * as Commands from '../commands';
import * as Selectors from '../selectors';

export async function focusStageOperator(
  browser: Browser<'async'>,
  index: number
): Promise<void> {
  await Commands.clickVisible(browser, Selectors.stageCollapseButton(index));
  await Commands.clickVisible(browser, Selectors.stageExpandButton(index));
  await browser.keys(['Tab']);
  const stageSelectorElement = await browser.$(
    Selectors.stageSelectControlInput(index, true)
  );
  await stageSelectorElement.waitForDisplayed();
}
