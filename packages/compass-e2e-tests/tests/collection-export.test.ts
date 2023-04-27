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

describe('Collection export', function () {
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

  it('supports collection to CSV with a query filter with a subset of fields', async function () {
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

  it('supports collection to CSV with a query filter with all fields', async function () {
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
    const filename = outputFilename('all-fields-filtered.csv');
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

  it('supports full collection to CSV', async function () {
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

    await browser.clickVisible(Selectors.ExportNextStepButton);

    expect(await exportModalQueryTextElement.getText()).to
      .equal(`db.getCollection("numbers").find(
  {i: 5},
  {i: true,j: true,_id: false}
)`);

    // Leave the file type on the default (JSON).
    await browser.clickVisible(Selectors.ExportModalExportButton);
    const filename = outputFilename('filtered-numbers.json');
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
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ExportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });

    // Clicking the button would open the file in finder/explorer/whatever
    // which is currently not something we can check with webdriver. But we can
    // check that the file exists.

    // Confirm that we exported what we expected to export.
    const text = await fs.readFile(filename, 'utf-8');
    const data = JSON.parse(text);
    expect(data).to.have.lengthOf(1);
    expect(Object.keys(data[0])).to.deep.equal(['i', 'j']);
    expect(data[0].i).to.equal(5);

    const exportCompletedEvent = await telemetryEntry('Export Completed');
    expect(exportCompletedEvent).to.deep.equal({
      all_docs: false,
      file_type: 'json',
      field_count: 2,
      field_option: 'select-fields',
      number_of_docs: 1,
      success: true,
      type: 'query',
    });
    expect(telemetry.screens()).to.include('export_modal');
  });

  it('supports collection to JSON with a query with all fields', async function () {
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

    // Go with the default file type (JSON).
    await browser.clickVisible(Selectors.ExportModalExportButton);

    const filename = outputFilename('all-fields-filtered.json');
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
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ExportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });

    // Confirm that we exported what we expected to export.
    const text = await fs.readFile(filename, 'utf-8');
    const data = JSON.parse(text);
    expect(data).to.have.lengthOf(1);
    expect(data[0]).to.have.all.keys('i', 'j', '_id');
    expect(data[0].i).to.equal(5);

    const exportCompletedEvent = await telemetryEntry('Export Completed');
    expect(exportCompletedEvent).to.deep.equal({
      all_docs: false,
      file_type: 'json',
      field_option: 'all-fields',
      number_of_docs: 1,
      success: true,
      type: 'query',
    });
    expect(telemetry.screens()).to.include('export_modal');
  });

  it('supports full collection to JSON', async function () {
    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

    // Set a query that we ignore.
    await browser.runFindOperation('Documents', '{ i: 5 }');

    // Open the modal.
    await browser.clickVisible(Selectors.ExportCollectionMenuButton);
    await browser.clickVisible(Selectors.ExportCollectionFullCollectionOption);
    const exportModal = await browser.$(Selectors.ExportModal);
    await exportModal.waitForDisplayed();

    await browser.clickVisible(Selectors.ExportModalExportButton);

    // Go with the default file type (JSON).
    const filename = outputFilename('full-collection.json');
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
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ExportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });

    // Make sure we exported what we expected to export.
    const text = await fs.readFile(filename, 'utf-8');
    const data = JSON.parse(text);
    expect(data).to.have.lengthOf(1000);
    for (let i = 0; i < 1000; ++i) {
      expect(data[i]).to.have.all.keys('i', 'j', '_id');
      expect(data[i].i).to.equal(i);
    }

    const exportCompletedEvent = await telemetryEntry('Export Completed');
    expect(exportCompletedEvent).to.deep.equal({
      all_docs: true,
      file_type: 'json',
      number_of_docs: 1000,
      success: true,
      type: 'query',
    });
    expect(telemetry.screens()).to.include('export_modal');
  });

  // TODO(COMPASS-6731): Add tests for:
  // - Export aggregation with new modal.
  // - Abort in progress.
  // - Abort when disconnecting.
  // - Export with collation + sort + limit + skip.
  // - Export with projection.
});
