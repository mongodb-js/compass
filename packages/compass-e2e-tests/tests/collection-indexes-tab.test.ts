import chai from 'chai';

import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  serverSatisfies,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

const { expect } = chai;

describe('Collection indexes tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.disconnectAll();
    await browser.connectToDefaults();
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'numbers',
      'Indexes'
    );
  });

  after(async function () {
    await cleanup(compass);
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('lists indexes', async function () {
    const element = browser.$(Selectors.IndexList);
    await element.waitForDisplayed();

    // This seems to sometimes render an empty list momentarily before it has
    // the list loaded and browser.$$ doesn't wait.
    await browser.waitUntil(async function () {
      const numIndexes = await browser.$$(Selectors.indexComponent('_id_'))
        .length;
      return numIndexes === 1;
    });

    const indexFieldNameElement = browser.$(
      `${Selectors.indexComponent('_id_')} ${Selectors.IndexFieldName}`
    );
    expect(await indexFieldNameElement.getText()).to.equal('_id_');
  });

  it('supports creating and dropping indexes', async function () {
    const createdIndexName = await browser.createIndex(
      {
        fieldName: 'i',
        indexType: 'text',
      },
      undefined,
      'create-index-modal-basic.png'
    );

    await browser.dropIndex(createdIndexName, 'drop-index-modal-basic.png');
  });

  describe('server version 4.2.0', function () {
    it('supports creating a wildcard index', async function () {
      if (serverSatisfies('< 4.2.0')) {
        return this.skip();
      }

      const indexName = await browser.createIndex(
        {
          fieldName: '$**',
          indexType: '1',
        },
        {
          wildcardProjection: '{ "fieldA": 1, "fieldB.fieldC": 1 }',
        },
        'create-index-modal-wildcard.png'
      );

      const indexFieldTypeSelector = `${Selectors.indexComponent(indexName)} ${
        Selectors.IndexFieldType
      }`;
      const indexFieldTypeElement = browser.$(indexFieldTypeSelector);
      expect(await indexFieldTypeElement.getText()).to.equal('WILDCARD');

      await browser.dropIndex(indexName, 'drop-index-modal-wildcard.png');
    });
  });

  describe('server version 4.4.0', function () {
    it('supports hiding and unhiding indexes', async function () {
      if (serverSatisfies('< 4.4.0')) {
        return this.skip();
      }

      const indexName = await browser.createIndex({
        fieldName: 'i',
        indexType: 'text',
      });

      await browser.hideIndex(indexName, 'hide-index-modal.png');
      await browser.unhideIndex(indexName, 'unhide-index-modal.png');
    });
  });

  describe('server version 20.0.0', function () {
    // This feature got moved behind a feature flag
    // https://jira.mongodb.org/browse/SERVER-74901
    it.skip('supports creating a columnstore index', async function () {
      if (serverSatisfies('< 20.0.0-alpha0')) {
        return this.skip();
      }

      await browser.clickVisible(Selectors.CreateIndexButton);

      const createModal = browser.$(Selectors.CreateIndexModal);
      await createModal.waitForDisplayed();

      // Select i filed name from Combobox.
      const fieldNameSelect = browser.$(
        Selectors.createIndexModalFieldNameSelectInput(0)
      );

      await browser.setValueVisible(fieldNameSelect, '$**');
      await browser.keys(['Enter']);

      // Select text filed type from Select.
      const fieldTypeSelect = browser.$(
        Selectors.createIndexModalFieldTypeSelectButton(0)
      );
      await fieldTypeSelect.waitForDisplayed();

      await fieldTypeSelect.click();

      const fieldTypeSelectMenu = browser.$(
        Selectors.createIndexModalFieldTypeSelectMenu(0)
      );
      await fieldTypeSelectMenu.waitForDisplayed();

      await browser.clickVisible(`li[value="columnstore"]`);

      await browser.clickVisible(Selectors.IndexToggleOptions);
      await browser.clickVisible(Selectors.indexToggleOption('name'));

      await browser.setValueVisible(
        Selectors.indexOptionInput('name'),
        'columnstore'
      );

      await browser.clickVisible(Selectors.CreateIndexConfirmButton);

      await createModal.waitForDisplayed({ reverse: true });

      const indexComponent = browser.$(Selectors.indexComponent('columnstore'));
      await indexComponent.waitForDisplayed();
      await browser.hover(Selectors.indexComponent('columnstore'));

      await browser.clickVisible(
        `${Selectors.indexComponent('columnstore')} ${
          Selectors.IndexesTableDropIndexButton
        }`
      );

      const dropModal = browser.$(Selectors.DropIndexModal);
      await dropModal.waitForDisplayed();

      await browser.setValueVisible(
        Selectors.DropIndexModalConfirmButton,
        'columnstore'
      );

      const ConfirmButtonSelector = Selectors.confirmationModalConfirmButton(
        Selectors.DropIndexModal
      );
      await browser.clickVisible(ConfirmButtonSelector);

      await dropModal.waitForDisplayed({ reverse: true });

      await indexComponent.waitForDisplayed({ reverse: true });
    });
  });
});
