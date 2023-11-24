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

    // Make sure the query is shown in the modal.
    expect(
      await browser.$(Selectors.BulkUpdateReadonlyFilter).getText()
    ).to.equal('{ i: 5 }');

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

  it('can save an update query as a favourite and return to it', async function () {
    // Set a query that we'll use.
    await browser.runFindOperation('Documents', '{ i: { $gt: 5 } }');

    // Open the modal.
    await browser.clickVisible(Selectors.OpenBulkUpdateButton);
    await browser.$(Selectors.BulkUpdateModal).waitForDisplayed();

    // Change the update text
    await browser.setCodemirrorEditorValue(
      Selectors.BulkUpdateUpdate,
      '{ $set: { k: 0 } }'
    );

    // Click save to open the popover
    await browser.clickVisible(Selectors.BulkUpdateSaveFavorite);

    // Fill in a name
    const input = await browser.$(Selectors.BulkUpdateFavouriteNameInput);
    input.waitForDisplayed();
    input.setValue('My Update Query');

    // Click save to save the query
    await browser.$(Selectors.BulkUpdateFavouriteSaveButton).waitForEnabled();
    await browser.clickVisible(Selectors.BulkUpdateFavouriteSaveButton);

    // Close the modal
    await browser.clickVisible(Selectors.BulkUpdateCancelButton);

    // Wait for the modal to go away
    await browser
      .$(Selectors.BulkUpdateModal)
      .waitForDisplayed({ reverse: true });

    // Open the dropdown
    await browser.clickVisible(Selectors.QueryBarHistoryButton);

    // Wait for the popover to show
    await browser.$(Selectors.QueryBarHistory).waitForDisplayed();

    // Browse to Favourites
    await browser.clickVisible(Selectors.FavouriteQueriesButton);

    // Wait for the favourite to show and click it
    await browser.waitUntil(async () => {
      const favouriteElements = await browser.$$(
        Selectors.FavouriteQueryListItem
      );
      for (const element of favouriteElements) {
        const favouriteName = await element
          .$(Selectors.FavouriteQueryTitle)
          .getText();
        console.log(favouriteName);
        if (favouriteName === 'My Update Query') {
          await element.click();
          return true;
        }
      }
      return false;
    });

    // The modal should open
    await browser.$(Selectors.BulkUpdateModal).waitForDisplayed();

    // Make sure the query is shown in the modal.
    expect(
      await browser.$(Selectors.BulkUpdateReadonlyFilter).getText()
    ).to.equal('{ i: { $gt: 5 } }');

    // Check that the modal starts with the expected update text
    expect(await browser.getCodemirrorEditorText(Selectors.BulkUpdateUpdate)).to
      .equal(`{
 $set: {
  k: 0
 }
}`);
  });
});

async function getFormattedDocument(browser: CompassBrowser): Promise<string> {
  const document = await browser.$(Selectors.DocumentListEntry);
  await document.waitForDisplayed();
  return (await document.getText())
    .replace(/\n/g, ' ')
    .replace(/\s+?:/g, ':')
    .replace(/\s+/g, ' ');
}
