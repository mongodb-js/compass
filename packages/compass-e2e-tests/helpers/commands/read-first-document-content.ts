import chai from 'chai';
const { expect } = chai;

import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

export async function getFirstListDocument(browser: CompassBrowser) {
  // We check the total from the header area so it is probably good enough to
  // just check the first document on screen to make sure the included fields
  // and their values are what we expected.

  const fieldNames = await browser
    .$$(Selectors.documentListDocumentKey(1))
    .map((el) => el.getText());

  const fieldValues = await browser
    .$$(Selectors.documentListDocumentValue(1))
    .map(async (el) => {
      const text = await el.getText();
      // Date values are rendered together with a hint showing the same date in
      // the user's preferred timezone. That's not part of the value itself.
      const hint = el.$(Selectors.DateWithTimezoneHint);
      if (await hint.isExisting()) {
        return text.replace(await hint.getText(), '').trim();
      }
      return text;
    });

  expect(fieldValues).to.have.lengthOf(fieldNames.length);

  return Object.fromEntries(fieldNames.map((k, i) => [k, fieldValues[i]]));
}
