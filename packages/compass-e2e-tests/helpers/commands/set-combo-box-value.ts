import type { CompassBrowser } from '../compass-browser';

export async function setComboBoxValue(
  browser: CompassBrowser,
  comboboxInputSelector: string,
  comboboxListSelector: string,
  comboboxValue: string
): Promise<void> {
  // Focus combobox
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
  const comboboxListSelectorElement = await browser.$(comboboxListSelector);
  await comboboxListSelectorElement.waitForDisplayed();
  await browser.setValueVisible(comboboxInputSelector, comboboxValue);
  await browser.keys(['Enter']);
  await comboboxListSelectorElement.waitForDisplayed({ reverse: true });
}
