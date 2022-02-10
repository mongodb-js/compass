import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

const { expect } = chai;

describe('Collection indexes tab', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');

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

    const nameColumnNameElement = await browser.$(Selectors.NameColumnName);
    expect(await nameColumnNameElement.getText()).to.equal('_id_');
  });

  it('supports creating and dropping indexes', async function () {
    await browser.clickVisible(Selectors.CreateIndexButton);

    const createModal = await browser.$(Selectors.CreateIndexModal);
    await createModal.waitForDisplayed();

    await browser.clickVisible(Selectors.CreateIndexModalFieldSelect);
    const fieldList = await browser.$(
      `${Selectors.CreateIndexModalFieldSelect} [role="listbox"]`
    );
    await fieldList.waitForDisplayed();
    const iOption = await fieldList.$('div=i'); // div element with the text "i"
    iOption.waitForDisplayed();
    iOption.click();

    await browser.clickVisible(Selectors.CreateIndexModalTypeSelect);
    const typeList = await browser.$(
      `${Selectors.CreateIndexModalTypeSelect} [role="listbox"]`
    );
    await typeList.waitForDisplayed();
    const textOption = await typeList.$('div=text'); // div element with the text "text"
    textOption.waitForDisplayed();
    textOption.click();

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
});
