import type { CompassBrowser } from '../compass-browser';

export async function setComboBoxValue(
  browser: CompassBrowser,
  comboboxInputSelector: string,
  comboboxValue: string
): Promise<void> {
  // Focus combobox
  await browser.clickVisible(comboboxInputSelector);
  const inputElement = browser.$(comboboxInputSelector);
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
  const controlledMenuId = await inputElement.getAttribute('aria-controls');
  if (!controlledMenuId) {
    throw new Error(
      'Expected input element of the combobox to have an aria-controls attribute'
    );
  }
  const comboboxListSelectorElement = browser.$(
    `[id="${controlledMenuId}"][role="listbox"]`
  );
  await comboboxListSelectorElement.waitForDisplayed();
  await browser.setValueVisible(comboboxInputSelector, comboboxValue);
  await browser.clickVisible(
    comboboxListSelectorElement.$(
      // Handle existing as well as new values
      `[aria-label="${comboboxValue}"],[aria-label='Field: "${comboboxValue}"']`
    )
  );
  await comboboxListSelectorElement.waitForDisplayed({ reverse: true });
}
