import type { CompassBrowser } from '../compass-browser';

export async function selectOption(
  browser: CompassBrowser,
  // selector must match an element (like a div) that contains the leafygreen
  // select we want to operate on
  selector: string,
  optionText: string
): Promise<void> {
  // click the field's button
  const selectButton = await browser.$(`${selector} button`);
  await selectButton.waitForDisplayed();
  await selectButton.click();

  const controlledMenuId: string = await selectButton.getAttribute(
    'aria-controls'
  );
  // wait for the list to pop up
  const selectList = await browser.$(
    `[id="${controlledMenuId}"][role="listbox"]`
  );
  await selectList.waitForDisplayed();

  // click the option
  const optionSpan = await selectList.$(`span=${optionText}`);
  await optionSpan.scrollIntoView();
  await optionSpan.click();

  // wait for the list to go away again
  await selectList.waitForDisplayed({ reverse: true });
}
