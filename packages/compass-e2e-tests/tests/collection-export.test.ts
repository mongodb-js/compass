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
import {
  createNumbersCollection,
  createNumbersStringCollection,
} from '../helpers/insert-data';

async function selectExportFileTypeCSV(browser: CompassBrowser) {
  await browser.clickParent(Selectors.FileTypeCSV);
}

async function selectExportFileTypeJSON(browser: CompassBrowser) {
  await browser.clickParent(Selectors.FileTypeJSON);
}

async function toggleExportFieldCheckbox(
  browser: CompassBrowser,
  fieldName: string
) {
  const iFieldCheckbox = await browser
    .$(Selectors.exportModalExportField(`[\\"${fieldName}\\"]`))
    .parentElement();
  await iFieldCheckbox.waitForExist();
  await iFieldCheckbox.click();
}

describe('Collection export', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  before(async function () {
    telemetry = await startTelemetryServer();
    compass = await beforeTests();
    browser = compass.browser;
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
    await telemetry.stop();
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  describe('with the numbers collection', function () {
    beforeEach(async function () {
      await createNumbersCollection();
      await browser.connectWithConnectionString();
      await browser.navigateToCollectionTab('test', 'numbers', 'Documents');
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
      expect(await exportModalQueryTextElement.getText()).to.equal(
        `db.getCollection('numbers').find({ i: 5 });`
      );

      // Choose to export select fields.
      await browser.clickVisible(Selectors.ExportQuerySelectFieldsOption);
      await browser.clickVisible(Selectors.ExportNextStepButton);

      // Click to export the `i` and `j` fields.
      await toggleExportFieldCheckbox(browser, 'i');
      await toggleExportFieldCheckbox(browser, 'j');

      await browser.clickVisible(Selectors.ExportNextStepButton);

      expect(await exportModalQueryTextElement.getText()).to
        .equal(`db.getCollection('numbers').find(
  { i: 5 },
  { i: 1, j: 1, _id: 0 }
);`);

      // Select CSV.
      await selectExportFileTypeCSV(browser);

      await browser.clickVisible(Selectors.ExportModalExportButton);

      const filename = outputFilename('filtered-numbers-subset.csv');
      await browser.setExportFilename(filename);

      // Wait for the modal to go away.
      const exportModalElement = await browser.$(Selectors.ExportModal);
      await exportModalElement.waitForDisplayed({
        reverse: true,
      });

      await browser.waitForExportToFinishAndCloseToast();

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
      delete exportCompletedEvent.duration; // Duration varies.
      expect(exportCompletedEvent).to.deep.equal({
        all_docs: false,
        has_projection: false,
        file_type: 'csv',
        field_count: 2,
        field_option: 'select-fields',
        fields_added_count: 0,
        fields_not_selected_count: 1,
        number_of_docs: 1,
        success: true,
        stopped: false,
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
      expect(await exportModalQueryTextElement.getText()).to.equal(
        `db.getCollection('numbers').find({ i: 5 });`
      );

      // Select export all fields.
      await browser.clickVisible(Selectors.ExportQueryAllFieldsOption);
      await browser.clickVisible(Selectors.ExportNextStepButton);

      // Make sure the query is shown in the modal.
      expect(await exportModalQueryTextElement.getText()).to.equal(
        `db.getCollection('numbers').find({ i: 5 });`
      );

      // Select export CSV.
      await selectExportFileTypeCSV(browser);
      await browser.clickVisible(Selectors.ExportModalExportButton);
      const filename = outputFilename('all-fields-filtered.csv');
      await browser.setExportFilename(filename);

      // Wait for the modal to go away.
      const exportModalElement = await browser.$(Selectors.ExportModal);
      await exportModalElement.waitForDisplayed({
        reverse: true,
      });

      await browser.waitForExportToFinishAndCloseToast();

      // Confirm that we exported what we expected to export.
      const text = await fs.readFile(filename, 'utf-8');
      //  example:'_id,i\n6154788cc5f1fd4544fcedb1,5'
      const lines = text.split(/\r?\n/);
      expect(lines[0]).to.equal('_id,i,j');
      const fields = lines[1].split(',');
      // First field is an auto generated _id, so always different.
      expect(fields[1]).to.equal('5');

      const exportCompletedEvent = await telemetryEntry('Export Completed');
      delete exportCompletedEvent.duration; // Duration varies.
      expect(exportCompletedEvent).to.deep.equal({
        all_docs: false,
        has_projection: false,
        file_type: 'csv',
        field_option: 'all-fields',
        number_of_docs: 1,
        success: true,
        stopped: false,
        type: 'query',
      });
    });

    it('supports collection to CSV with a query filter with projection', async function () {
      const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

      // Set a query that we'll use.
      await browser.runFindOperation('Documents', '{ i: { $gt: 5 } }', {
        project: '{ _id: 0 }',
      });

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
        .equal(`db.getCollection('numbers').find(
  { i: { $gt: 5 } },
  { _id: 0 }
);`);

      // Select CSV.
      await selectExportFileTypeCSV(browser);

      await browser.clickVisible(Selectors.ExportModalExportButton);

      const filename = outputFilename('filtered-numbers-projection.csv');
      await browser.setExportFilename(filename);

      // Wait for the modal to go away.
      const exportModalElement = await browser.$(Selectors.ExportModal);
      await exportModalElement.waitForDisplayed({
        reverse: true,
      });

      await browser.waitForExportToFinishAndCloseToast();

      // Clicking the button would open the file in finder/explorer/whatever
      // which is currently not something we can check with webdriver. But we can
      // check that the file exists.

      // Confirm that we exported what we expected to export.
      const text = await fs.readFile(filename, 'utf-8');
      // 'i,j\n5,0'
      const lines = text.split(/\r?\n/);
      expect(lines.length).to.equal(996);
      expect(lines[0]).to.equal('i,j');
      expect(lines[1]).to.equal('6,0');
      expect(lines[2]).to.equal('7,0');

      const exportCompletedEvent = await telemetryEntry('Export Completed');
      delete exportCompletedEvent.duration; // Duration varies.
      expect(exportCompletedEvent).to.deep.equal({
        all_docs: false,
        has_projection: true,
        file_type: 'csv',
        number_of_docs: 994,
        success: true,
        stopped: false,
        type: 'query',
      });
    });

    it('supports full collection to CSV', async function () {
      const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

      // Set a query that we ignore.
      await browser.runFindOperation('Documents', '{ i: 5 }');

      // Open the modal.
      await browser.clickVisible(Selectors.ExportCollectionMenuButton);
      await browser.clickVisible(
        Selectors.ExportCollectionFullCollectionOption
      );
      const exportModal = await browser.$(Selectors.ExportModal);
      await exportModal.waitForDisplayed();

      // Export the entire collection.
      await selectExportFileTypeCSV(browser);
      await browser.clickVisible(Selectors.ExportModalExportButton);

      const filename = outputFilename('full-collection.csv');
      await browser.setExportFilename(filename);

      // Wait for the modal to go away.
      const exportModalElement = await browser.$(Selectors.ExportModal);
      await exportModalElement.waitForDisplayed({
        reverse: true,
      });

      await browser.waitForExportToFinishAndCloseToast();

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
      delete exportCompletedEvent.duration; // Duration varies.
      expect(exportCompletedEvent).to.deep.equal({
        all_docs: true,
        file_type: 'csv',
        number_of_docs: 1000,
        success: true,
        stopped: false,
        type: 'query',
      });
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
      expect(await exportModalQueryTextElement.getText()).to.equal(
        `db.getCollection('numbers').find({ i: 5 });`
      );

      // Choose to export select fields.
      await browser.clickVisible(Selectors.ExportQuerySelectFieldsOption);
      await browser.clickVisible(Selectors.ExportNextStepButton);

      // Click to export the `i` and `j` fields.
      await toggleExportFieldCheckbox(browser, 'i');
      await toggleExportFieldCheckbox(browser, 'j');

      await browser.clickVisible(Selectors.ExportNextStepButton);

      expect(await exportModalQueryTextElement.getText()).to
        .equal(`db.getCollection('numbers').find(
  { i: 5 },
  { i: 1, j: 1, _id: 0 }
);`);

      // Leave the file type on the default (JSON).
      await browser.clickVisible(Selectors.ExportModalExportButton);
      const filename = outputFilename('filtered-numbers-subset.json');
      await browser.setExportFilename(filename);

      // Wait for the modal to go away.
      const exportModalElement = await browser.$(Selectors.ExportModal);
      await exportModalElement.waitForDisplayed({
        reverse: true,
      });

      await browser.waitForExportToFinishAndCloseToast();

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
      delete exportCompletedEvent.duration; // Duration varies.
      expect(exportCompletedEvent).to.deep.equal({
        all_docs: false,
        file_type: 'json',
        json_format: 'default',
        field_count: 2,
        has_projection: false,
        field_option: 'select-fields',
        number_of_docs: 1,
        fields_added_count: 0,
        fields_not_selected_count: 1,
        success: true,
        stopped: false,
        type: 'query',
      });
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
      expect(await exportModalQueryTextElement.getText()).to.equal(
        `db.getCollection('numbers').find({ i: 5 });`
      );

      // Select export all fields.
      await browser.clickVisible(Selectors.ExportQueryAllFieldsOption);
      await browser.clickVisible(Selectors.ExportNextStepButton);

      // Make sure the query is shown in the modal.
      expect(await exportModalQueryTextElement.getText()).to.equal(
        `db.getCollection('numbers').find({ i: 5 });`
      );

      // Go with the default file type (JSON).
      await browser.clickVisible(Selectors.ExportModalExportButton);

      const filename = outputFilename('all-fields-filtered.json');
      await browser.setExportFilename(filename);

      // Wait for the modal to go away.
      const exportModalElement = await browser.$(Selectors.ExportModal);
      await exportModalElement.waitForDisplayed({
        reverse: true,
      });

      await browser.waitForExportToFinishAndCloseToast();

      // Confirm that we exported what we expected to export.
      const text = await fs.readFile(filename, 'utf-8');
      const data = JSON.parse(text);
      expect(data).to.have.lengthOf(1);
      expect(data[0]).to.have.all.keys('i', 'j', '_id');
      expect(data[0].i).to.equal(5);

      const exportCompletedEvent = await telemetryEntry('Export Completed');
      delete exportCompletedEvent.duration; // Duration varies.
      expect(exportCompletedEvent).to.deep.equal({
        all_docs: false,
        file_type: 'json',
        json_format: 'default',
        field_option: 'all-fields',
        has_projection: false,
        number_of_docs: 1,
        success: true,
        stopped: false,
        type: 'query',
      });
    });

    it('supports full collection to JSON', async function () {
      const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

      // Set a query that we ignore.
      await browser.runFindOperation('Documents', '{ i: 5 }');

      // Open the modal.
      await browser.clickVisible(Selectors.ExportCollectionMenuButton);
      await browser.clickVisible(
        Selectors.ExportCollectionFullCollectionOption
      );
      const exportModal = await browser.$(Selectors.ExportModal);
      await exportModal.waitForDisplayed();

      await browser.clickVisible(Selectors.ExportModalExportButton);

      // Go with the default file type (JSON).
      const filename = outputFilename('full-collection.json');
      await browser.setExportFilename(filename);

      // Wait for the modal to go away.
      const exportModalElement = await browser.$(Selectors.ExportModal);
      await exportModalElement.waitForDisplayed({
        reverse: true,
      });

      await browser.waitForExportToFinishAndCloseToast();

      // Make sure we exported what we expected to export.
      const text = await fs.readFile(filename, 'utf-8');
      const data = JSON.parse(text);
      expect(data).to.have.lengthOf(1000);
      for (let i = 0; i < 1000; ++i) {
        expect(data[i]).to.have.all.keys('i', 'j', '_id');
        expect(data[i].i).to.equal(i);
      }

      const exportCompletedEvent = await telemetryEntry('Export Completed');
      delete exportCompletedEvent.duration; // Duration varies.
      expect(exportCompletedEvent).to.deep.equal({
        all_docs: true,
        file_type: 'json',
        json_format: 'default',
        number_of_docs: 1000,
        success: true,
        stopped: false,
        type: 'query',
      });
    });

    it('supports canonical JSON format', async function () {
      const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

      // Set a query that we ignore.
      await browser.runFindOperation('Documents', '{ i: 5 }');

      // Open the modal.
      await browser.clickVisible(Selectors.ExportCollectionMenuButton);
      await browser.clickVisible(
        Selectors.ExportCollectionFullCollectionOption
      );
      const exportModal = await browser.$(Selectors.ExportModal);
      await exportModal.waitForDisplayed();

      // Set the json format to canonical.
      await browser.clickVisible(Selectors.ExportJSONFormatAccordion);
      await browser.clickParent(Selectors.ExportJSONFormatCanonical);

      await browser.clickVisible(Selectors.ExportModalExportButton);

      // Go with the default file type (JSON).
      const filename = outputFilename('full-collection-canonical.json');
      await browser.setExportFilename(filename);

      // Wait for the modal to go away.
      const exportModalElement = await browser.$(Selectors.ExportModal);
      await exportModalElement.waitForDisplayed({
        reverse: true,
      });

      await browser.waitForExportToFinishAndCloseToast();

      // Make sure we exported what we expected to export.
      const text = await fs.readFile(filename, 'utf-8');
      const data = JSON.parse(text);
      expect(data).to.have.lengthOf(1000);
      for (let i = 0; i < 1000; ++i) {
        expect(data[i]).to.have.all.keys('i', 'j', '_id');
        expect(data[i].i).to.deep.equal({ $numberInt: `${i}` });
      }

      const exportCompletedEvent = await telemetryEntry('Export Completed');
      delete exportCompletedEvent.duration; // Duration varies.
      expect(exportCompletedEvent).to.deep.equal({
        all_docs: true,
        file_type: 'json',
        json_format: 'canonical',
        number_of_docs: 1000,
        success: true,
        stopped: false,
        type: 'query',
      });
    });

    it('can abort an in progress CSV export', async function () {
      const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

      // Set a query that we'll use.
      await browser.runFindOperation(
        'Documents',
        '{ $where: "function() { sleep(100); return true; }" }'
      );

      // Open the modal.
      await browser.clickVisible(Selectors.ExportCollectionMenuButton);
      await browser.clickVisible(Selectors.ExportCollectionQueryOption);
      const exportModal = await browser.$(Selectors.ExportModal);
      await exportModal.waitForDisplayed();

      // Choose to export select fields.
      await browser.clickVisible(Selectors.ExportQuerySelectFieldsOption);
      await browser.clickVisible(Selectors.ExportNextStepButton);

      // Click to export the `i` and `j` fields.
      await toggleExportFieldCheckbox(browser, 'i');
      await toggleExportFieldCheckbox(browser, 'j');

      await browser.clickVisible(Selectors.ExportNextStepButton);

      // Select CSV.
      await selectExportFileTypeCSV(browser);

      await browser.clickVisible(Selectors.ExportModalExportButton);

      const filename = outputFilename('aborted-export-test.csv');
      await browser.setExportFilename(filename);

      // Wait for the modal to go away.
      const exportModalElement = await browser.$(Selectors.ExportModal);
      await exportModalElement.waitForDisplayed({
        reverse: true,
      });

      // Wait for the export to start and then click stop.
      const exportAbortButton = await browser.$(Selectors.ExportToastAbort);
      await exportAbortButton.waitForDisplayed();
      await exportAbortButton.click();

      // Wait for the aborted toast to appear.
      const toastElement = await browser.$(Selectors.ExportToast);
      await toastElement.waitForDisplayed();
      await browser
        .$(Selectors.closeToastButton(Selectors.ExportToast))
        .waitForDisplayed();

      // Check it displays that the export was aborted.
      const toastText = await toastElement.getText();
      try {
        expect(toastText).to.include('Export aborted');
      } catch (err) {
        console.log(toastText);
        throw err;
      }

      // Close the toast.
      await browser
        .$(Selectors.closeToastButton(Selectors.ExportToast))
        .waitForDisplayed();
      await browser.clickVisible(
        Selectors.closeToastButton(Selectors.ExportToast)
      );
      await toastElement.waitForDisplayed({ reverse: true });

      // Confirm that we exported what we expected to export.
      const text = await fs.readFile(filename, 'utf-8');
      const lines = text.split(/\r?\n/);
      expect(lines.length).to.equal(1);
      // We abort before we add the columns to the file.
      expect(lines[0]).to.equal('');

      const exportCompletedEvent = await telemetryEntry('Export Completed');
      delete exportCompletedEvent.duration; // Duration varies.
      expect(exportCompletedEvent).to.deep.equal({
        all_docs: false,
        file_type: 'csv',
        field_count: 2,
        field_option: 'select-fields',
        number_of_docs: 0,
        has_projection: false,
        fields_added_count: 0,
        fields_not_selected_count: 1,
        success: true,
        type: 'query',
        stopped: true,
      });
      expect(telemetry.screens()).to.include('export_modal');
    });

    it('can abort an in progress JSON export', async function () {
      const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

      // Set a query that we'll use.
      await browser.runFindOperation(
        'Documents',
        '{ $where: "function() { sleep(100); return true; }" }'
      );

      // Open the modal.
      await browser.clickVisible(Selectors.ExportCollectionMenuButton);
      await browser.clickVisible(Selectors.ExportCollectionQueryOption);
      const exportModal = await browser.$(Selectors.ExportModal);
      await exportModal.waitForDisplayed();

      // Choose to export select fields.
      await browser.clickVisible(Selectors.ExportQuerySelectFieldsOption);
      await browser.clickVisible(Selectors.ExportNextStepButton);

      // Click to export the `i` and `j` fields.
      await toggleExportFieldCheckbox(browser, 'i');
      await toggleExportFieldCheckbox(browser, 'j');

      await browser.clickVisible(Selectors.ExportNextStepButton);

      // File type defaults to JSON export.
      await browser.clickVisible(Selectors.ExportModalExportButton);

      const filename = outputFilename('aborted-export-test.json');
      await browser.setExportFilename(filename);

      // Wait for the modal to go away.
      const exportModalElement = await browser.$(Selectors.ExportModal);
      await exportModalElement.waitForDisplayed({
        reverse: true,
      });

      // Wait for the export to start and then click stop.
      const exportAbortButton = await browser.$(Selectors.ExportToastAbort);
      await exportAbortButton.waitForDisplayed();
      await exportAbortButton.click();

      // Wait for the aborted toast to appear.
      const toastElement = await browser.$(Selectors.ExportToast);
      await toastElement.waitForDisplayed();
      await browser
        .$(Selectors.closeToastButton(Selectors.ExportToast))
        .waitForDisplayed();

      // Check it displays that the export was aborted.
      const toastText = await toastElement.getText();
      try {
        expect(toastText).to.include('Export aborted');
      } catch (err) {
        console.log(toastText);
        throw err;
      }

      // Close the toast.
      await browser
        .$(Selectors.closeToastButton(Selectors.ExportToast))
        .waitForDisplayed();
      await browser.clickVisible(
        Selectors.closeToastButton(Selectors.ExportToast)
      );
      await toastElement.waitForDisplayed({ reverse: true });

      const exportCompletedEvent = await telemetryEntry('Export Completed');
      delete exportCompletedEvent.duration; // Duration varies.
      expect(exportCompletedEvent).to.deep.equal({
        all_docs: false,
        file_type: 'json',
        json_format: 'default',
        field_count: 2,
        fields_added_count: 0,
        fields_not_selected_count: 1,
        field_option: 'select-fields',
        number_of_docs: 0,
        has_projection: false,
        success: true,
        type: 'query',
        stopped: true,
      });
      expect(telemetry.screens()).to.include('export_modal');
    });

    it('aborts an in progress CSV export when disconnected', async function () {
      const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

      // Set a query that we'll use.
      await browser.runFindOperation(
        'Documents',
        '{ $where: "function() { sleep(100); return true; }" }'
      );

      // Open the modal.
      await browser.clickVisible(Selectors.ExportCollectionMenuButton);
      await browser.clickVisible(Selectors.ExportCollectionQueryOption);
      const exportModal = await browser.$(Selectors.ExportModal);
      await exportModal.waitForDisplayed();

      // Choose to export select fields.
      await browser.clickVisible(Selectors.ExportQuerySelectFieldsOption);
      await browser.clickVisible(Selectors.ExportNextStepButton);

      // Click to export the `i` and `j` fields.
      await toggleExportFieldCheckbox(browser, 'i');
      await toggleExportFieldCheckbox(browser, 'j');

      await browser.clickVisible(Selectors.ExportNextStepButton);

      // Select CSV.
      await selectExportFileTypeCSV(browser);

      await browser.clickVisible(Selectors.ExportModalExportButton);

      const filename = outputFilename('disconnected-export-test.csv');
      await browser.setExportFilename(filename);

      // Wait for the modal to go away.
      const exportModalElement = await browser.$(Selectors.ExportModal);
      await exportModalElement.waitForDisplayed({
        reverse: true,
      });

      // Wait for the export to start.
      const exportAbortButton = await browser.$(Selectors.ExportToastAbort);
      await exportAbortButton.waitForDisplayed();

      await browser.disconnect();
      await browser
        .$(Selectors.SidebarTitle)
        .waitForDisplayed({ reverse: true });

      // Wait for the aborted toast to appear.
      const toastElement = await browser.$(Selectors.ExportToast);
      await toastElement.waitForDisplayed();
      await browser
        .$(Selectors.closeToastButton(Selectors.ExportToast))
        .waitForDisplayed();

      // Check it displays that the export was aborted.
      const toastText = await toastElement.getText();
      try {
        expect(toastText).to.include('Export aborted');
      } catch (err) {
        console.log(toastText);
        throw err;
      }

      // Close the toast.
      await browser.clickVisible(
        Selectors.closeToastButton(Selectors.ExportToast)
      );
      await toastElement.waitForDisplayed({ reverse: true });

      // Confirm that we exported what we expected to export.
      const text = await fs.readFile(filename, 'utf-8');
      const lines = text.split(/\r?\n/);
      expect(lines.length).to.equal(1);
      // We abort before we add the columns to the file.
      expect(lines[0]).to.equal('');

      const exportCompletedEvent = await telemetryEntry('Export Completed');
      delete exportCompletedEvent.duration; // Duration varies.
      expect(exportCompletedEvent).to.deep.equal({
        all_docs: false,
        file_type: 'csv',
        field_count: 2,
        fields_added_count: 0,
        fields_not_selected_count: 1,
        field_option: 'select-fields',
        number_of_docs: 0,
        has_projection: false,
        success: true,
        type: 'query',
        stopped: true,
      });
      expect(telemetry.screens()).to.include('export_modal');
    });
  });

  describe('with the number-strings collection', function () {
    beforeEach(async function () {
      await createNumbersStringCollection();
      await browser.connectWithConnectionString();
      await browser.navigateToCollectionTab(
        'test',
        'numbers-strings',
        'Documents'
      );
    });

    it('supports collection to CSV with a complex query (sort, skip, limit, collation)', async function () {
      const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

      // Set a query to use with additional query fields, not just filter.
      await browser.runFindOperation('Documents', '', {
        sort: '{ iString: -1 }',
        skip: '2',
        limit: '2',
        collation: `{ locale: 'en_US', numericOrdering: true }`,
      });

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
        .equal(`db.getCollection('numbers-strings')
  .find({})
  .collation({
    locale: 'en_US',
    numericOrdering: true
  })
  .sort({ iString: -1 })
  .limit(2)
  .skip(2);`);

      // Choose to export select fields.
      await browser.clickVisible(Selectors.ExportQuerySelectFieldsOption);
      await browser.clickVisible(Selectors.ExportNextStepButton);

      // Click to export the `iString` and `j` fields.
      await toggleExportFieldCheckbox(browser, 'iString');
      await toggleExportFieldCheckbox(browser, 'j');

      await browser.clickVisible(Selectors.ExportNextStepButton);

      expect(await exportModalQueryTextElement.getText()).to
        .equal(`db.getCollection('numbers-strings')
  .find({}, { iString: 1, j: 1, _id: 0 })
  .collation({
    locale: 'en_US',
    numericOrdering: true
  })
  .sort({ iString: -1 })
  .limit(2)
  .skip(2);`);

      // Select CSV.
      await selectExportFileTypeCSV(browser);

      await browser.clickVisible(Selectors.ExportModalExportButton);

      const filename = outputFilename('complex-query-numbers.csv');
      await browser.setExportFilename(filename);

      // Wait for the modal to go away.
      const exportModalElement = await browser.$(Selectors.ExportModal);
      await exportModalElement.waitForDisplayed({
        reverse: true,
      });

      await browser.waitForExportToFinishAndCloseToast();

      // Clicking the button would open the file in finder/explorer/whatever
      // which is currently not something we can check with webdriver. But we can
      // check that the file exists.

      // Confirm that we exported what we expected to export.
      const text = await fs.readFile(filename, 'utf-8');
      const lines = text.split(/\r?\n/);
      expect(lines.length).to.equal(4);
      expect(lines[0]).to.equal('iString,j');
      expect(lines[1]).to.equal('140,0');
      expect(lines[2]).to.equal('120,0');

      const exportCompletedEvent = await telemetryEntry('Export Completed');
      delete exportCompletedEvent.duration; // Duration varies.
      expect(exportCompletedEvent).to.deep.equal({
        all_docs: false,
        file_type: 'csv',
        field_count: 2,
        fields_added_count: 0,
        fields_not_selected_count: 2,
        field_option: 'select-fields',
        has_projection: false,
        number_of_docs: 2,
        success: true,
        stopped: false,
        type: 'query',
      });
    });

    it('supports collection to JSON with a complex query (sort, skip, limit, collation)', async function () {
      const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

      // Set a query to use with additional query fields, not just filter.
      await browser.runFindOperation('Documents', '', {
        sort: '{ iString: -1 }',
        skip: '2',
        limit: '2',
        collation: `{ locale: 'en_US', numericOrdering: true }`,
      });

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
        .equal(`db.getCollection('numbers-strings')
  .find({})
  .collation({
    locale: 'en_US',
    numericOrdering: true
  })
  .sort({ iString: -1 })
  .limit(2)
  .skip(2);`);

      // Choose to export select fields.
      await browser.clickVisible(Selectors.ExportQuerySelectFieldsOption);
      await browser.clickVisible(Selectors.ExportNextStepButton);

      // Click to export the `iString` and `j` fields.
      await toggleExportFieldCheckbox(browser, 'iString');
      await toggleExportFieldCheckbox(browser, 'j');

      await browser.clickVisible(Selectors.ExportNextStepButton);

      expect(await exportModalQueryTextElement.getText()).to
        .equal(`db.getCollection('numbers-strings')
  .find({}, { iString: 1, j: 1, _id: 0 })
  .collation({
    locale: 'en_US',
    numericOrdering: true
  })
  .sort({ iString: -1 })
  .limit(2)
  .skip(2);`);

      // Select JSON.
      await selectExportFileTypeJSON(browser);

      await browser.clickVisible(Selectors.ExportModalExportButton);

      const filename = outputFilename('complex-query-numbers.json');
      await browser.setExportFilename(filename);

      // Wait for the modal to go away.
      const exportModalElement = await browser.$(Selectors.ExportModal);
      await exportModalElement.waitForDisplayed({
        reverse: true,
      });

      await browser.waitForExportToFinishAndCloseToast();

      // Clicking the button would open the file in finder/explorer/whatever
      // which is currently not something we can check with webdriver. But we can
      // check that the file exists.

      // Confirm that we exported what we expected to export.
      const text = await fs.readFile(filename, 'utf-8');
      expect(text).to.equal(`[{
  "iString": "140",
  "j": 0
},
{
  "iString": "120",
  "j": 0
}]`);

      const exportCompletedEvent = await telemetryEntry('Export Completed');
      delete exportCompletedEvent.duration; // Duration varies.
      expect(exportCompletedEvent).to.deep.equal({
        all_docs: false,
        file_type: 'json',
        json_format: 'default',
        field_count: 2,
        fields_added_count: 0,
        fields_not_selected_count: 2,
        field_option: 'select-fields',
        has_projection: false,
        number_of_docs: 2,
        success: true,
        stopped: false,
        type: 'query',
      });
    });
  });
});
