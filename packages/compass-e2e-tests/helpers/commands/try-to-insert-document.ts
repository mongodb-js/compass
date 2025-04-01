import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import { expect } from 'chai';

export async function tryToInsertDocument(
  browser: CompassBrowser,
  document?: string
) {
  // browse to the "Insert to Collection" modal
  await browser.clickVisible(Selectors.AddDataButton);
  const insertDocumentOption = browser.$(Selectors.InsertDocumentOption);
  await insertDocumentOption.waitForDisplayed();
  await browser.clickVisible(Selectors.InsertDocumentOption);

  // wait for the modal to appear
  const insertDialog = browser.$(Selectors.InsertDialog);
  await insertDialog.waitForDisplayed();

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
  expect(await insertConfirm.isDisplayed()).to.eq(true);
  expect(await insertConfirm.getText()).to.equal('Insert');
  await insertConfirm.waitForEnabled();
  await browser.clickVisible(Selectors.InsertConfirm);
}
