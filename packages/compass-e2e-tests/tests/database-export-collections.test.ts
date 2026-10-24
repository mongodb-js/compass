import { promises as fs } from 'fs';
import path from 'path';
import { expect } from 'chai';
import { EJSON } from 'bson';
import type { CompassBrowser } from '../helpers/compass-browser.ts';
import {
  deleteCommonVariedProperties,
  startTelemetryServer,
} from '../helpers/telemetry.ts';
import type { Telemetry } from '../helpers/telemetry.ts';
import {
  init,
  cleanup,
  screenshotIfFailed,
  outputFilename,
  skipForWeb,
  TEST_COMPASS_WEB,
  getDefaultConnectionNames,
} from '../helpers/compass.ts';
import type { Compass } from '../helpers/compass.ts';
import * as Selectors from '../helpers/selectors.ts';
import { createNumbersCollection } from '../helpers/mongo-clients.ts';

/**
 * Dispatches the DOM event the export collections modal listens to instead of
 * opening the native folder picker, which webdriver can't drive.
 */
async function selectExportCollectionsDirectory(
  browser: CompassBrowser,
  directoryPath: string
) {
  await browser.execute(function (p) {
    // eslint-disable-next-line no-restricted-globals
    document.dispatchEvent(
      new CustomEvent('selectExportCollectionsDirectory', { detail: p })
    );
  }, directoryPath);
}

describe('Database export collections', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  before(async function () {
    skipForWeb(this, 'export not available in compass-web');

    telemetry = await startTelemetryServer();
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();
    await browser.setFeature('enableExportMultipleCollections', true);
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await cleanup(compass);
    await telemetry.stop();
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  beforeEach(async function () {
    await createNumbersCollection('numbers', 100, true);
    await browser.disconnectAll();
    await browser.connectToDefaults();
    await browser.navigateToDatabaseCollectionsTab(
      getDefaultConnectionNames(0),
      'test'
    );
  });

  it('exports the selected collections of a database to a folder', async function () {
    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

    await browser.clickVisible(Selectors.CollectionsDataActionsButton);
    await browser.clickVisible(Selectors.CollectionsDataActionsExport);
    await browser.waitForOpenModal(Selectors.ExportCollectionsModal);

    // Every collection starts selected; keep only `numbers`.
    await browser.$(Selectors.exportCollectionsItem('numbers')).waitForExist();
    await browser.clickParent(Selectors.ExportCollectionsSelectAll);
    await browser.clickParent(Selectors.exportCollectionsItem('numbers'));

    // Views are listed but can't be exported.
    expect(
      await browser
        .$(Selectors.exportCollectionsItem('numbers_view'))
        .getAttribute('aria-disabled')
    ).to.equal('true');
    expect(
      await browser.$(Selectors.ExportCollectionsExportButton).getText()
    ).to.equal('Export 1 collection…');

    const directoryPath = outputFilename(`export-collections-${Date.now()}`);
    await selectExportCollectionsDirectory(browser, directoryPath);

    await browser.waitForOpenModal(Selectors.ExportCollectionsModal, {
      reverse: true,
    });
    const toast = browser.$(Selectors.ExportCollectionsToast);
    await toast.waitForDisplayed();
    await browser.waitUntil(async () => {
      return (
        (await toast.$(Selectors.LGToastTitle).getText()) ===
        'Export completed.'
      );
    });

    const files = await fs.readdir(directoryPath);
    expect(files.sort()).to.deep.equal([
      'numbers.json',
      'numbers.metadata.json',
    ]);
    const docs = EJSON.parse(
      await fs.readFile(path.join(directoryPath, 'numbers.json'), 'utf8')
    ) as unknown[];
    expect(docs).to.have.lengthOf(100);
    const metadata = EJSON.parse(
      await fs.readFile(
        path.join(directoryPath, 'numbers.metadata.json'),
        'utf8'
      )
    ) as { collectionName: string; indexes: { name: string }[] };
    expect(metadata.collectionName).to.equal('numbers');
    expect(metadata.indexes.map((index) => index.name)).to.deep.equal(['_id_']);

    const openedEvent = await telemetryEntry('Export Collections Opened');
    deleteCommonVariedProperties(openedEvent);
    expect(openedEvent).to.deep.equal({ origin: 'collections-list' });

    const completedEvent = await telemetryEntry('Export Collections Completed');
    delete completedEvent.duration; // Duration varies.
    deleteCommonVariedProperties(completedEvent);
    expect(completedEvent).to.deep.equal({
      file_type: 'json',
      json_format: 'default',
      include_metadata: true,
      collection_count: 1,
      failed_count: 0,
      number_of_docs: 100,
      success: true,
      stopped: false,
    });
  });
});
