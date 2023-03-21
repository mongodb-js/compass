import { expect } from 'chai';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import { createNumbersCollection } from '../helpers/insert-data';

describe('Time to first query', function () {
  let compass: Compass | undefined;

  beforeEach(async function () {
    await createNumbersCollection();
  });

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

  it('can open compass, connect to a database and run a query on a collection (never seen welcome)', async function () {
    // start compass inside the test so that the time is measured together
    compass = await beforeTests({ firstRun: true });

    const { browser } = compass;

    await browser.connectWithConnectionString();

    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');

    await browser.runFindOperation('Documents', '{ i: 42 }');

    const documentElementValue = await browser.$(
      '.document-list .document .element-value-is-int32'
    );
    const text = await documentElementValue.getText();
    expect(text).to.equal('42');
  });

  it('can open compass, connect to a database and run a query on a collection (second run onwards)', async function () {
    // start compass inside the test so that the time is measured together

    compass = await beforeTests({ firstRun: false });

    const { browser } = compass;

    await browser.connectWithConnectionString();

    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');

    await browser.runFindOperation('Documents', '{ i: 42 }');

    const documentElementValue = await browser.$(
      '.document-list .document .element-value-is-int32'
    );
    const text = await documentElementValue.getText();
    expect(text).to.equal('42');
  });
});
