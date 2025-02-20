import chai from 'chai';
const { expect } = chai;

import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function getFirstListDocument(browser: CompassBrowser) {
  // We check the total from the header area so it is probably good enough to
  // just check the first document on screen to make sure the included fields
  // and their values are what we expected.

  const fieldNames = await browser
    .$$(Selectors.documentListDocumentKey(1))
    .map((el) => el.getText());

  const fieldValues = await browser
    .$$(Selectors.documentListDocumentValue(1))
    .map((el) => el.getText());

  expect(fieldValues).to.have.lengthOf(fieldNames.length);

  return Object.fromEntries(fieldNames.map((k, i) => [k, fieldValues[i]]));
}
