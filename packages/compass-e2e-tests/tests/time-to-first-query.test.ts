import { expect } from 'chai';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

describe('Time to first query', function () {
  let compass: Compass | undefined;

  beforeEach(async function () {
    process.env.COMPASS_SHOW_WELCOME = 'false';
    await createNumbersCollection();
  });

  afterEach(async function () {
    process.env.COMPASS_SHOW_WELCOME = 'false';

    // cleanup outside of the test so that the time it takes to run does not
    // get added to the time it took to run the first query
    if (compass) {
      // even though this is after (not afterEach) currentTest points to the last test
      await afterTest(compass, this.currentTest);
      await afterTests(compass);
      compass = undefined;
    }
  });

  it('can open compass, connect to a database and run a query on a collection (never seen welcome)', async function () {
    // make sure we'll get the welcome modal
    process.env.COMPASS_SHOW_WELCOME = 'true';

    // start compass inside the test so that the time is measured together
    compass = await beforeTests();

    const { browser } = compass;

    await browser.closeWelcomeModal();

    await browser.connectWithConnectionString('mongodb://localhost:27091/test');

    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');

    // search for the document with id == 42 and wait for just one result to appear
    const aceCommentElement = await browser.$(
      '[data-testid="query-bar-option-filter"] .ace_scroller'
    );
    await aceCommentElement.click();

    await browser.keys('{ i: 42 }');
    const filterButtonElement = await browser.$(
      Selectors.queryBarApplyFilterButton('Documents')
    );
    await filterButtonElement.click();
    await browser.waitUntil(async () => {
      // we start off with 20 results (assuming no filter) and we expect to
      // have just one once the filter finishes
      const result = await browser.$$('.document-list .document');
      return result.length === 1;
    });

    const documentElementValue = await browser.$(
      '.document-list .document .element-value-is-int32'
    );
    const text = await documentElementValue.getText();
    expect(text).to.equal('42');
  });

  it('can open compass, connect to a database and run a query on a collection (second run onwards)', async function () {
    // start compass inside the test so that the time is measured together
    compass = await beforeTests();

    const { browser } = compass;

    await browser.connectWithConnectionString('mongodb://localhost:27091/test');

    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');

    // search for the document with id == 42 and wait for just one result to appear
    const aceCommentElement = await browser.$(
      '[data-testid="query-bar-option-filter"] .ace_scroller'
    );
    await aceCommentElement.click();

    await browser.keys('{ i: 42 }');
    const filterButtonElement = await browser.$(
      Selectors.queryBarApplyFilterButton('Documents')
    );
    await filterButtonElement.click();
    await browser.waitUntil(async () => {
      // we start off with 20 results (assuming no filter) and we expect to
      // have just one once the filter finishes
      const result = await browser.$$('.document-list .document');
      return result.length === 1;
    });

    const documentElementValue = await browser.$(
      '.document-list .document .element-value-is-int32'
    );
    const text = await documentElementValue.getText();
    expect(text).to.equal('42');
  });
});
