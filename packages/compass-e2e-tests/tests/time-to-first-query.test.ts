import { expect } from 'chai';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

describe('Time to first query', function () {
  let compass: Compass | undefined;

  afterEach(async function () {
    // cleanup outside of the test so that the time it takes to run does not
    // get added to the time it took to run the first query
    if (compass) {
      // even though this is after (not afterEach) currentTest points to the last test
      await afterTest(compass, this.currentTest);
      await afterTests(compass);
      compass = undefined;
    }
  });

  it('can open compass, connect to a database and run a query on a collection (first run)', async function () {
    // start compass inside the test so that the time is measured together
    compass = await beforeTests({ firstRun: true });

    const { browser } = compass;

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');

    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');

    // search for the document with id == 42 and wait for just one result to appear
    const aceCommentElement = await browser.$(
      '#query-bar-option-input-filter .ace_scroller'
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

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');

    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');

    // search for the document with id == 42 and wait for just one result to appear
    const aceCommentElement = await browser.$(
      '#query-bar-option-input-filter .ace_scroller'
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
