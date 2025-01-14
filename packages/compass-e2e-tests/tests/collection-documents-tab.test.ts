import chai from 'chai';
import clipboard from 'clipboardy';
import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import {
  init,
  cleanup,
  screenshotIfFailed,
  TEST_COMPASS_WEB,
  skipForWeb,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import {
  createNestedDocumentsCollection,
  createNumbersCollection,
} from '../helpers/insert-data';
import { context } from '../helpers/test-runner-context';
import type { ChainablePromiseElement } from 'webdriverio';

const { expect } = chai;

interface RecentQuery {
  [key: string]: string;
}

async function getRecentQueries(
  browser: CompassBrowser,
  expectQueries = false
): Promise<RecentQuery[]> {
  const history = browser.$(Selectors.QueryBarHistory);
  if (!(await history.isDisplayed())) {
    await browser.clickVisible(Selectors.QueryBarHistoryButton);
    await history.waitForDisplayed();
  }

  await browser.waitUntil(async () => {
    const numQueryTags = await browser.$$(
      '[data-testid="query-history-query-attributes"]'
    ).length;
    // Usually we expect to find some recents and the most common failure is
    // that we read out the queries before they are rendered.
    if (expectQueries) {
      // Keep going until we find something or timeout if we never do
      return numQueryTags > 0;
    }
    return true;
  });

  return await browser
    .$$('[data-testid="query-history-query-attributes"]')
    .map(async (queryTag: WebdriverIO.Element) => {
      const attributes: RecentQuery = {};
      await queryTag
        .$$('[data-testid="query-history-query-attribute"]')
        .map(async (attributeTag) => {
          const labelTag = attributeTag.$(
            '[data-testid="query-history-query-label"]'
          );
          const preTag = attributeTag.$('pre');
          const key = await labelTag.getText();
          const value = await preTag.getText();
          attributes[key] = value;
        });
      return attributes;
    });
}

async function navigateToTab(browser: CompassBrowser, tabName: string) {
  const tabSelector = Selectors.collectionSubTab(tabName);
  const tabSelectedSelector = Selectors.collectionSubTab(tabName, true);

  const tabSelectedSelectorElement = browser.$(tabSelectedSelector);
  // if the correct tab is already visible, do nothing
  if (await tabSelectedSelectorElement.isExisting()) {
    return;
  }

  // otherwise select the tab and wait for it to become selected
  await browser.clickVisible(tabSelector);

  await tabSelectedSelectorElement.waitForDisplayed();
}

async function waitForJSON(
  browser: CompassBrowser,
  element: ChainablePromiseElement
) {
  // Sometimes the line numbers end up in the text for some reason. Probably
  // because we get the text before the component is properly initialised.
  await browser.waitUntil(async () => {
    const text = await element.getText();
    const isJSON = text.replace(/\s+/g, ' ').startsWith('{');
    if (!isJSON) {
      console.log({ text });
    }
    return isJSON;
  });
}

async function getFormattedDocument(browser: CompassBrowser) {
  const document = browser.$(Selectors.DocumentListEntry);
  await document.waitForDisplayed();
  return (await document.getText())
    .replace(/\n/g, ' ')
    .replace(/\s+?:/g, ':')
    .replace(/\s+/g, ' ');
}

describe('Collection documents tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;
  let maxTimeMSBefore: string;

  before(async function () {
    telemetry = await startTelemetryServer();
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await createNestedDocumentsCollection('nestedDocs', 10);
    await browser.disconnectAll();
    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'numbers',
      'Documents'
    );

    if (!TEST_COMPASS_WEB) {
      // setFeature/getFeature is not supported in compass-web yet
      maxTimeMSBefore = (await browser.getFeature('maxTimeMS')) as string;
    }
  });

  after(async function () {
    await cleanup(compass);
    await telemetry.stop();
  });

  afterEach(async function () {
    if (!TEST_COMPASS_WEB) {
      // setFeature/getFeature is not supported in compass-web yet
      await browser.setFeature('maxTimeMS', maxTimeMSBefore);
    }
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('supports simple find operations', async function () {
    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);
    await browser.runFindOperation('Documents', '{ i: 5 }');

    const documentListActionBarMessageElement = browser.$(
      Selectors.DocumentListActionBarMessage
    );
    const text = await documentListActionBarMessageElement.getText();
    expect(text).to.equal('1 – 1 of 1');

    // Check the telemetry
    const queryExecutedEvent = await telemetryEntry('Query Executed');

    expect(queryExecutedEvent.connection_id).to.exist;
    delete queryExecutedEvent.connection_id; // connection_id varies

    expect(queryExecutedEvent).to.deep.equal({
      changed_maxtimems: false,
      collection_type: 'collection',
      has_collation: false,
      has_limit: false,
      has_projection: false,
      has_skip: false,
      has_sort: false,
      used_regex: false,
    });

    if (!TEST_COMPASS_WEB) {
      // no query history in compass-web yet
      const queries = await getRecentQueries(browser, true);
      expect(queries).to.deep.include.members([{ Filter: '{\n  i: 5\n}' }]);
    }
  });

  it('supports advanced find operations', async function () {
    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);
    await browser.runFindOperation('Documents', '{ i: { $gt: 5 } }', {
      project: '{ _id: 0 }',
      sort: '{ i: -1 }',
      skip: '5',
      limit: '50',
    });

    const documentListActionBarMessageElement = browser.$(
      Selectors.DocumentListActionBarMessage
    );
    const text = await documentListActionBarMessageElement.getText();
    expect(text).to.equal('1 – 25 of 50');

    // Check the telemetry
    const queryExecutedEvent = await telemetryEntry('Query Executed');

    expect(queryExecutedEvent.connection_id).to.exist;
    delete queryExecutedEvent.connection_id; // connection_id varies

    expect(queryExecutedEvent).to.deep.equal({
      changed_maxtimems: false,
      collection_type: 'collection',
      has_collation: false,
      has_limit: true,
      has_projection: true,
      has_sort: true,
      has_skip: true,
      used_regex: false,
    });

    if (!TEST_COMPASS_WEB) {
      // no query history in compass-web yet
      const queries = await getRecentQueries(browser, true);
      expect(queries).to.deep.include.members([
        {
          Filter: '{\n  i: {\n    $gt: 5\n  }\n}',
          Limit: '50',
          Project: '{\n  _id: 0\n}',
          Skip: '5',
          Sort: '{\n  i: -1\n}',
        },
      ]);
    }
  });

  it('supports cancelling a find and then running another query', async function () {
    // execute a query that will take a long time
    await browser.runFindOperation(
      'Documents',
      '{ $where: function() { return sleep(10000) || true; } }',
      {
        waitForResult: false,
      }
    );

    // stop it
    const documentListFetchingElement = browser.$(
      Selectors.DocumentListFetching
    );
    await documentListFetchingElement.waitForDisplayed();

    await browser.clickVisible(Selectors.DocumentListFetchingStopButton);

    const documentListErrorElement = browser.$(Selectors.DocumentListError);
    await documentListErrorElement.waitForDisplayed();

    const errorText = await documentListErrorElement.getText();
    expect(errorText).to.equal('This operation was aborted');

    // execute another (small, fast) query
    await browser.runFindOperation('Documents', '{ i: 5 }');
    const documentListActionBarMessageElement = browser.$(
      Selectors.DocumentListActionBarMessage
    );

    const displayText = await documentListActionBarMessageElement.getText();
    expect(displayText).to.equal('1 – 1 of 1');

    if (!TEST_COMPASS_WEB) {
      // no query history in compass-web yet
      const queries = await getRecentQueries(browser, true);
      expect(queries).to.deep.include.members([
        {
          Filter:
            "{\n  $where: 'function() { return sleep(10000) || true; }'\n}",
        },
      ]);
    }
  });

  for (const maxTimeMSMode of ['ui', 'preference'] as const) {
    it(`supports maxTimeMS (set via ${maxTimeMSMode})`, async function () {
      skipForWeb(this, 'preferences modal not supported in compass-web');

      if (maxTimeMSMode === 'preference') {
        await browser.openSettingsModal();
        const settingsModal = browser.$(Selectors.SettingsModal);
        await settingsModal.waitForDisplayed();
        await browser.clickVisible(Selectors.GeneralSettingsButton);

        await browser.setValueVisible(
          Selectors.SettingsInputElement('maxTimeMS'),
          '1'
        );
        await browser.clickVisible(Selectors.SaveSettingsButton);
        await settingsModal.waitForDisplayed({ reverse: true });
      }

      // execute a query that will take a long time, but set a maxTimeMS shorter than that
      await browser.runFindOperation(
        'Documents',
        '{ $where: function() { return sleep(10000) || true; } }',
        {
          ...(maxTimeMSMode === 'ui' ? { maxTimeMS: '1' } : {}),
          waitForResult: false,
        }
      );

      const documentListErrorElement = browser.$(Selectors.DocumentListError);
      await documentListErrorElement.waitForDisplayed();

      const errorText = await documentListErrorElement.getText();
      expect(errorText).to.include(
        'Operation exceeded time limit. Please try increasing the maxTimeMS for the query in the expanded filter options.'
      );
    });
  }

  it('keeps the query when navigating to schema', async function () {
    await browser.runFindOperation('Documents', '{ i: 5 }');

    const documentListActionBarMessageElement = browser.$(
      Selectors.DocumentListActionBarMessage
    );
    const documentsMessage =
      await documentListActionBarMessageElement.getText();
    expect(documentsMessage).to.equal('1 – 1 of 1');

    await navigateToTab(browser, 'Schema');

    // will have to re-run the query because either the schema hasn't been
    // analyzed yet or it might be outdated
    await browser.runFind('Schema', true);

    // if the schema tab only matched one document, then it is presumably the same query
    const schemaAnalysisMessageElement = browser.$(Selectors.AnalysisMessage);
    const analysisMessage = await schemaAnalysisMessageElement.getText();
    expect(analysisMessage.replace(/\s/g, ' ')).to.equal(
      'This report is based on a sample of 1 document.'
    );

    await navigateToTab(browser, 'Documents');
  });

  it('can export to language', async function () {
    await navigateToTab(browser, 'Documents'); // just in case the previous test failed before it could clean up

    await browser.runFindOperation('Documents', '{ i: 5 }');

    await browser.clickVisible(
      Selectors.queryBarExportToLanguageButton('Documents')
    );

    const text = await browser.exportToLanguage('Java', {
      includeImportStatements: true,
      includeDriverSyntax: true,
      useBuilders: true,
    });

    expect(text).to.equal(`import static com.mongodb.client.model.Filters.eq;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.conversions.Bson;
import java.util.concurrent.TimeUnit;
import org.bson.Document;
import com.mongodb.client.FindIterable;
/*
 * Requires the MongoDB Java Driver.
 * https://mongodb.github.io/mongo-java-driver
 */
Bson filter = eq("i", 5L);
MongoClient mongoClient = new MongoClient(
    new MongoClientURI(
        "mongodb://127.0.0.1:27091/test"
    )
);
MongoDatabase database = mongoClient.getDatabase("test");
MongoCollection<Document> collection = database.getCollection("numbers");
FindIterable<Document> result = collection.find(filter);`);
  });

  it('supports view/edit via list view', async function () {
    await browser.runFindOperation('Documents', '{ i: 31 }');
    const document = browser.$(Selectors.DocumentListEntry);
    await document.waitForDisplayed();
    expect(await getFormattedDocument(browser)).to.match(
      /^_id: ObjectId\('[a-f0-9]{24}'\) i: 31 j: 0$/
    );

    const valueElement = document.$(
      `${Selectors.HadronDocumentElement}:last-child ${Selectors.HadronDocumentClickableValue}`
    );
    await valueElement.doubleClick();

    const input = document.$(
      `${Selectors.HadronDocumentElement}:last-child ${Selectors.HadronDocumentValueEditor}`
    );
    await browser.setValueVisible(input, '42');

    const footer = document.$(Selectors.DocumentFooterMessage);
    expect(await footer.getText()).to.equal('Document modified.');

    const button = document.$(Selectors.UpdateDocumentButton);
    await button.click();
    await footer.waitForDisplayed({ reverse: true });

    await browser.runFindOperation('Documents', '{ i: 31 }');
    const modifiedDocument = browser.$(Selectors.DocumentListEntry);
    await modifiedDocument.waitForDisplayed();
    expect(await getFormattedDocument(browser)).to.match(
      /^_id: ObjectId\('[a-f0-9]{24}'\) i: 31 j: 42$/
    );
  });

  it('supports view/edit via json view', async function () {
    await browser.runFindOperation('Documents', '{ i: 32 }');
    await browser.clickVisible(Selectors.SelectJSONView);

    const document = browser.$(Selectors.DocumentJSONEntry);
    await document.waitForDisplayed();

    await waitForJSON(browser, document);

    const json = await browser.getCodemirrorEditorText(
      Selectors.DocumentJSONEntry
    );
    expect(json.replace(/\s+/g, ' ')).to.match(
      /^\{ "_id": \{ "\$oid": "[a-f0-9]{24}" \}, "i": 32, "j": 0 \}$/
    );

    await browser.hover(Selectors.JSONDocumentCard);
    await browser.clickVisible(Selectors.JSONEditDocumentButton);

    const newjson = JSON.stringify({ ...JSON.parse(json), j: 1234 });

    await browser.setCodemirrorEditorValue(
      Selectors.DocumentJSONEntry,
      newjson
    );

    const footer = document.$(Selectors.DocumentFooterMessage);
    expect(await footer.getText()).to.equal('Document modified.');

    const button = document.$(Selectors.UpdateDocumentButton);
    await button.click();
    await footer.waitForDisplayed({ reverse: true });

    await browser.runFindOperation('Documents', '{ i: 32 }');
    await browser.clickVisible(Selectors.SelectJSONView);

    const modifiedDocument = browser.$(Selectors.DocumentJSONEntry);
    await modifiedDocument.waitForDisplayed();

    await waitForJSON(browser, modifiedDocument);

    expect(
      (
        await browser.getCodemirrorEditorText(Selectors.DocumentJSONEntry)
      ).replace(/\s+/g, ' ')
    ).to.match(
      /^\{ "_id": \{ "\$oid": "[a-f0-9]{24}" \}, "i": 32, "j": 1234 \}$/
    );
  });

  it('supports view/edit for Int64 values via json view', async function () {
    await browser.runFindOperation('Documents', '{ i: 123 }');
    await browser.clickVisible(Selectors.SelectJSONView);

    const document = browser.$(Selectors.DocumentJSONEntry);
    await document.waitForDisplayed();

    await waitForJSON(browser, document);

    const json = await browser.getCodemirrorEditorText(
      Selectors.DocumentJSONEntry
    );
    expect(json.replace(/\s+/g, ' ')).to.match(
      /^\{ "_id": \{ "\$oid": "[a-f0-9]{24}" \}, "i": 123, "j": 0 \}$/
    );

    await browser.hover(Selectors.JSONDocumentCard);
    await browser.clickVisible(Selectors.JSONEditDocumentButton);

    const newjson = JSON.stringify({
      ...JSON.parse(json),
      j: { $numberLong: '12345' },
    });

    await browser.setCodemirrorEditorValue(
      Selectors.DocumentJSONEntry,
      newjson
    );

    const footer = document.$(Selectors.DocumentFooterMessage);
    expect(await footer.getText()).to.equal('Document modified.');

    const button = document.$(Selectors.UpdateDocumentButton);
    await button.click();
    await footer.waitForDisplayed({ reverse: true });

    await browser.runFindOperation('Documents', '{ i: 123 }');
    await browser.clickVisible(Selectors.SelectJSONView);

    const modifiedDocument = browser.$(Selectors.DocumentJSONEntry);
    await modifiedDocument.waitForDisplayed();

    await waitForJSON(browser, modifiedDocument);

    expect(
      (
        await browser.getCodemirrorEditorText(Selectors.DocumentJSONEntry)
      ).replace(/\s+/g, ' ')
    ).to.match(
      /^\{ "_id": \{ "\$oid": "[a-f0-9]{24}" \}, "i": 123, "j": \{.+?\} \}$/
    );
  });

  it('supports view/edit via table view', async function () {
    await browser.runFindOperation('Documents', '{ i: 33 }');
    await browser.clickVisible(Selectors.SelectTableView);

    const document = browser.$('.ag-center-cols-clipper .ag-row-first');
    const text = (await document.getText()).replace(/\s+/g, ' ');
    expect(text).to.match(
      /^ObjectId\('[a-f0-9]{24}('\))? 33 0$/ // ') now gets cut off. sometimes.
    );

    const value = document.$('[col-id="j"] .element-value');
    await value.doubleClick();

    const input = document.$(
      '[col-id="j"] [data-testid="table-view-cell-editor-value-input"]'
    );
    await browser.setValueVisible(input, '-100');

    const footer = browser.$(Selectors.DocumentFooterMessage);
    expect(await footer.getText()).to.equal('Document modified.');

    const button = browser.$(Selectors.UpdateDocumentButton);
    await button.click();
    await footer.waitForDisplayed({ reverse: true });

    await browser.runFindOperation('Documents', '{ i: 33 }');
    await browser.clickVisible(Selectors.SelectTableView);

    const modifiedDocument = browser.$('.ag-center-cols-clipper .ag-row-first');
    expect((await modifiedDocument.getText()).replace(/\s+/g, ' ')).to.match(
      /^ObjectId\('[a-f0-9]{24}('\))? 33 -100$/
    );
  });

  it('can copy a document from the contextual toolbar', async function () {
    if (context.disableClipboardUsage) {
      this.skip();
    }

    await browser.runFindOperation('Documents', '{ i: 34 }');

    const document = browser.$(Selectors.DocumentListEntry);
    await document.waitForDisplayed();

    await browser.hover(Selectors.DocumentListEntry);
    await browser.clickVisible(Selectors.CopyDocumentButton);

    await browser.waitUntil(
      async () => {
        return !!/^\{ "_id": \{ "\$oid": "[a-f0-9]{24}" \}, "i": 34, "j": 0 \}$/.exec(
          (await clipboard.read()).replace(/\s+/g, ' ').replace(/\n/g, '')
        );
      },
      { timeoutMsg: 'Expected copy to clipboard to work' }
    );
  });

  it('can clone and delete a document from the contextual toolbar', async function () {
    await browser.runFindOperation('Documents', '{ i: 35 }');

    const document = browser.$(Selectors.DocumentListEntry);
    await document.waitForDisplayed();

    await browser.hover(Selectors.DocumentListEntry);
    await browser.clickVisible(Selectors.CloneDocumentButton);

    // wait for the modal to appear
    const insertDialog = browser.$(Selectors.InsertDialog);
    await insertDialog.waitForDisplayed();

    // set the text in the editor and insert the document
    await browser.setCodemirrorEditorValue(
      Selectors.InsertJSONEditor,
      '{ "i": 10042 }'
    );
    const insertConfirm = browser.$(Selectors.InsertConfirm);
    await insertConfirm.waitForEnabled();
    await browser.clickVisible(Selectors.InsertConfirm);
    await insertDialog.waitForDisplayed({ reverse: true });

    await browser.runFindOperation('Documents', '{ i: 10042 }');

    expect(await getFormattedDocument(browser)).to.match(
      /^_id: ObjectId\('[a-f0-9]{24}'\) i: 10042$/
    );

    await browser.hover(Selectors.DocumentListEntry);
    await browser.clickVisible(Selectors.DeleteDocumentButton);
    await browser.clickVisible(Selectors.ConfirmDeleteDocumentButton);

    await browser.runFindOperation('Documents', '{ i: 10042 }');
    const noDocuments = browser.$('[data-testid="document-list-zero-state"]');
    await noDocuments.waitForDisplayed();
  });

  it('shows insight for the unindexed query', async function () {
    await browser.runFindOperation('Documents', '{ i: 35 }');
    await browser.clickVisible(Selectors.InsightIconButton);
    await browser.waitForAnimations(Selectors.InsightPopoverCard);
    const unindexedQuerySignal = browser.$(
      'strong=Query executed without index'
    );
    // Looks redundant, but selector above can return a special webdriver
    // non-existing element, so we try to get some text so that it will actually
    // throw if not found in DOM
    expect(await unindexedQuerySignal.getText()).to.eq(
      'Query executed without index'
    );
  });

  describe('expanding and collapsing of documents', function () {
    beforeEach(async function () {
      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME_1,
        'test',
        'nestedDocs',
        'Documents'
      );
    });

    it('expands and collapses all fields in a document', async function () {
      await browser.runFindOperation(
        'Documents',
        '{ "names.firstName": "1-firstName" }'
      );
      const document = browser.$(Selectors.DocumentListEntry);
      await document.waitForDisplayed();

      await browser.hover(Selectors.DocumentListEntry);
      await browser.clickVisible(Selectors.DocumentExpandButton);
      const numExpandedHadronElements = await browser.$$(
        Selectors.HadronDocumentElement
      ).length;
      expect(numExpandedHadronElements).to.equal(14);

      await browser.hover(Selectors.DocumentListEntry);
      await browser.clickVisible(Selectors.DocumentExpandButton);
      const numCollapsedHadronElements = await browser.$$(
        Selectors.HadronDocumentElement
      ).length;
      expect(numCollapsedHadronElements).to.equal(4);
    });

    it('preserves the expanded state of a document when switching between tabs', async function () {
      await browser.runFindOperation(
        'Documents',
        '{ "names.firstName": "1-firstName" }'
      );
      const document = browser.$(Selectors.DocumentListEntry);
      await document.waitForDisplayed();

      await browser.hover(Selectors.DocumentListEntry);
      await browser.clickVisible(Selectors.DocumentExpandButton);
      const numExpandedHadronElements = await browser.$$(
        Selectors.HadronDocumentElement
      ).length;
      expect(numExpandedHadronElements).to.equal(14);

      await browser.navigateWithinCurrentCollectionTabs('Aggregations');
      await browser.navigateWithinCurrentCollectionTabs('Documents');

      const numExpandedHadronElementsPostSwitch = await browser.$$(
        Selectors.HadronDocumentElement
      ).length;
      expect(numExpandedHadronElementsPostSwitch).to.equal(14);
    });
  });
});
