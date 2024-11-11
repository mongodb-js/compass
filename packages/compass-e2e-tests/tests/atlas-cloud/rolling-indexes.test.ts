import type { Compass } from '../../helpers/compass';
import {
  cleanup,
  init,
  screenshotIfFailed,
  Selectors,
} from '../../helpers/compass';
import type { CompassBrowser } from '../../helpers/compass-browser';
import { createNumbersCollection } from '../../helpers/insert-data';
import {
  DEFAULT_CONNECTION_NAMES,
  isTestingAtlasCloudSandbox,
} from '../../helpers/test-runner-context';

describe('Rolling indexes', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(function () {
    if (!isTestingAtlasCloudSandbox()) {
      this.skip();
    }
  });

  beforeEach(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
    await cleanup(compass);
  });

  it('should be able to create, list, and delete rolling indexes', async function () {
    // Building rolling indexes is a slow process
    const extendedRollingIndexesTimeout = 1000 * 60 * 10;

    this.timeout(extendedRollingIndexesTimeout * 1.2);

    await createNumbersCollection();
    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAMES[0],
      'test',
      'numbers',
      'Indexes'
    );

    const indexName = 'compass-e2e-rolling-build-index-for-testing';

    // Fail fast if index with this name already exists: should never happen as
    // every run in CI gets their own cluster but if we try to create over
    // existing or one being created, it can bork the whole cluster and we don't
    // want that
    await browser
      .$(Selectors.indexComponent(indexName))
      .waitForDisplayed({ reverse: true });

    await browser.createIndex(
      { fieldName: 'i', indexType: '1' },
      { rollingIndex: true, indexName }
    );

    // Special rolling index badge indicating that build has started (we got it
    // listed by automation agent)
    await browser
      .$(Selectors.indexComponent(indexName))
      .$('[data-testid="index-building"]')
      .waitForDisplayed();

    // Now wait for index to finish building
    await browser
      .$(Selectors.indexComponent(indexName))
      .$('[data-testid="index-ready"]')
      .waitForDisplayed({
        timeout: extendedRollingIndexesTimeout,
        // Building a rolling index is a slow process, no need to check too
        // often
        interval: 2_000,
      });

    // Now that it's ready, delete it (it will also check that it's eventually
    // removed from the list)
    await browser.dropIndex(indexName);
  });
});
