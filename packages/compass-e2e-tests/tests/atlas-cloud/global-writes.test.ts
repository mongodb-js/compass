import { expect } from 'chai';
import type { Compass } from '../../helpers/compass';
import {
  cleanup,
  init,
  screenshotIfFailed,
  Selectors,
} from '../../helpers/compass';
import type { CompassBrowser } from '../../helpers/compass-browser';
import { createGeospatialCollection } from '../../helpers/insert-data';
import {
  DEFAULT_CONNECTION_NAMES,
  isTestingAtlasCloudSandbox,
} from '../../helpers/test-runner-context';

type GeoShardingFormData = {
  secondShardKey: string;
  keyType?: 'UNIQUE' | 'HASHED';
};

type GeoShardingStatus =
  | 'UNSHARDED'
  | 'SHARDING'
  | 'SHARD_KEY_CORRECT'
  | 'INCOMPLETE_SHARDING_SETUP';

const WEBDRIVER_TIMEOUT = 1000 * 60 * 10;
const MOCHA_TIMEOUT = WEBDRIVER_TIMEOUT * 1.2;

async function createGeoShardKey(
  browser: CompassBrowser,
  formData: GeoShardingFormData
) {
  await browser.setComboBoxValue(
    Selectors.GlobalWrites.ShardKeyFormSecondKeyInputCombobox,
    formData.secondShardKey
  );

  if (formData.keyType) {
    await browser.clickVisible(
      Selectors.GlobalWrites.ShardKeyFormAdvancedOptionsToggle
    );
    await browser.clickParent(
      Selectors.GlobalWrites.shardKeyFormIndexType(formData.keyType)
    );
  }
  await browser.clickVisible(Selectors.GlobalWrites.ShardKeyFormSubmitButton);
}

async function waitForGlobalWritesStatus(
  browser: CompassBrowser,
  nextStatus: GeoShardingStatus
) {
  await browser.waitUntil(
    async () => {
      return await browser
        .$(Selectors.GlobalWrites.tabStatus(nextStatus))
        .isDisplayed();
    },
    {
      timeout: WEBDRIVER_TIMEOUT,
      // Sharding is slow process, no need to check too often, just makes the
      // logs hard to read
      interval: 2_000,
    }
  );
}

describe('Global writes', function () {
  // Sharding a collection takes a bit longer
  this.timeout(MOCHA_TIMEOUT);

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

  it('should be able to shard an unsharded namespace and also unmanage it', async function () {
    const collName = `global-writes-geospatial-${Date.now()}`;

    await createGeospatialCollection(collName);
    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAMES[0],
      'test',
      collName,
      'GlobalWrites'
    );

    // Initial state is loading
    await waitForGlobalWritesStatus(browser, 'UNSHARDED');

    await createGeoShardKey(browser, {
      secondShardKey: 'country',
      keyType: 'HASHED',
    });

    // Wait for the shard key to be correct.
    await waitForGlobalWritesStatus(browser, 'SHARD_KEY_CORRECT');

    // Expectations to see the shard key in the UI
    const findingDocumentsText = await browser
      .$(Selectors.GlobalWrites.SampleFindingDocuments)
      .getText();

    const insertedDocumentsText = await browser
      .$(Selectors.GlobalWrites.SampleInsertingDocuments)
      .getText();

    expect(findingDocumentsText).to.include('country');
    expect(insertedDocumentsText).to.include('country');

    // Unmanage the namespace
    await browser.clickVisible(Selectors.GlobalWrites.UnmanageNamespaceButton);

    // It transitions to the unmanaging state
    await waitForGlobalWritesStatus(browser, 'INCOMPLETE_SHARDING_SETUP');

    // This time there should be a button to manage the namespace again, but not the form
    await browser
      .$(Selectors.GlobalWrites.ManageNamespaceButton)
      .waitForDisplayed();
    await browser
      .$(Selectors.GlobalWrites.ShardKeyFormSecondKeyInputCombobox)
      .waitForDisplayed({ reverse: true });
  });

  it('should be able to shard an unsharded namespace and cancel the operation', async function () {
    const collName = `global-writes-geospatial-${Date.now()}`;

    await createGeospatialCollection(collName);
    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAMES[0],
      'test',
      collName,
      'GlobalWrites'
    );

    // Initial state is loading
    await waitForGlobalWritesStatus(browser, 'UNSHARDED');

    await createGeoShardKey(browser, {
      secondShardKey: 'country',
      keyType: 'UNIQUE',
    });

    // Wait for the shard key to be correct.
    await waitForGlobalWritesStatus(browser, 'SHARDING');

    // Cancel the sharding operation.
    await browser.clickConfirmationAction(
      Selectors.GlobalWrites.CancelShardingButton
    );

    // After its cancelled, it should transition back to the unsharded state
    await waitForGlobalWritesStatus(browser, 'UNSHARDED');
  });
});
