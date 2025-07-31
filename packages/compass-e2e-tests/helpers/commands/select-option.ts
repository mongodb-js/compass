import type { ChainablePromiseElement } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';

type SelectOptionOptions = {
  selectSelector: string | ChainablePromiseElement;
} & (
  | {
      optionText: string;
      optionIndex?: never;
    }
  | {
      optionIndex: number;
      optionText?: never;
    }
);

export async function selectOption(
  browser: CompassBrowser,
  { selectSelector, optionText, optionIndex }: SelectOptionOptions
): Promise<void> {
  // click the field's button
  const selectButton = browser.$(selectSelector);
  await selectButton.waitForDisplayed();
  await selectButton.click();

  let controlledMenuId = await selectButton.getAttribute('aria-controls');
  // In leafygreen combobox we usually not immediately targeting the element
  // that controls the listbox, so if we haven't find it, try to look in the
  // element we selected
  if (!controlledMenuId) {
    controlledMenuId = await selectButton
      .$('[aria-controls]')
      .getAttribute('aria-controls');
  }
  // wait for the list to pop up
  const selectList = browser.$(`[id="${controlledMenuId}"][role="listbox"]`);
  await selectList.waitForDisplayed();

  // click the option
  const option = optionText
    ? selectList.$(`span=${optionText}`)
    : selectList.$(`:nth-child(${optionIndex})`);
  await option.scrollIntoView();
  await option.click();

  // wait for the list to go away again
  await selectList.waitForDisplayed({ reverse: true });
}
