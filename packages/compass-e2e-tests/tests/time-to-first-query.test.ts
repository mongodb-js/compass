import { expect } from 'chai';
import {
  init,
  cleanup,
  screenshotIfFailed,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
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
      await screenshotIfFailed(compass, this.currentTest);
      await cleanup(compass);
      compass = undefined;
    }
  });

  it('can open compass, connect to a database and run a query on a collection (never seen welcome)', async function () {
    // Starting the application with the webdriver.io fails on the first run
    // sometimes due to devtools / selenium server failing to start in time.
    // While the root cause is unknown, it usually passes just fine on a re-run
    // or next application start, so we are just retrying the test here to
    // work around the flake.
    //
    // We re-run the whole test to make sure that the timings for the test run
    // are not skewed by waiting for the application to restart multiple times.
    this.retries(5);

    // start compass inside the test so that the time is measured together
    compass = await init(this.test?.fullTitle(), { firstRun: true });

    const { browser } = compass;

    await browser.connectWithConnectionString();

    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'numbers',
      'Documents'
    );

    await browser.runFindOperation('Documents', '{ i: 42 }');

    const documentElementValue = browser.$(
      '[data-testid="document-list"] [data-testid="editable-document"] .element-value-is-int32'
    );
    const text = await documentElementValue.getText();
    expect(text).to.equal('42');
  });

  it('can open compass, connect to a database and run a query on a collection (second run onwards)', async function () {
    // start compass inside the test so that the time is measured together

    compass = await init(this.test?.fullTitle(), { firstRun: false });

    const { browser } = compass;

    await browser.connectWithConnectionString();

    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'numbers',
      'Documents'
    );

    await browser.runFindOperation('Documents', '{ i: 42 }');

    const documentElementValue = browser.$(
      '[data-testid="document-list"] [data-testid="editable-document"] .element-value-is-int32'
    );
    const text = await documentElementValue.getText();
    expect(text).to.equal('42');
  });
});
