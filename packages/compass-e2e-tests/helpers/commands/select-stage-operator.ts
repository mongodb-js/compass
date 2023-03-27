import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import { focusStageOperator } from './focus-stage-operator';

export async function selectStageOperator(
  browser: CompassBrowser,
  index: number,
  stageOperator: string
): Promise<void> {
  const comboboxSelector = Selectors.stagePickerComboboxInput(index);
  const editorSelector = Selectors.stageValueEditor(index);

  await focusStageOperator(browser, index);

  await browser.setValueVisible(comboboxSelector, stageOperator);

  await browser.keys(['Enter']);

  // the "select" should now blur and the ace textarea become focused
  await browser.waitUntil(async () => {
    const inputElement = await browser.$(comboboxSelector);
    const isFocused = await inputElement.isFocused();
    return isFocused === false;
  });

  const stageSelectorListBoxElement = await browser.$(
    Selectors.stagePickerListBox(index)
  );

  await stageSelectorListBoxElement.waitForDisplayed({ reverse: true });

  await browser.waitUntil(async () => {
    const editorElement = await browser.$(editorSelector);
    const isFocused = await editorElement.isFocused();
    return isFocused === true;
  });
}
