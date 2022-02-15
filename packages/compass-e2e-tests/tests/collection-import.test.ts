import path from 'path';
import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

const { expect } = chai;

async function importJSONFile(browser: CompassBrowser, jsonPath: string) {
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
}

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

    // browse to the "Insert to Collection" modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = await browser.$(
      Selectors.InsertDocumentOption
    );
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.InsertDocumentOption);

    // wait for the modal to appear
    const insertDialog = await browser.$(Selectors.InsertDialog);
    await insertDialog.waitForDisplayed();

    // set the text in the editor
    await browser.setAceValue(Selectors.InsertJSONEditor, json);

    // confirm
    const insertConfirm = await browser.$(Selectors.InsertConfirm);
    // this selector is very brittle, so just make sure it works
    expect(await insertConfirm.isDisplayed()).to.be.true;
    expect(await insertConfirm.getText()).to.equal('Insert');
    await insertConfirm.waitForEnabled();
    await browser.clickVisible(Selectors.InsertConfirm);

    // wait for the modal to go away
    await insertDialog.waitForDisplayed({ reverse: true });

    // make sure the documents appear in the collection
    const messageElement = await browser.$(
      Selectors.DocumentListActionBarMessage
    );
    await browser.waitUntil(async () => {
      const text = await messageElement.getText();
      return text === 'Displaying documents 1 - 20 of 1000';
    });
  });

  it('displays an error for a malformed JSON array', async function () {
    await browser.navigateToCollectionTab('test', 'json-array', 'Documents');

    const json = 'this is not valid JSON';

    // browse to the "Insert to Collection" modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = await browser.$(
      Selectors.InsertDocumentOption
    );
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.InsertDocumentOption);

    // wait for the modal to appear
    const insertDialog = await browser.$(Selectors.InsertDialog);
    await insertDialog.waitForDisplayed();

    // set the text in the editor
    await browser.setAceValue(Selectors.InsertJSONEditor, json);

    // make sure that there's an error and that the insert button is disabled
    const errorElement = await browser.$(Selectors.InsertDialogErrorMessage);
    await errorElement.waitForDisplayed();
    expect(await errorElement.getText()).to.equal(
      'Insert not permitted while document contains errors.'
    );
    const insertButton = await browser.$(Selectors.InsertConfirm);
    await insertButton.waitForEnabled({ reverse: true });

    // cancel and wait for the modal to go away
    await browser.clickVisible(Selectors.InsertCancel);
    await insertDialog.waitForDisplayed({ reverse: true });
  });

  it('supports JSON files', async function () {
    const jsonPath = path.resolve(__dirname, '..', 'fixtures', 'listings.json');

    await browser.navigateToCollectionTab('test', 'json-file', 'Documents');

    await importJSONFile(browser, jsonPath);

    const messageElement = await browser.$(
      Selectors.DocumentListActionBarMessage
    );
    const text = await messageElement.getText();
    expect(text).to.equal('Displaying documents 1 - 20 of 16116');
  });

  it('supports JSON files with extended json', async function () {
    const jsonPath = path.resolve(
      __dirname,
      '..',
      'fixtures',
      'extended-json.json'
    );

    await browser.navigateToCollectionTab(
      'test',
      'extended-json-file',
      'Documents'
    );

    await importJSONFile(browser, jsonPath);

    const messageElement = await browser.$(
      Selectors.DocumentListActionBarMessage
    );
    const text = await messageElement.getText();
    expect(text).to.equal('Displaying documents 1 - 1 of 1');
  });

  it('displays an error for a malformed JSON file', async function () {
    const jsonPath = path.resolve(__dirname, '..', 'fixtures', 'listings.csv'); // NOTE: not JSON

    await browser.navigateToCollectionTab(
      'test',
      'extended-json-file',
      'Documents'
    );

    // open the import modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = await browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // wait for the modal to appear and select the file
    const importModal = await browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed({ timeout: 10_000 });
    await browser.selectFile(Selectors.ImportFileInput, jsonPath);

    // select file type JSON
    const fileTypeJSON = await browser.$(Selectors.FileTypeJSON);
    await fileTypeJSON.waitForDisplayed();
    await fileTypeJSON.click();
    await browser.waitUntil(async () => {
      const selected = await fileTypeJSON.getAttribute('aria-selected');
      return selected === 'true';
    });
    await browser.clickVisible(Selectors.ImportConfirm);

    // wait for the error message to appear
    const errorElement = await browser.$('[data-test-id="import-error-box"]');
    await errorElement.waitForDisplayed();
    const errorText = await errorElement.getText();
    expect(errorText).to.contain('Unexpected token "i"');

    // click the cancel button
    await browser.clickVisible(
      '[data-test-id="import-modal"] [data-test-id="cancel-button"]'
    );

    // wait for the modal to go away
    await importModal.waitForDisplayed({ reverse: false });
  });

  it('supports CSV files with comma separator');
  it('supports CSV files with tab separator');
  it('supports CSV files with semicolon separator');
  it('supports CSV files with select fields');
  it('supports CSV files with set field types');
  it('displays an error for a malformed CSV file');
});
