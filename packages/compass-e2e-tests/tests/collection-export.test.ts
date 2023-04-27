import { promises as fs } from 'fs';
import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import {
  beforeTests,
  afterTests,
  afterTest,
  outputFilename,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

async function selectExportFileTypeCSV(browser: CompassBrowser) {
  await browser.clickParent(Selectors.FileTypeCSV);
}

describe.only('Collection export', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  before(async function () {
    telemetry = await startTelemetryServer();
    compass = await beforeTests({
      extraSpawnArgs: ['--useNewExport=true'],
    });
    browser = compass.browser;
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString();
    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
    await telemetry.stop();
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it.only('supports collection to CSV with a query filter with a subset of fields', async function () {
    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

    // Set a query that we'll use.
    await browser.runFindOperation('Documents', '{ i: 5 }');

    // Open the modal.
    await browser.clickVisible(Selectors.ExportCollectionMenuButton);
    await browser.clickVisible(Selectors.ExportCollectionQueryOption);
    const exportModal = await browser.$(Selectors.ExportModal);
    await exportModal.waitForDisplayed();

    // Make sure the query is shown in the modal.
    const exportModalQueryTextElement = await browser.$(
      Selectors.ExportModalCodePreview
    );
    expect(await exportModalQueryTextElement.getText()).to
      .equal(`db.getCollection("numbers").find(
  {i: 5}
)`);

    // Choose to export select fields.
    await browser.clickVisible(Selectors.ExportQuerySelectFieldsOption);
    await browser.clickVisible(Selectors.ExportNextStepButton);

    // Click to export the `i` and `j` fields.
    const iFieldCheckbox = await browser
      .$(Selectors.exportModalExportField('[\\"i\\"]'))
      .parentElement();
    await iFieldCheckbox.waitForExist();
    await iFieldCheckbox.click();
    const jFieldCheckbox = await browser
      .$(Selectors.exportModalExportField('[\\"j\\"]'))
      .parentElement();
    await jFieldCheckbox.waitForExist();
    await jFieldCheckbox.click();

    // Click the checkbox to select all fields.
    // const selectAllFieldsCheckbox = await browser.$(
    //   Selectors.ExportSelectAllFieldsCheckbox
    // );
    // const selectAllFieldsLabel = await selectAllFieldsCheckbox.parentElement();
    // await selectAllFieldsLabel.click();

    await browser.clickVisible(Selectors.ExportNextStepButton);

    expect(await exportModalQueryTextElement.getText()).to
      .equal(`db.getCollection("numbers").find(
  {i: 5},
  {i: true,j: true,_id: false}
)`);

    // Select CSV.
    await selectExportFileTypeCSV(browser);

    await browser.clickVisible(Selectors.ExportModalExportButton);

    const filename = outputFilename('filtered-numbers.csv');
    await browser.setExportFilename(filename, true);

    // Wait for the modal to go away.
    const exportModalElement = await browser.$(Selectors.ExportModal);
    await exportModalElement.waitForDisplayed({
      reverse: true,
    });

    // Wait for the export to finish and close the toast.
    const toastElement = await browser.$(Selectors.ExportToast);
    await toastElement.waitForDisplayed();

    const exportShowFileButtonElement = await browser.$(
      Selectors.ExportToastShowFile
    );
    await exportShowFileButtonElement.waitForDisplayed();
    await browser
      .$(Selectors.closeToastButton(Selectors.ExportToast))
      .waitForDisplayed();
    // TODO: Remove extra close toast wait for displayed here and other.
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ExportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });

    // Clicking the button would open the file in finder/explorer/whatever
    // which is currently not something we can check with webdriver. But we can
    // check that the file exists.

    // Confirm that we exported what we expected to export.
    const text = await fs.readFile(filename, 'utf-8');
    // 'i,j\n5,0'
    const lines = text.split(/\r?\n/);
    expect(lines[0]).to.equal('i,j');
    expect(lines[1]).to.equal('5,0');

    const exportCompletedEvent = await telemetryEntry('Export Completed');
    expect(exportCompletedEvent).to.deep.equal({
      all_docs: false,
      file_type: 'csv',
      field_count: 2,
      field_option: 'select-fields',
      number_of_docs: 1,
      success: true,
      type: 'query',
    });
    expect(telemetry.screens()).to.include('export_modal');
  });

  it.only('supports collection to CSV with a query filter with all fields', async function () {
    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

    // Set a query that we'll use.
    await browser.runFindOperation('Documents', '{ i: 5 }');

    // Open the modal.
    await browser.clickVisible(Selectors.ExportCollectionMenuButton);
    await browser.clickVisible(Selectors.ExportCollectionQueryOption);
    const exportModal = await browser.$(Selectors.ExportModal);
    await exportModal.waitForDisplayed();

    const exportModalQueryTextElement = await browser.$(
      Selectors.ExportModalCodePreview
    );
    expect(await exportModalQueryTextElement.getText()).to
      .equal(`db.getCollection("numbers").find(
  {i: 5}
)`);

    // Select export all fields.
    await browser.clickVisible(Selectors.ExportQueryAllFieldsOption);
    await browser.clickVisible(Selectors.ExportNextStepButton);

    // Make sure the query is shown in the modal.
    expect(await exportModalQueryTextElement.getText()).to
      .equal(`db.getCollection("numbers").find(
  {i: 5}
)`);

    // Select export CSV.
    await selectExportFileTypeCSV(browser);
    await browser.clickVisible(Selectors.ExportModalExportButton);
    const filename = outputFilename('all-fields-numbers.csv');
    await browser.setExportFilename(filename, true);

    // Wait for the modal to go away.
    const exportModalElement = await browser.$(Selectors.ExportModal);
    await exportModalElement.waitForDisplayed({
      reverse: true,
    });

    // Wait for the export to finish and close the toast.
    const toastElement = await browser.$(Selectors.ExportToast);
    await toastElement.waitForDisplayed();
    const exportShowFileButtonElement = await browser.$(
      Selectors.ExportToastShowFile
    );
    await exportShowFileButtonElement.waitForDisplayed();
    await browser
      .$(Selectors.closeToastButton(Selectors.ExportToast))
      .waitForDisplayed();
    // TODO: Remove extra close toast wait for displayed here and other.
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ExportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });

    // Confirm that we exported what we expected to export.
    const text = await fs.readFile(filename, 'utf-8');
    //  example:'_id,i\n6154788cc5f1fd4544fcedb1,5'
    const lines = text.split(/\r?\n/);
    expect(lines[0]).to.equal('_id,i,j');
    const fields = lines[1].split(',');
    // First field is an auto generated _id, so always different.
    expect(fields[1]).to.equal('5');

    const exportCompletedEvent = await telemetryEntry('Export Completed');
    expect(exportCompletedEvent).to.deep.equal({
      all_docs: false,
      file_type: 'csv',
      field_option: 'all-fields',
      number_of_docs: 1,
      success: true,
      type: 'query',
    });
    expect(telemetry.screens()).to.include('export_modal');
  });

  it.only('supports full collection to CSV', async function () {
    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

    // Set a query that we ignore.
    await browser.runFindOperation('Documents', '{ i: 5 }');

    // Open the modal.
    await browser.clickVisible(Selectors.ExportCollectionMenuButton);
    await browser.clickVisible(Selectors.ExportCollectionFullCollectionOption);
    const exportModal = await browser.$(Selectors.ExportModal);
    await exportModal.waitForDisplayed();

    // Export the entire collection.
    await selectExportFileTypeCSV(browser);
    await browser.clickVisible(Selectors.ExportModalExportButton);

    const filename = outputFilename('full-collection.csv');
    await browser.setExportFilename(filename, true);

    // Wait for the modal to go away.
    const exportModalElement = await browser.$(Selectors.ExportModal);
    await exportModalElement.waitForDisplayed({
      reverse: true,
    });

    // Wait for the export to finish and close the toast.
    const toastElement = await browser.$(Selectors.ExportToast);
    await toastElement.waitForDisplayed();
    const exportShowFileButtonElement = await browser.$(
      Selectors.ExportToastShowFile
    );
    await exportShowFileButtonElement.waitForDisplayed();
    // TODO: Remove extra close toast wait for displayed here and other.
    await browser
      .$(Selectors.closeToastButton(Selectors.ExportToast))
      .waitForDisplayed();
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ExportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });

    // Make sure we exported what we expected to export.
    const text = await fs.readFile(filename, 'utf-8');
    // Example:'i\n6154788cc5f1fd4544fcedb1,5,0'.
    const lines = text.split(/\r?\n/);
    expect(lines[0]).to.equal('_id,i,j');
    for (let i = 1; i <= 1000; ++i) {
      const fields = lines[i].split(',');
      expect(fields[1]).to.equal((i - 1).toString());
    }

    const exportCompletedEvent = await telemetryEntry('Export Completed');
    expect(exportCompletedEvent).to.deep.equal({
      all_docs: true,
      file_type: 'csv',
      number_of_docs: 1000,
      success: true,
      type: 'query',
    });
    expect(telemetry.screens()).to.include('export_modal');
  });

  it('supports collection to JSON with a query filter with a subset of fields', async function () {
    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

    // set a query that we'll use
    await browser.runFindOperation('Documents', '{ i: 5 }');

    // open the modal
    await browser.clickVisible(Selectors.ExportCollectionButton);
    const exportModal = await browser.$(Selectors.ExportModal);
    await exportModal.waitForDisplayed();

    // make sure the query is shown in the modal
    const exportModalQueryTextElement = await browser.$(
      Selectors.ExportModalCodePreview
    );
    expect(await exportModalQueryTextElement.getText()).to
      .equal(`db.numbers.find(
  {i: 5}
)`);

    // go with the default option (Export query with filters)
    await browser.clickVisible(Selectors.ExportModalSelectFieldsButton);

    // don't change any field selections for now and export all of them
    await browser.clickVisible(Selectors.ExportModalSelectOutputButton);

    // leave the file type on the default (JSON)
    const filename = outputFilename('filtered-numbers.json');
    await browser.setExportFilename(filename);
    await browser.clickVisible(Selectors.ExportModalExportButton);

    // wait for it to finish
    const exportModalShowFileButtonElement = await browser.$(
      Selectors.ExportModalShowFileButton
    );
    await exportModalShowFileButtonElement.waitForDisplayed();

    // clicking the button would open the file in finder/explorer/whatever
    // which is probably not something we can check with webdriver. But we can
    // check that the file exists.

    // close the modal and wait for it to go away
    await browser.clickVisible(Selectors.ExportModalCloseButton);
    const exportModalElement = await browser.$(Selectors.ExportModal);
    await exportModalElement.waitForDisplayed({
      reverse: true,
    });

    // confirm that we exported what we expected to export
    const text = await fs.readFile(filename, 'utf-8');
    const data = JSON.parse(text);
    expect(data).to.have.lengthOf(1);
    // _id is different every time
    expect(data[0]).to.have.keys('_id', 'i', 'j');
    expect(data[0].i).to.equal(5);

    const exportCompletedEvent = await telemetryEntry('Export Completed');
    expect(exportCompletedEvent).to.deep.equal({
      all_docs: false,
      file_type: 'json',
      all_fields: true,
      number_of_docs: 1,
      success: true,
      type: 'query',
    });
    expect(telemetry.screens()).to.include('export_modal');
  });

  it('supports collection to JSON with a query with all fields', async function () {
    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

    // we're not going to use this query, but we're running it so we can make
    // sure it gets ignored
    await browser.runFindOperation('Documents', '{ i: 5 }');
    await browser.clickVisible(Selectors.ExportCollectionButton);

    // open the modal
    const exportModal = await browser.$(Selectors.ExportModal);
    await exportModal.waitForDisplayed();

    // make sure the filter query is shown
    const exportModalQueryTextElement = await browser.$(
      Selectors.ExportModalCodePreview
    );
    expect(await exportModalQueryTextElement.getText()).to
      .equal(`db.numbers.find(
  {i: 5}
)`);

    // export the entire collection
    const fullCollectionRadio = await browser
      .$(Selectors.ExportModalFullCollectionOption)
      .parentElement();
    await fullCollectionRadio.waitForExist();
    await fullCollectionRadio.click();
    await browser.clickVisible(Selectors.ExportModalSelectFieldsButton);

    // export all fields
    await browser.clickVisible(Selectors.ExportModalSelectOutputButton);

    // go with the default file type (JSON)
    const filename = outputFilename('all-numbers.json');
    await browser.setExportFilename(filename);
    await browser.clickVisible(Selectors.ExportModalExportButton);

    // wait for it to finish, then close the modal
    const exportModalShowFileButtonElement = await browser.$(
      Selectors.ExportModalShowFileButton
    );
    await exportModalShowFileButtonElement.waitForDisplayed();
    await browser.clickVisible(Selectors.ExportModalCloseButton);

    // the modal should go away
    const exportModalElement = await browser.$(Selectors.ExportModal);
    await exportModalElement.waitForDisplayed({
      reverse: true,
    });

    // confirm that we exported what we expected to
    const text = await fs.readFile(filename, 'utf-8');
    const data = JSON.parse(text);
    expect(data).to.have.lengthOf(1000);
    for (let i = 0; i < 1000; ++i) {
      expect(data[i]).to.have.keys('_id', 'i', 'j');
      expect(data[i].i).to.equal(i);
    }

    const exportCompletedEvent = await telemetryEntry('Export Completed');
    expect(exportCompletedEvent).to.deep.equal({
      all_docs: true,
      file_type: 'json',
      all_fields: true,
      number_of_docs: 1000,
      success: true,
      type: 'query',
    });
    expect(telemetry.screens()).to.include('export_modal');
  });

  it('supports full collection to JSON', async function () {
    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

    await browser.clickVisible(Selectors.ExportCollectionButton);

    // open the modal
    const exportModal = await browser.$(Selectors.ExportModal);
    await exportModal.waitForDisplayed();

    // export the entire collection
    const fullCollectionRadio = await browser
      .$(Selectors.ExportModalFullCollectionOption)
      .parentElement();
    await fullCollectionRadio.waitForExist();
    await fullCollectionRadio.click();
    await browser.clickVisible(Selectors.ExportModalSelectFieldsButton);

    // de-select _id to just export the i field
    const idFieldCheckbox = await browser
      .$(Selectors.exportModalExportField('_id'))
      .parentElement();
    await idFieldCheckbox.waitForExist();
    await idFieldCheckbox.click();
    const jFieldCheckbox = await browser
      .$(Selectors.exportModalExportField('j'))
      .parentElement();
    await jFieldCheckbox.waitForExist();
    await jFieldCheckbox.click();
    await browser.clickVisible(Selectors.ExportModalSelectOutputButton);

    // go with the default file type (JSON)
    const filename = outputFilename('numbers-only.json');
    await browser.setExportFilename(filename);
    await browser.clickVisible(Selectors.ExportModalExportButton);

    // wait for it to finish
    const exportModalShowFileButtonElement = await browser.$(
      Selectors.ExportModalShowFileButton
    );
    await exportModalShowFileButtonElement.waitForDisplayed();

    // close the modal and wait for it to go away
    await browser.clickVisible(Selectors.ExportModalCloseButton);
    const exportModalElement = await browser.$(Selectors.ExportModal);
    await exportModalElement.waitForDisplayed({
      reverse: true,
    });

    // make sure we exported what we expected to export
    const text = await fs.readFile(filename, 'utf-8');
    const data = JSON.parse(text);
    expect(data).to.have.lengthOf(1000);
    for (let i = 0; i < 1000; ++i) {
      expect(data[i]).to.have.keys('i');
      expect(data[i].i).to.equal(i);
    }

    const exportCompletedEvent = await telemetryEntry('Export Completed');
    expect(exportCompletedEvent).to.deep.equal({
      all_docs: true,
      file_type: 'json',
      all_fields: false,
      number_of_docs: 1000,
      success: true,
      type: 'query',
    });
    expect(telemetry.screens()).to.include('export_modal');
  });

  // TODO: Is export aggregation output tracked somewhere?

  // TODO: Abort in progress.
  // TODO: Abort when disconnecting.
  // TODO: Export with collation + sort + limit + skip.
  // TODO: Export with projection.
});
