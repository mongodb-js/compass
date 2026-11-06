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
      await browser.$(comboboxInputSelector).click();
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
  const listboxSelector = `[id="${controlledMenuId}"][role="listbox"]`;
  await browser.$(listboxSelector).waitForDisplayed();
  await browser.setValueVisible(comboboxInputSelector, comboboxValue, {
    skipFocus: true,
  });
  const listElementSelector = `li[aria-label="${comboboxValue}"],li[aria-label='Field: "${comboboxValue}"']`;
  await browser.$(listElementSelector).waitForDisplayed();
  // Something about leafygreen Combobox makes the real webdriver driven click
  // to fail very often in chrome, so we fallback to simulating clicks with
  // javascript
  await browser.execute(function jsClick(selector) {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) {
      throw new Error(`Can not find element ${selector} to click`);
    }
    el.click();
  }, listElementSelector);
  await browser.$(listboxSelector).waitForDisplayed({ reverse: true });
}
