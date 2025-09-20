import type { CompassBrowser } from '../compass-browser';

export async function setMultiComboBoxValue(
  browser: CompassBrowser,
  comboboxSelector: string,
  comboboxInputSelector: string,
  comboboxValues: string[]
): Promise<void> {
  await browser.$(comboboxSelector).waitForDisplayed();

  // Clear existing values.
  const existingDataTypeRemoveButtonSelector = `${comboboxSelector} [data-testid="chip-dismiss-button"]`;

  while (await browser.$(existingDataTypeRemoveButtonSelector).isDisplayed()) {
    await browser.clickVisible(existingDataTypeRemoveButtonSelector);
  }

  // Focus the combobox.
  await browser.clickVisible(comboboxInputSelector);
  const inputElement = browser.$(comboboxInputSelector);
  await browser.waitUntil(async () => {
    const isFocused = await inputElement.isFocused();
    if (isFocused === true) {
      return true;
    } else {
      // Try to click again.
      await inputElement.click();
      return false;
    }
  });

  const controlledMenuId: string = await inputElement.getAttribute(
    'aria-controls'
  );
  const comboboxListSelectorElement = browser.$(
    `[id="${controlledMenuId}"][role="listbox"]`
  );
  await comboboxListSelectorElement.waitForDisplayed();

  for (const value of comboboxValues) {
    await browser.setValueVisible(comboboxInputSelector, value);
    await browser.keys(['Enter']);
  }
  await browser.keys(['Escape']);
  await comboboxListSelectorElement.waitForDisplayed({ reverse: true });
}
