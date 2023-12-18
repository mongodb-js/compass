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
    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

    // Set a query that we'll use.
    await browser.runFindOperation('Documents', '{ i: 5 }');

    // Open the modal.
    await browser.clickVisible(Selectors.OpenBulkDeleteButton);
    await browser.$(Selectors.BulkDeleteModal).waitForDisplayed();

    // Check the telemetry
    const openedEvent = await telemetryEntry('Bulk Delete Opened');
    expect(openedEvent).to.deep.equal({});

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

    // Check the telemetry
    const executedEvent = await telemetryEntry('Bulk Delete Executed');
    expect(executedEvent).to.deep.equal({});

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

  it('can export a delete query', async function () {
    if (process.env.COMPASS_E2E_DISABLE_CLIPBOARD_USAGE === 'true') {
      this.skip();
    }

    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

    // Set a query that we'll use.
    await browser.runFindOperation('Documents', '{ i: 5 }');

    // Open the modal.
    await browser.clickVisible(Selectors.OpenBulkDeleteButton);
    await browser.$(Selectors.BulkDeleteModal).waitForDisplayed();

    // Click the export button
    await browser.clickVisible(Selectors.BulkDeleteModalExportButton);

    const openedEvent = await telemetryEntry('Delete Export Opened');
    expect(openedEvent).to.deep.equal({});

    const text = await browser.exportToLanguage('Python', {
      includeImportStatements: true,
      includeDriverSyntax: true,
      useBuilders: false,
    });
    expect(text).to.equal(`from pymongo import MongoClient

# Requires the PyMongo package.
# https://api.mongodb.com/python/current

client = MongoClient('mongodb://localhost:27091/test')
filter={
    'i': 5
}

result = client['test']['numbers'].delete_many(
  filter=filter
)`);

    const exportedEvent = await telemetryEntry('Delete Exported');
    expect(exportedEvent).to.deep.equal({
      language: 'python',
      with_builders: false,
      with_drivers_syntax: true,
      with_import_statements: true,
    });
  });
});
