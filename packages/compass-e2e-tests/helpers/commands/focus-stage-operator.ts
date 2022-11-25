import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function focusStageOperator(
  browser: CompassBrowser,
  index: number
): Promise<void> {
  const comboboxInputSelector = Selectors.stagePickerComboboxInput(index);
  await browser.clickVisible(comboboxInputSelector);

  await browser.waitUntil(async () => {
    const inputElement = await browser.$(comboboxInputSelector);
    const isFocused = await inputElement.isFocused();
    if (isFocused === true) {
      return true;
    } else {
      // try to click again
      await inputElement.click();
      return false;
    }
  });

  const stageSelectorListBoxElement = await browser.$(
    Selectors.stagePickerListBox(index)
  );

  await stageSelectorListBoxElement.waitForDisplayed();
}
