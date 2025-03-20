import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function setValidationWithinValidationTab(
  browser: CompassBrowser,
  value: string
): Promise<void> {
  // enter edit mode if not already entered
  const enableEditBtn = browser.$(Selectors.EnableEditValidationButton);
  if (await enableEditBtn.isExisting()) {
    await browser.clickVisible(enableEditBtn);
  }

  // change value
  await browser.setCodemirrorEditorValue(Selectors.ValidationEditor, value);

  // it should eventually detect that the text changed
  const validationActionMessageElement = browser.$(
    Selectors.ValidationActionMessage
  );
  await validationActionMessageElement.waitForDisplayed();

  await browser.clickVisible(Selectors.UpdateValidationButton);

  // Confirm in the confirmation modal.
  await browser.clickVisible(Selectors.confirmationModalConfirmButton());

  // Close toast.
  await browser.clickVisible(
    Selectors.closeToastButton(Selectors.ValidationSuccessToast)
  );

  // both buttons should become hidden if it succeeds
  await validationActionMessageElement.waitForDisplayed({
    reverse: true,
  });

  const updateValidationButtonElement = browser.$(
    Selectors.UpdateValidationButton
  );
  await updateValidationButtonElement.waitForDisplayed({
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
  await browser.clickVisible(Selectors.AddRuleButton);
  const element = browser.$(Selectors.ValidationEditor);
  await element.waitForDisplayed();
  await browser.setValidationWithinValidationTab(validator);
}
