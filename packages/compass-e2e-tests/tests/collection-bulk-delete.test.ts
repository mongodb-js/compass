import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

describe('Bulk Delete', () => {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  before(async function () {
    telemetry = await startTelemetryServer();
    compass = await beforeTests({
      extraSpawnArgs: ['--enableBulkDeleteOperations'],
    });
    browser = compass.browser;
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
    await telemetry.stop();
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString();
    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('deletes documents matching a filter', async function () {
    //const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

    // Set a query that we'll use.
    await browser.runFindOperation('Documents', '{ i: 5 }');

    // Open the modal.
    await browser.clickVisible(Selectors.OpenBulkDeleteButton);
    await browser.$(Selectors.BulkDeleteModal).waitForDisplayed();

    // Make sure the query is shown in the modal.
    expect(
      await browser.$(Selectors.BulkDeleteModalReadonlyFilter).getText()
    ).to.equal('{ i: 5 }');

    // Check that it will update the expected number of documents
    expect(await browser.$(Selectors.BulkDeleteModalTitle).getText()).to.equal(
      'Delete 1 document'
    );

    expect(
      await browser.$(Selectors.BulkDeleteModalDeleteButton).getText()
    ).to.equal('Delete 1 document');

    // Press delete
    await browser.clickVisible(Selectors.BulkDeleteModalDeleteButton);

    // The modal should go away
    await browser
      .$(Selectors.BulkDeleteModal)
      .waitForDisplayed({ reverse: true });

    // Press delete in the confirmation modal
    await browser.clickVisible(Selectors.ConfirmationModalConfirmButton());
    await browser.runFindOperation('Documents', '{ i: 5 }');

    // The success toast is displayed
    await browser.$(Selectors.BulkDeleteSuccessToast).waitForDisplayed();

    const toastText = await browser
      .$(Selectors.BulkDeleteSuccessToast)
      .getText();

    expect(toastText).to.contain('1 document has been deleted.');
    // We close the toast
    await browser.$(Selectors.BulkDeleteSuccessToastDismissButton).click();

    await browser
      .$(Selectors.BulkDeleteSuccessToast)
      .waitForDisplayed({ reverse: true });

    // the document is deleted
    expect(
      await browser.$(Selectors.DocumentListActionBarMessage).getText()
    ).to.equal('0 – 0 of 0');
  });

  it('does not delete documents when cancelled', async function () {
    //const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

    // Set a query that we'll use.
    await browser.runFindOperation('Documents', '{ i: 5 }');

    // Open the modal.
    await browser.clickVisible(Selectors.OpenBulkDeleteButton);
    await browser.$(Selectors.BulkDeleteModal).waitForDisplayed();

    // Check that it will update the expected number of documents
    expect(await browser.$(Selectors.BulkDeleteModalTitle).getText()).to.equal(
      'Delete 1 document'
    );

    expect(
      await browser.$(Selectors.BulkDeleteModalDeleteButton).getText()
    ).to.equal('Delete 1 document');

    // Press delete
    await browser.clickVisible(Selectors.BulkDeleteModalDeleteButton);

    // The modal should go away
    await browser
      .$(Selectors.BulkDeleteModal)
      .waitForDisplayed({ reverse: true });

    // Press cancel in the confirmation modal
    await browser.clickVisible(Selectors.ConfirmationModalCancelButton());

    await browser.runFindOperation('Documents', '{ i: 5 }');

    // the document is not deleted
    expect(
      await browser.$(Selectors.DocumentListActionBarMessage).getText()
    ).to.equal('1 – 1 of 1');
  });
});
