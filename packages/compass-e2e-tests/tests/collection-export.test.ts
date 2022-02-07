import { promises as fs } from 'fs';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
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

chai.use(chaiAsPromised);

const { expect } = chai;

describe('Collection export', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  before(async function () {
    telemetry = await startTelemetryServer();
    compass = await beforeTests();
    browser = compass.browser;

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');

    await browser.navigateToCollectionTab('test', 'numbers', 'Documents');
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
    await telemetry.stop();
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('supports collection to CSV with a query filter', async function () {
    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);
    await browser.runFindOperation('Documents', '{ i: 5 }');
    await browser.clickVisible(Selectors.ExportCollectionButton);
    const exportModal = await browser.$(Selectors.ExportModal);
    await exportModal.waitForDisplayed();

    const exportModalQueryTextElement = await browser.$(
      Selectors.ExportModalQueryText
    );
    expect(await exportModalQueryTextElement.getText()).to
      .equal(`db.numbers.find(
  {i: 5}
)`);

    await browser.clickVisible(Selectors.ExportModalSelectFieldsButton);

    // don't change any field selections for now
    await browser.clickVisible(Selectors.ExportModalSelectOutputButton);

    // select csv (unselected at first, selected by the end)
    await browser.clickVisible(
      Selectors.selectExportFileTypeButton('csv', false)
    );
    const selectExportFileTypeButtonElement = await browser.$(
      Selectors.selectExportFileTypeButton('csv', true)
    );
    await selectExportFileTypeButtonElement.waitForDisplayed();

    const filename = outputFilename('filtered-numbers.csv');

    await expect(fs.stat(filename)).to.be.rejected;

    // this is cheating a bit, but we cannot interact with the native dialog
    // it pops up from webdriver and writing to the readonly text field
    // doesn't help either.
    await browser.execute(function (f) {
      // eslint-disable-next-line no-undef
      document.dispatchEvent(
        // eslint-disable-next-line no-undef
        new CustomEvent('selectExportFileName', { detail: f })
      );
    }, filename);

    await browser.waitUntil(async () => {
      const exportModalFileText = await browser.$(
        Selectors.ExportModalFileText
      );
      const value = await exportModalFileText.getValue();
      if (value !== filename) {
        console.log(value, '!==', filename);
      }
      return value === filename;
    });

    await browser.clickVisible(Selectors.ExportModalExportButton);

    const exportModalShowFileButtonElement = await browser.$(
      Selectors.ExportModalShowFileButton
    );
    await exportModalShowFileButtonElement.waitForDisplayed();

    // clicking the button would open the file in finder/explorer/whatever
    // which is probably not something we can check with webdriver. But we can
    // check that the file exists.

    await browser.clickVisible(Selectors.ExportModalCloseButton);

    // the modal should go away
    const exportModalElement = await browser.$(Selectors.ExportModal);
    await exportModalElement.waitForDisplayed({
      reverse: true,
      timeout: 30_000, // Fixes flaky macOS CI.
    });

    const text = await fs.readFile(filename, 'utf-8');
    //  example:'_id,i\n6154788cc5f1fd4544fcedb1,5'
    const lines = text.split(/\r?\n/);
    expect(lines[0]).to.equal('_id,i');
    const fields = lines[1].split(',');
    // first field is an id, so always different
    expect(fields[1]).to.equal('5');

    const exportCompletedEvent = await telemetryEntry('Export Completed');
    expect(exportCompletedEvent).to.deep.equal({
      all_docs: false,
      file_type: 'csv',
      all_fields: true,
      number_of_docs: 1,
      success: true,
    });
    expect(telemetry.screens()).to.include('export_modal');
  });

  it('supports full collection to CSV');
  it('supports collection to CSV with all fields');
  it('supports collection to CSV with a subset of fields');
  it('supports collection to JSON with a query filter');
  it('supports full collection to JSON');
  it('supports collection to JSON with all fields');
  it('supports collection to JSON with a subset of fields');
});
