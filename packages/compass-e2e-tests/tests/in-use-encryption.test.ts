import { expect } from 'chai';
import semver from 'semver';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import { MONGODB_VERSION } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createDummyCollections } from '../helpers/insert-data';

describe('FLE2', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let initialEnvVars: NodeJS.ProcessEnv;

  before(async function () {
    if (
      semver.lt(MONGODB_VERSION, '6.0.0-rc0') ||
      process.env.MONGODB_USE_ENTERPRISE !== 'yes'
    ) {
      return this.skip();
    }

    initialEnvVars = Object.assign({}, process.env);
    process.env.COMPASS_CSFLE_SUPPORT = 'true';
    compass = await beforeTests();
    browser = compass.browser;

    await createDummyCollections();
    await browser.connectWithConnectionForm({
      hosts: ['localhost:27091'],
      fleKeyVaultNamespace: 'alena.keyvault',
      fleKey: 'A'.repeat(128),
    });
  });

  after(async function () {
    if (compass) {
      await afterTests(compass, this.currentTest);
    }

    if (initialEnvVars) {
      process.env = initialEnvVars;
    }
  });

  it('can create a fle2 collection', async function () {
    const databaseName = 'test';
    const collectionName = 'my-encrypted-collection';
    await browser.navigateToDatabaseTab(databaseName, 'Collections');

    // open the create collection modal from the button at the top
    await browser.clickVisible(Selectors.DatabaseCreateCollectionButton);
    await browser.addCollection(collectionName, {
      encryptedFields: `{
          fields: [{
            path: 'phoneNumber',
            keyId: UUID("fd6275d7-9260-4e6c-a86b-68ec5240814a"),
            bsonType: 'string',
            queries: { queryType: 'equality' }
          }]
        }`,
    });

    const collectionListFLE2BadgeElement = await browser.$(
      Selectors.CollectionListFLE2Badge
    );
    const collectionListFLE2BadgeElementText =
      await collectionListFLE2BadgeElement.getText();
    expect(collectionListFLE2BadgeElementText).to.equal('QUERYABLE ENCRYPTION');

    await browser.navigateToCollectionTab(
      databaseName,
      collectionName,
      'Documents'
    );

    const collectionHeaderLE2BadgeElement = await browser.$(
      Selectors.CollectionHeaderFLE2Badge
    );
    const collectionHeaderLE2BadgeElementText =
      await collectionHeaderLE2BadgeElement.getText();
    expect(collectionHeaderLE2BadgeElementText).to.include(
      'QUERYABLE ENCRYPTION'
    );
  });
});
