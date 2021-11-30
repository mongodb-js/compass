// @ts-check
const { beforeTests, afterTests, afterTest } = require('../helpers/compass');
const Selectors = require('../helpers/selectors');

describe('Time to first query', function () {
  let compass;

  it('can open compass, connect to a database and run a query on a collection', async function () {
    // start compass inside the test so that the time is measured together
    compass = await beforeTests();

    const page = await compass.firstWindow();

    //try {
    // TODO: move this somewhere we can reuse
    const connectButton = page.locator(Selectors.ConnectButton);
    const tourModal = page.locator(Selectors.FeatureTourModal);
    const privacyModal = page.locator(Selectors.PrivacySettingsModal);
    await Promise.race([
      (async () => {
        await tourModal.waitFor();

        const closeTourModal = page.locator(Selectors.CloseFeatureTourModal);
        await closeTourModal.click();

        await privacyModal.waitFor();

        const closePrivacyModal = page.locator(
          Selectors.ClosePrivacySettingsButton
        );
        await closePrivacyModal.click();

        await connectButton.waitFor();
      })(),
      // if the tour modal and/or privacy modal never pops up, then the
      // connect screen becomes interactive first
      (async () => {
        await connectButton.waitFor();
        await tourModal.waitFor({ state: 'hidden' });
        await privacyModal.waitFor({ state: 'hidden' });
      })(),
    ]);

    // TODO: connect

    // TODO: navigate to 'test', 'numbers', 'Documents'
    // TODO: search, check,

    //} finally {
    //  await page.screenshot({path: 'screenshot.png'});
    //}
    /*
    const { client } = compass;

    await client.connectWithConnectionString('mongodb://localhost:27018/test');

    await client.navigateToCollectionTab('test', 'numbers', 'Documents');

    // search for the document with id == 42 and wait for just one result to appear
    const aceCommentElement = await client.$(
      '#query-bar-option-input-filter .ace_scroller'
    );
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
    */
  });

  // eslint-disable-next-line mocha/no-hooks-for-single-case
  after(async function () {
    // cleanup outside of the test so that the time it takes to run does not
    // get added to the time it took to run the first query
    if (compass) {
      // even though this is after (not afterEach) currentTest points to the last test
      await afterTest(compass, this.currentTest);
      await afterTests(compass);
    }
  });
});
