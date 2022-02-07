import path from 'path';
import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

const { expect } = chai;

describe('Collection import', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;

    await browser.connectWithConnectionString('mongodb://localhost:27018/test');
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('supports JSON arrays', async function () {
    await browser.navigateToCollectionTab('test', 'json-array', 'Documents');

    const array = [];
    for (let i = 0; i < 1000; ++i) {
      array.push({ n: i, n_square: i * i });
    }
    const json = JSON.stringify(array);

    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = await browser.$(
      Selectors.InsertDocumentOption
    );
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.InsertDocumentOption);

    const insertDialog = await browser.$(Selectors.InsertDialog);
    await insertDialog.waitForDisplayed();
    await browser.setAceValue(Selectors.InsertJSONEditor, json);

    const insertConfirm = await browser.$(Selectors.InsertConfirm);
    // this selector is very brittle, so just make sure it works
    expect(await insertConfirm.isDisplayed()).to.be.true;
    expect(await insertConfirm.getText()).to.equal('Insert');
    await insertConfirm.waitForEnabled();
    await browser.clickVisible(Selectors.InsertConfirm);

    await insertDialog.waitForDisplayed({ reverse: true });
    const messageElement = await browser.$(
      Selectors.DocumentListActionBarMessage
    );
    await browser.waitUntil(async () => {
      const text = await messageElement.getText();
      return text === 'Displaying documents 1 - 20 of 1000';
    });
  });

  it('supports JSON files', async function () {
    const jsonPath = path.resolve(__dirname, '..', 'fixtures', 'listings.json');

    await browser.navigateToCollectionTab('test', 'json-file', 'Documents');

    // open the import modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = await browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // wait for the modal to appear and select the file
    const importModal = await browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed({ timeout: 10_000 });
    await browser.selectFile(Selectors.ImportFileInput, jsonPath);

    // make sure it auto-selected JSON and then confirm
    const fileTypeJSON = await browser.$(Selectors.FileTypeJSON);
    await browser.waitUntil(async () => {
      const selected = await fileTypeJSON.getAttribute('aria-selected');
      return selected === 'true';
    });
    await browser.clickVisible(Selectors.ImportConfirm);

    // wait for the done button to appear and then click it
    const doneButton = await browser.$(Selectors.ImportDone);
    await doneButton.waitForDisplayed({ timeout: 60_000 });
    await browser.clickVisible(Selectors.ImportDone);

    // wait for the modal to go away
    await importModal.waitForDisplayed({ reverse: false });
    const messageElement = await browser.$(
      Selectors.DocumentListActionBarMessage
    );
    const text = await messageElement.getText();
    expect(text).to.equal('Displaying documents 1 - 20 of 16116');
  });

  it('supports JSON files with select fields');
  it('supports JSON files with set field types');
  it('supports JSON files with extended json');
  it('supports malformed JSON array');
  it('supports malformed JSON lines file');
  it('supports CSV files with comma separator');
  it('supports CSV files with tab separator');
  it('supports CSV files with semicolon separator');
  it('supports CSV files with select fields');
  it('supports CSV files with set field types');
  it('supports malformed CSV file');
});
