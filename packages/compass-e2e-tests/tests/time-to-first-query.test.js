// @ts-check
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { beforeTests, afterTests, afterTest, bindCommands } = require('../helpers/compass');
const Selectors = require('../helpers/selectors');

const { expect } = chai;

chai.use(chaiAsPromised);

describe.skip('Time to first query', function () {
  let app;
  let page;
  let commands;

  it('can open compass, connect to a database and run a query on a collection', async function () {
    // start compass inside the test so that the time is measured together
    ({ app, page, commands } = await beforeTests());

    await commands.connectWithConnectionString('mongodb://localhost:27018/test');

    await commands.navigateToCollectionTab('test', 'numbers', 'Documents');

    // search for the document with id == 42 and wait for just one result to appear
    await page.click(
      '#query-bar-option-input-filter .ace_scroller'
    );

    await page.keyboard.type('{ i: 42 }');
    await page.click(
      Selectors.QueryBarApplyFilterButton
    );
    await commands.waitUntil(async () => {
      // we start off with 20 results (assuming no filter) and we expect to
      // have just one once the filter finishes
      const result = await page.$$('.document-list .document');
      return result.length === 1;
    });

    const text = await page.textContent(
      '.document-list .document .element-value-is-int32'
    );
    expect(text).to.equal('42');
  });

  // eslint-disable-next-line mocha/no-hooks-for-single-case
  after(async function () {
    // cleanup outside of the test so that the time it takes to run does not
    // get added to the time it took to run the first query
    if (app) {
      // even though this is after (not afterEach) currentTest points to the last test
      await afterTest(app, page, this.currentTest);
      await afterTests(app, page);
    }
  });
});
