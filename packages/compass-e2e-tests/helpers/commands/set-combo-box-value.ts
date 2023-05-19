import type { CompassBrowser } from '../compass-browser';

export async function setComboBoxValue(
  browser: CompassBrowser,
  comboboxInputSelector: string,
  comboboxValue: string
): Promise<void> {
  // Focus combobox
  await browser.clickVisible(comboboxInputSelector);
  const inputElement = await browser.$(comboboxInputSelector);
  await browser.waitUntil(async () => {
    const isFocused = await inputElement.isFocused();
    if (isFocused === true) {
      return true;
    } else {
      // try to click again
      await inputElement.click();
      return false;
    }
  });
  const controlledMenuId: string = await inputElement.getAttribute(
    'aria-controls'
  );
  const comboboxListSelectorElement = await browser.$(
    `[id="${controlledMenuId}"][role="listbox"]`
  );
  await comboboxListSelectorElement.waitForDisplayed();
  await browser.setValueVisible(comboboxInputSelector, comboboxValue);
  await browser.keys(['Enter']);
  await comboboxListSelectorElement.waitForDisplayed({ reverse: true });
}
