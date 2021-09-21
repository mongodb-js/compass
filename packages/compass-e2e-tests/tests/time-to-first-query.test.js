// @ts-check
const { expect } = require('chai');
const { beforeTests, afterTests, afterTest } = require('../helpers/compass');
const Selectors = require('../helpers/selectors');

describe('Time to first query', function () {
  this.timeout(1000 * 60 * 1);

  let keychain;
  let compass;

  it('can open compass, connect to a database and run a query on a collection', async function () {
    // start compass inside the test so that the time is measured together
    ({ keychain, compass } = await beforeTests());

    const { client } = compass;

    await client.connectWithConnectionString('mongodb://localhost:27018/test');

    await client.navigateToCollectionTab('test', 'numbers', 'Documents');

    // search for the document with id == 42 and wait for just one result to appear
    // NOTE: .ace_comment will only exist if it is empty, so this isn't perfectly idempotent
    const aceCommentElement = await client.$('.ace_comment');
    await aceCommentElement.click();
    await client.keys('{ i: 42 }');
    const filterButtonElement = await client.$(
      Selectors.QueryBarApplyFilterButton
    );
    await filterButtonElement.click();
    await client.waitUntil(async () => {
      // we start off with 20 results (assuming no filter) and we expect to
      // have just one once the filter finishes
      const result = await client.$$('.document-list .document');
      return result.length === 1;
    });

    const documentElementValue = await client.$(
      '.document-list .document .element-value-is-int32'
    );
    const text = await documentElementValue.getText();
    expect(text).to.equal('42');
  });

  // eslint-disable-next-line mocha/no-hooks-for-single-case
  after(async function () {
    // cleanup outside of the test so that the time it takes to run does not
    // get added to the time it took to run the first query
    if (keychain && compass) {
      // even though this is after (not afterEach) currentTest points to the last test
      await afterTest(compass, this.currentTest);
      await afterTests({ keychain, compass });
    }
  });
});
