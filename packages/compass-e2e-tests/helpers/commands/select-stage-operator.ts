import type { CompassBrowser } from '../compass-browser';
import delay from '../delay';
import * as Selectors from '../selectors';
import { focusStageOperator } from './focus-stage-operator';

export async function selectStageOperator(
  browser: CompassBrowser,
  index: number,
  stageOperator: string
): Promise<void> {
  const comboboxSelector = Selectors.stagePickerComboboxInput(index);
  const textareaSelector = Selectors.stageTextarea(index);

  await focusStageOperator(browser, index);

  await browser.setValueVisible(comboboxSelector, stageOperator);

  await browser.keys(['Enter']);

  // the "select" should now blur and the ace textarea become focused
  await browser.waitUntil(async () => {
    const inputElement = await browser.$(comboboxSelector);
    const isFocused = await inputElement.isFocused();
    return isFocused === false;
  });

  // click the textarea to focus the stage (this should happen automatically,
  // but flakes very often in CI)
  await browser.$(textareaSelector).click();

  await browser.waitUntil(async () => {
    const textareaElement = await browser.$(textareaSelector);
    const isFocused = await textareaElement.isFocused();
    return isFocused === true;
  });

  // NOTE: even if the focus moved away from the combobox interactions are still
  // targeting the combobox
  await delay(1000);
}
