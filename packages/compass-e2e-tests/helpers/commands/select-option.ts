import type { CompassBrowser } from '../compass-browser';

export async function selectOption(
  browser: CompassBrowser,
  // selector must match an element (like a div) that contains the leafygreen
  // select we want to operate on
  selector: string,
  optionText: string
): Promise<void> {
  // click the field's button
  const selectButton = browser.$(`${selector}`);
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
  const optionSpan = selectList.$(`span=${optionText}`);
  await optionSpan.scrollIntoView();
  await optionSpan.click();

  // wait for the list to go away again
  await selectList.waitForDisplayed({ reverse: true });
}
