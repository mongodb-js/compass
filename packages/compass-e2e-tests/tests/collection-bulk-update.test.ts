import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

describe('Bulk Update', () => {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  before(async function () {
    telemetry = await startTelemetryServer();
    compass = await beforeTests({
      extraSpawnArgs: ['--enableBulkUpdateOperations'],
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

  it('updates documents matching a filter', async function () {
    //const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

    // Set a query that we'll use.
    await browser.runFindOperation('Documents', '{ i: 5 }');

    // Open the modal.
    await browser.clickVisible(Selectors.OpenBulkUpdateButton);
    await browser.$(Selectors.BulkUpdateModal).waitForDisplayed();

    // TODO(COMPASS-7448): Make sure the query is shown in the modal.

    // Check that it will update the expected number of documents
    expect(await browser.$(Selectors.BulkUpdateTitle).getText()).to.equal(
      'Update 1 document'
    );
    expect(
      await browser.$(Selectors.BulkUpdateUpdateButton).getText()
    ).to.equal('Update 1 document');

    // Check that the modal starts with the default update text
    expect(
      await browser.getCodemirrorEditorText(Selectors.BulkUpdateUpdate)
    ).to.equal('{ $set: { } }');

    // Change the update text
    await browser.setCodemirrorEditorValue(
      Selectors.BulkUpdateUpdate,
      '{ $set: { foo: "bar" } }'
    );

    // Wait for the preview to update accordingly
    await browser.waitUntil(async () => {
      const text = await browser
        .$(Selectors.BulkUpdatePreviewDocument + ':first-child')
        .getText();
      console.log(text);
      return /foo\s+:\s+"bar"/.test(text);
    });

    // Press update
    await browser.clickVisible(Selectors.BulkUpdateUpdateButton);

    // The modal should go away
    await browser
      .$(Selectors.BulkUpdateModal)
      .waitForDisplayed({ reverse: true });

    // TODO(COMPASS-7457): The toast should eventually say that it is done and have a refresh
    // button, but right now it has a timeout and goes away automatically, so
    // that will just flake.

    // TODO(COMPASS-7388): Check the telemetry once we add it

    // Keep running a new find and make sure the doc eventually matches the
    // expected query (once the update ran).
    // TODO(COMPASS-7457): Once we can wait for a stable toast we don't have to
    // do this in a loop - we can just run this once when the update finishes.
    await browser.waitUntil(async () => {
      await browser.runFindOperation('Documents', '{ i: 5, foo: "bar" }');
      const modifiedDocument = await browser.$(Selectors.DocumentListEntry);
      await modifiedDocument.waitForDisplayed();
      const doc = await getFormattedDocument(browser);
      return /^_id: ObjectId\('[a-f0-9]{24}'\) i: 5 j: 0 foo: "bar"$/.test(doc);
    });
  });

  it('can save an update query as a favourite and return to it');
});

async function getFormattedDocument(browser: CompassBrowser): Promise<string> {
  const document = await browser.$(Selectors.DocumentListEntry);
  await document.waitForDisplayed();
  return (await document.getText())
    .replace(/\n/g, ' ')
    .replace(/\s+?:/g, ':')
    .replace(/\s+/g, ' ');
}
