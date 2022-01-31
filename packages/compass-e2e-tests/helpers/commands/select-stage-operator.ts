import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function selectStageOperator(
  browser: CompassBrowser,
  index: number,
  stageOperator: string
): Promise<void> {
  const inputSelector = Selectors.stageSelectControlInput(index);
  const textareaSelector = Selectors.stageTextarea(index);

  // it should become focused straight after focusStageSelector()
  await browser.waitUntil(async () => {
    const inputElement = await browser.$(inputSelector);
    const isFocused = await inputElement.isFocused();
    return isFocused === true;
  });

  await browser.setValueVisible(inputSelector, stageOperator);
  await browser.keys(['Enter']);

  // the "select" should now blur and the ace textarea become focused
  await browser.waitUntil(async () => {
    const textareaElement = await browser.$(textareaSelector);
    const isFocused = await textareaElement.isFocused();
    return isFocused === true;
  });
}
