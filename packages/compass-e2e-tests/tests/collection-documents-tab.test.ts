import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

const { expect } = chai;

describe('Collection documents tab', function () {
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

  it('supports simple find operations', async function () {
    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);
    await browser.runFindOperation('Documents', '{ i: 5 }');

    const documentListActionBarMessageElement = await browser.$(
      Selectors.DocumentListActionBarMessage
    );
    const text = await documentListActionBarMessageElement.getText();
    expect(text).to.equal('Displaying documents 1 - 1 of 1');
    const queryExecutedEvent = await telemetryEntry('Query Executed');
    expect(queryExecutedEvent).to.deep.equal({
      changed_maxtimems: false,
      collection_type: 'collection',
      has_collation: false,
      has_limit: false,
      has_projection: false,
      has_skip: false,
      used_regex: false,
    });
  });

  it('supports advanced find operations', async function () {
    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);
    await browser.runFindOperation('Documents', '{ i: { $gt: 5 } }', {
      project: '{ _id: 0 }',
      sort: '{ i: -1 }',
      skip: '5',
      limit: '50',
    });

    const documentListActionBarMessageElement = await browser.$(
      Selectors.DocumentListActionBarMessage
    );
    const text = await documentListActionBarMessageElement.getText();
    expect(text).to.equal('Displaying documents 1 - 20 of 50');
    const queryExecutedEvent = await telemetryEntry('Query Executed');
    expect(queryExecutedEvent).to.deep.equal({
      changed_maxtimems: false,
      collection_type: 'collection',
      has_collation: false,
      has_limit: true,
      has_projection: true,
      has_skip: true,
      used_regex: false,
    });
  });

  it.only('supports cancelling a find and then running another query', async function () {
    // execute a query that will take a long time
    await browser.runFindOperation(
      'Documents',
      '{ $where: function() { return sleep(10000) || true; } }',
      {
        // Clearing out input fields has no effect for some reason so just set
        // it to something else. Otherwise setOrClearValue clears it but the
        // moment the field blurs it just goes back to what it was before
        skip: '0',
        waitForResult: false,
      }
    );

    // stop it
    const documentListFetchingElement = await browser.$(
      Selectors.DocumentListFetching
    );
    await documentListFetchingElement.waitForDisplayed();

    await browser.clickVisible(Selectors.DocumentListFetchingStopButton);

    const documentListErrorElement = await browser.$(
      Selectors.DocumentListError
    );
    await documentListErrorElement.waitForDisplayed();

    const errorText = await documentListErrorElement.getText();
    expect(errorText).to.equal('The operation was cancelled.');

    // execute another (small, fast) query
    await browser.runFindOperation('Documents', '{ i: 5 }');
    const documentListActionBarMessageElement = await browser.$(
      Selectors.DocumentListActionBarMessage
    );

    const displayText = await documentListActionBarMessageElement.getText();
    expect(displayText).to.equal('Displaying documents 1 - 1 of 1');
  });

  it('supports view/edit via list view');
  it('supports view/edit via json view');
  it('supports view/edit via table view');
  it('supports maxTimeMS');
  it('can reset query');
  // different languages, with and without imports, with and without driver usage
  it('can export to language');
  // JSON mode
  // field by field mode
  // array of JSON docs
  it('can insert document');
  // behaviour with multiple tabs
  it('can view query history');
  it('keeps the query when navigating to schema and explain');
  it('can copy/clone/delete a document from contextual toolbar');
});
