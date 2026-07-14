import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';
import { isTestingWeb } from '../test-runner-context.ts';
import { expect } from 'chai';

// In compass-web import/export is disabled so we only show
// an insert document button.
export async function openInsertDocumentModal(browser: CompassBrowser) {
  if (isTestingWeb()) {
    await browser.clickVisible(Selectors.InsertDocumentButton);
  } else {
    await browser.clickVisible(Selectors.AddDataButton);
    await browser.clickVisible(Selectors.InsertDocumentOption);
  }
}

export async function tryToInsertDocument(
  browser: CompassBrowser,
  document?: string
) {
  await openInsertDocumentModal(browser);

  // wait for the modal to appear
  await browser.waitForOpenModal(Selectors.InsertDialog);

  if (document) {
    // set the text in the editor
    await browser.setCodemirrorEditorValue(
      Selectors.InsertJSONEditor,
      document
    );
  }

  // confirm
  const insertConfirm = browser.$(Selectors.InsertConfirm);
  // this selector is very brittle, so just make sure it works
  await insertConfirm.waitForDisplayed();
  expect(await insertConfirm.getText()).to.equal('Insert');
  await insertConfirm.waitForEnabled();
  await browser.clickVisible(Selectors.InsertConfirm);
}
