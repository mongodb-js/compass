import type { CompassBrowser } from '../compass-browser.ts';

export async function setComboBoxValue(
  browser: CompassBrowser,
  comboboxInputSelector: string,
  comboboxValue: string
): Promise<void> {
  // Focus combobox
  await browser.clickVisible(comboboxInputSelector);
  await browser.waitUntil(async () => {
    const isFocused = await browser.$(comboboxInputSelector).isFocused();
    if (isFocused === true) {
      return true;
    } else {
      // try to click again
      await browser.clickVisible(comboboxInputSelector);
      return false;
    }
  });
  const controlledMenuId = await browser
    .$(comboboxInputSelector)
    .getAttribute('aria-controls');
  if (!controlledMenuId) {
    throw new Error(
      'Expected input element of the combobox to have an aria-controls attribute'
    );
  }
  const comboboxListSelector = `[id="${controlledMenuId}"][role="listbox"]`;
  await browser.$(comboboxListSelector).waitForDisplayed();
  await browser.setValueVisible(comboboxInputSelector, comboboxValue, {
    skipFocus: true,
  });
  await browser.clickVisible(
    `li[aria-label="${comboboxValue}"],li[aria-label='Field: "${comboboxValue}"']`
  );
  await browser.$(comboboxListSelector).waitForDisplayed({ reverse: true });
}
