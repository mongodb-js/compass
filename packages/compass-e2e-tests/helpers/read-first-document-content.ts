import chai from 'chai';
const { expect } = chai;

import type { CompassBrowser } from '../helpers/compass-browser';
import * as Selectors from '../helpers/selectors';

export async function getFirstListDocument(browser: CompassBrowser) {
  // We check the total from the header area so it is probably good enough to
  // just check the first document on screen to make sure the included fields
  // and their values are what we expected.

  const fieldNameElements = await browser.$$(
    Selectors.documentListDocumentKey(1)
  );
  const fieldNames = await Promise.all(
    fieldNameElements.map((el) => el.getText())
  );

  const fieldValueElements = await browser.$$(
    Selectors.documentListDocumentValue(1)
  );
  const fieldValues = await Promise.all(
    fieldValueElements.map((el) => el.getText())
  );

  expect(fieldValues).to.have.lengthOf(fieldNames.length);

  return Object.fromEntries(fieldNames.map((k, i) => [k, fieldValues[i]]));
}
