import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import type { Element } from 'webdriverio';

const { expect } = chai;

interface RecentQuery {
  [key: string]: string;
}

async function getRecentQueries(
  browser: CompassBrowser
): Promise<RecentQuery[]> {
  const history = await browser.$(Selectors.QueryBarHistory);
  if (!(await history.isDisplayed())) {
    await browser.clickVisible(Selectors.QueryBarHistoryButton);
    await history.waitForDisplayed();
  }

  const queryTags = await browser.$$(
    '[data-test-id="query-history-query-attributes"]'
  );
  return Promise.all(
    queryTags.map(async (queryTag) => {
      const attributeTags = await queryTag.$$('li');
      const attributes: RecentQuery = {};
      await Promise.all(
        attributeTags.map(async (attributeTag: Element<'async'>) => {
          const labelTag = await attributeTag.$('label');
          const preTag = await attributeTag.$('pre');
          const key = await labelTag.getText();
          const value = await preTag.getText();
          attributes[key] = value;
        })
      );
      return attributes;
    })
  );
}

async function navigateToTab(browser: CompassBrowser, tabName: string) {
  const tabSelector = Selectors.collectionTab(tabName);
  const tabSelectedSelector = Selectors.collectionTab(tabName, true);

  const tabSelectedSelectorElement = await browser.$(tabSelectedSelector);
  // if the correct tab is already visible, do nothing
  if (await tabSelectedSelectorElement.isExisting()) {
    return;
  }

  // otherwise select the tab and wait for it to become selected
  await browser.clickVisible(tabSelector);

  await tabSelectedSelectorElement.waitForDisplayed();
}

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

    const queries = await getRecentQueries(browser);
    expect(queries).to.deep.include.members([{ FILTER: '{\n i: 5\n}' }]);
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

    const queries = await getRecentQueries(browser);
    expect(queries).to.deep.include.members([
      {
        FILTER: '{\n i: {\n  $gt: 5\n }\n}',
        LIMIT: '50',
        PROJECT: '{\n _id: 0\n}',
        SKIP: '5',
        SORT: '{\n i: -1\n}',
      },
    ]);
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

    const queries = await getRecentQueries(browser);
    expect(queries).to.deep.include.members([
      {
        FILTER: "{\n $where: 'function() { return sleep(10000) || true; }'\n}",
      },
    ]);
  });

  it('supports maxTimeMS', async function () {
    // execute a query that will take a long time, but set a maxTimeMS shorter than that
    await browser.runFindOperation(
      'Documents',
      '{ $where: function() { return sleep(10000) || true; } }',
      {
        maxTimeMS: '1000',
        waitForResult: false,
      }
    );

    const documentListErrorElement = await browser.$(
      Selectors.DocumentListError
    );
    await documentListErrorElement.waitForDisplayed();

    const errorText = await documentListErrorElement.getText();
    expect(errorText).to.include('operation exceeded time limit');
  });

  it('keeps the query when navigating to schema and explain', async function () {
    await browser.runFindOperation('Documents', '{ i: 5 }');

    const documentListActionBarMessageElement = await browser.$(
      Selectors.DocumentListActionBarMessage
    );
    const documentsMessage =
      await documentListActionBarMessageElement.getText();
    expect(documentsMessage).to.equal('Displaying documents 1 - 1 of 1');

    await navigateToTab(browser, 'Schema');

    // will have to re-run the query because either the schema hasn't been
    // analyzed yet or it might be outdated
    await browser.runFind('Schema', true);

    // if the schema tab only matched one document, then it is presumably the same query
    const schemaAnalysisMessageElement = await browser.$(
      Selectors.AnalysisMessage
    );
    const analysisMessage = await schemaAnalysisMessageElement.getText();
    expect(analysisMessage.replace(/\s/g, ' ')).to.equal(
      'This report is based on a sample of 1 document.'
    );

    await navigateToTab(browser, 'Explain Plan');

    await browser.runFind('Explain Plan', true);

    // if the eplain plan tab only matched one document, then it is presumably the same query
    const explainSummaryElement = await browser.$(
      Selectors.ExplainDocumentsReturnedSummary
    );
    const explainSummary = await explainSummaryElement.getText();
    expect(explainSummary.replace(/\s/g, ' ')).to.equal('Documents Returned:1');

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
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.conversions.Bson;
import java.util.concurrent.TimeUnit;
import org.bson.Document;

/*
 * Requires the MongoDB Java Driver.
 * https://mongodb.github.io/mongo-java-driver
 */

Bson filter = eq("i", 5L);

MongoClient mongoClient = new MongoClient(
    new MongoClientURI(
        "mongodb://localhost:27018/test"
    )
);
MongoDatabase database = mongoClient.getDatabase("test");
MongoCollection<Document> collection = database.getCollection("numbers");
FindIterable<Document> result = collection.find(filter);`);
  });

  it('supports view/edit via list view');
  it('supports view/edit via json view');
  it('supports view/edit via table view');
  it('can insert a document in list view');
  it('can insert a document in json view');
  it('can insert an array of documents in json view');
  it('can copy a document from the contextual toolbar');
  it('can clone a document from the contextual toolbar');
  it('can delete a document from the contextual toolbar');
});
