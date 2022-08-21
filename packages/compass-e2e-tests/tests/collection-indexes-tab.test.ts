import chai from 'chai';
import semver from 'semver';

import type { CompassBrowser } from '../helpers/compass-browser';
import {
  MONGODB_VERSION,
  beforeTests,
  afterTests,
  afterTest,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';

const { expect } = chai;

describe('Collection indexes tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.connectWithConnectionString('mongodb://localhost:27091/test');
    await browser.navigateToCollectionTab('test', 'numbers', 'Indexes');
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('lists indexes', async function () {
    const element = await browser.$(Selectors.IndexList);
    await element.waitForDisplayed();

    const indexes = await browser.$$(Selectors.IndexComponent);
    expect(indexes).to.have.lengthOf(1);

    const indexFieldNameElement = await browser.$(Selectors.IndexFieldName);
    expect(await indexFieldNameElement.getText()).to.equal('_id_');
  });

  it('supports creating and dropping indexes', async function () {
    await browser.clickVisible(Selectors.CreateIndexButton);

    const createModal = await browser.$(Selectors.CreateIndexModal);
    await createModal.waitForDisplayed();

    const fieldNameSelect = await browser.$(
      Selectors.CreateIndexModalFieldNameSelectInput(0)
    );

    await browser.setValueVisible(fieldNameSelect, 'i');
    await browser.keys(['Enter']);

    const fieldTypeSelect = await browser.$(
      Selectors.CreateIndexModalFieldTypeSelectButton(0)
    );
    await fieldTypeSelect.waitForDisplayed();
    await fieldTypeSelect.click();

    const fieldTypeSelectMenu = await browser.$(
      Selectors.CreateIndexModalFieldTypeSelectMenu(0)
    );
    await fieldTypeSelectMenu.waitForDisplayed();

    const fieldTypeSelectSpan = await fieldTypeSelectMenu.$('span=text');

    await fieldTypeSelectSpan.waitForDisplayed();
    await fieldTypeSelectSpan.click();

    await browser.clickVisible(Selectors.CreateIndexConfirmButton);

    await createModal.waitForDisplayed({ reverse: true });

    const indexComponent = await browser.$(Selectors.indexComponent('i_text'));
    await indexComponent.waitForDisplayed();

    await browser.clickVisible(Selectors.dropIndexButton('i_text'));

    const dropModal = await browser.$(Selectors.DropIndexModal);
    await dropModal.waitForDisplayed();

    const confirmInput = await browser.$(Selectors.DropIndexModalConfirmName);
    await confirmInput.waitForDisplayed();
    await confirmInput.setValue('i_text');

    await browser.clickVisible(Selectors.DropIndexModalConfirmButton);

    await dropModal.waitForDisplayed({ reverse: true });

    await indexComponent.waitForDisplayed({ reverse: true });
  });

  describe('server version 4.2.0', function () {
    it('supports creating a wildcard index', async function () {
      if (semver.lt(MONGODB_VERSION, '4.2.0')) {
        return this.skip();
      }

      await browser.clickVisible(Selectors.CreateIndexButton);

      const createModal = await browser.$(Selectors.CreateIndexModal);
      await createModal.waitForDisplayed();

      // Select i filed name from Combobox.
      const fieldNameSelect = await browser.$(
        Selectors.CreateIndexModalFieldNameSelectInput(0)
      );

      await browser.setValueVisible(fieldNameSelect, '$**');
      await browser.keys(['Enter']);

      // Select text filed type from Select.
      const fieldTypeSelect = await browser.$(
        Selectors.CreateIndexModalFieldTypeSelectButton(0)
      );
      await fieldTypeSelect.waitForDisplayed();

      await fieldTypeSelect.click();

      const fieldTypeSelectMenu = await browser.$(
        Selectors.CreateIndexModalFieldTypeSelectMenu(0)
      );
      await fieldTypeSelectMenu.waitForDisplayed();

      const fieldTypeSelectSpan = await fieldTypeSelectMenu.$('span=1 (asc)');

      await fieldTypeSelectSpan.waitForDisplayed();
      await fieldTypeSelectSpan.click();

      const indexToggleOptions = await browser.$(Selectors.IndexToggleOptions);
      await indexToggleOptions.click();

      const indexToggleIsWildcard = await browser.$(
        Selectors.IndexToggleIsWildcard
      );

      await indexToggleIsWildcard.waitForDisplayed();
      await browser.clickVisible(Selectors.IndexToggleIsWildcard);

      // set the text in the editor
      await browser.setAceValue(
        Selectors.IndexWildcardProjectionEditor,
        '{ "fieldA": 1, "fieldB.fieldC": 1 }'
      );

      await browser.clickVisible(Selectors.CreateIndexConfirmButton);

      await createModal.waitForDisplayed({ reverse: true });

      const indexComponent = await browser.$(Selectors.indexComponent('$**_1'));
      await indexComponent.waitForDisplayed();

      const indexFieldTypeSelector = `${Selectors.indexComponent('$**_1')} ${
        Selectors.IndexFieldType
      }`;
      const indexFieldTypeElement = await browser.$(indexFieldTypeSelector);
      expect(await indexFieldTypeElement.getText()).to.equal('WILDCARD');
    });
  });

  describe('server version 6.1.0', function () {
    it('supports creating a columnstore index', async function () {
      if (semver.lt(MONGODB_VERSION, '6.1.0-alpha0')) {
        return this.skip();
      }

      await browser.clickVisible(Selectors.CreateIndexButton);

      const createModal = await browser.$(Selectors.CreateIndexModal);
      await createModal.waitForDisplayed();

      // Select i filed name from Combobox.
      const fieldNameSelect = await browser.$(
        Selectors.CreateIndexModalFieldNameSelectInput(0)
      );

      await browser.setValueVisible(fieldNameSelect, '$**');
      await browser.keys(['Enter']);

      // Select text filed type from Select.
      const fieldTypeSelect = await browser.$(
        Selectors.CreateIndexModalFieldTypeSelectButton(0)
      );
      await fieldTypeSelect.waitForDisplayed();

      await fieldTypeSelect.click();

      const fieldTypeSelectMenu = await browser.$(
        Selectors.CreateIndexModalFieldTypeSelectMenu(0)
      );
      await fieldTypeSelectMenu.waitForDisplayed();

      const fieldTypeSelectSpan = await fieldTypeSelectMenu.$(
        'span=columnstore'
      );

      await fieldTypeSelectSpan.waitForDisplayed();
      await fieldTypeSelectSpan.click();

      await browser.clickVisible(Selectors.CreateIndexConfirmButton);

      await createModal.waitForDisplayed({ reverse: true });

      const indexComponent = await browser.$(
        Selectors.indexComponent('columnstore')
      );
      await indexComponent.waitForDisplayed();

      await browser.clickVisible(Selectors.dropIndexButton('columnstore'));

      const dropModal = await browser.$(Selectors.DropIndexModal);
      await dropModal.waitForDisplayed();

      const confirmInput = await browser.$(Selectors.DropIndexModalConfirmName);
      await confirmInput.waitForDisplayed();
      await confirmInput.setValue('columnstore');

      await browser.clickVisible(Selectors.DropIndexModalConfirmButton);

      await dropModal.waitForDisplayed({ reverse: true });

      await indexComponent.waitForDisplayed({ reverse: true });
    });
  });
});
