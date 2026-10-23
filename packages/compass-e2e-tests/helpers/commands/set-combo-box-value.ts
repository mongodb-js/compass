import path from 'path';
import type { CompassBrowser } from '../compass-browser.ts';
import { LOG_SCREENSHOTS_PATH } from '../test-runner-paths.ts';

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
  await browser.setValueVisible(comboboxInputSelector, comboboxValue, {
    skipFocus: true,
  });
  const optionElement = comboboxListSelectorElement.$(
    // Handle existing as well as new values
    `[aria-label="${comboboxValue}"],[aria-label='Field: "${comboboxValue}"']`
  );
  try {
    await browser.clickVisible(optionElement);
  } catch (err) {
    await browser.saveScreenshot(
      path.join(LOG_SCREENSHOTS_PATH, `combobox-click-failed-${Date.now()}.png`)
    );
    throw err;
  }
  await comboboxListSelectorElement.waitForDisplayed({ reverse: true });
}
