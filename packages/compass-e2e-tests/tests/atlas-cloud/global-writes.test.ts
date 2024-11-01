import { expect } from 'chai';
import type { Compass } from '../../helpers/compass';
import { cleanup, init, Selectors } from '../../helpers/compass';
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

type GeoShardingState = 'UNSHARDED' | 'SHARDING' | 'SHARD_KEY_CORRECT';

async function createGeoShardKey(
  browser: CompassBrowser,
  formData: GeoShardingFormData
) {
  // shard-collection-form
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

async function waitForState(
  browser: CompassBrowser,
  nextState: GeoShardingState
) {
  await browser.waitUntil(async () => {
    const content = await browser.$(
      Selectors.GlobalWrites.tabStatus(nextState)
    );
    return await content.isDisplayed();
  });
}

async function clickConfirmationAction(
  browser: CompassBrowser,
  actionSelector: string
) {
  await browser.clickVisible(actionSelector);

  const modalElement = await browser.$(Selectors.ConfirmationModal);
  await modalElement.waitForDisplayed();

  await browser.clickVisible(Selectors.confirmationModalConfirmButton());
  await modalElement.waitForDisplayed({ reverse: true });
}

describe('Global writes', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();
  });

  before(function () {
    if (!isTestingAtlasCloudSandbox()) {
      this.skip();
    }
  });

  after(async function () {
    await cleanup(compass);
  });

  it('should be able to shard an unsharded namespace and also unmanage it', async function () {
    // Sharding a collection takes a bit longer
    this.timeout(60_000);

    await createGeospatialCollection();
    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAMES[0],
      'test',
      'geospatial',
      'GlobalWrites'
    );

    // Initial state is loading
    await waitForState(browser, 'UNSHARDED');

    await createGeoShardKey(browser, {
      secondShardKey: 'country',
      keyType: 'HASHED',
    });

    // Wait for the shard key to be correct.
    await waitForState(browser, 'SHARD_KEY_CORRECT');

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
    await waitForState(browser, 'UNSHARDED');
  });

  it('should be able to shard an unsharded namespace and cancel the operation', async function () {
    await createGeospatialCollection();
    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAMES[0],
      'test',
      'geospatial',
      'GlobalWrites'
    );

    // Initial state is loading
    await waitForState(browser, 'UNSHARDED');

    await createGeoShardKey(browser, {
      secondShardKey: 'country',
      keyType: 'UNIQUE',
    });

    // Wait for the shard key to be correct.
    await waitForState(browser, 'SHARDING');

    // Cancel the sharding operation.
    await clickConfirmationAction(
      browser,
      Selectors.GlobalWrites.CancelShardingButton
    );

    // After its cancelled, it should transition back to the unsharded state
    await waitForState(browser, 'UNSHARDED');
  });
});
