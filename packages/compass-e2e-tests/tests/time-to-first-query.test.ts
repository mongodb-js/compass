import { expect } from 'chai';
import {
  init,
  cleanup,
  screenshotIfFailed,
  DEFAULT_CONNECTION_NAME_1,
  TEST_COMPASS_WEB,
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

    if (process.platform === 'win32') {
      // TODO(COMPASS-9554) This test is extremely flaky on Windows inside
      // Github Actions (ie. the smoke tests)
      this.skip();
    }

    compass = await init(this.test?.fullTitle(), { firstRun: false });

    const { browser } = compass;

    if (TEST_COMPASS_WEB) {
      await browser.connectWithConnectionString();
    } else {
      await browser.connectByName(DEFAULT_CONNECTION_NAME_1);
    }

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
