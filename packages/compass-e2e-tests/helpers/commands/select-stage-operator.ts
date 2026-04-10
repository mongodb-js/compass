import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';
import { focusStageOperator } from './focus-stage-operator.ts';

export async function selectStageOperator(
  browser: CompassBrowser,
  index: number,
  stageOperator: string
): Promise<void> {
  const comboboxSelector = Selectors.stagePickerComboboxInput(index);
  const editorSelector = Selectors.stageValueEditor(index);

  await focusStageOperator(browser, index);

  await browser.setComboBoxValue(comboboxSelector, stageOperator);

  // the "select" should now blur and the ace textarea become focused
  await browser.waitUntil(async () => {
    const inputElement = browser.$(comboboxSelector);
    const isFocused = await inputElement.isFocused();
    return isFocused === false;
  });

  const stageSelectorListBoxElement = browser.$(
    Selectors.stagePickerListBox(index)
  );

  await stageSelectorListBoxElement.waitForDisplayed({ reverse: true });

  await browser.waitUntil(async () => {
    const editorElement = browser.$(editorSelector);
    const isFocused = await editorElement.isFocused();
    return isFocused === true;
  });
}
