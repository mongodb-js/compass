import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

export async function setValidationWithinValidationTab(
  browser: CompassBrowser,
  value: string
): Promise<void> {
  // enter edit mode if not already entered
  if (await browser.$(Selectors.EnableEditValidationButton).isExisting()) {
    await browser.clickVisible(Selectors.EnableEditValidationButton);
  }

  // change value
  await browser.setCodemirrorEditorValue(Selectors.ValidationEditor, value);

  // it should eventually detect that the text changed
  await browser.$(Selectors.ValidationActionMessage).waitForDisplayed();

  await browser.clickVisible(Selectors.UpdateValidationButton);

  // Confirm in the confirmation modal.
  await browser.clickVisible(Selectors.confirmationModalConfirmButton());

  // Close toast.
  await browser.clickVisible(
    Selectors.closeToastButton(Selectors.ValidationSuccessToast)
  );

  // both buttons should become hidden if it succeeds
  await browser.$(Selectors.ValidationActionMessage).waitForDisplayed({
    reverse: true,
  });

  await browser.$(Selectors.UpdateValidationButton).waitForDisplayed({
    reverse: true,
  });

  // wait a bit because the buttons that will update the documents are
  // debounce-rerendered and if we act on them too fast then they will be
  // replaced
  await browser.pause(2000);
}

export async function setValidation(
  browser: CompassBrowser,
  {
    connectionName,
    database,
    collection,
    validator,
  }: {
    connectionName: string;
    database: string;
    collection: string;
    validator: string;
  }
): Promise<void> {
  await browser.navigateToCollectionTab(
    connectionName,
    database,
    collection,
    'Validation'
  );
  const startButton = browser.$(Selectors.AddRuleButton);
  if (await startButton.isExisting()) {
    await browser.clickVisible(startButton);
  }
  const element = browser.$(Selectors.ValidationEditor);
  await element.waitForDisplayed();
  await browser.setValidationWithinValidationTab(validator);
}
