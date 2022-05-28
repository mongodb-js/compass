import path from 'path';
import chai from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import { getFirstListDocument } from '../helpers/read-data';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import {
  createDummyCollections,
  createNumbersCollection,
} from '../helpers/insert-data';

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

async function selectFieldType(
  browser: CompassBrowser,
  fieldName: string,
  fieldType: string
) {
  const selectElement = await browser.$(
    Selectors.importPreviewFieldHeaderSelect(fieldName)
  );
  await selectElement.waitForDisplayed();
  await selectElement.scrollIntoView();
  await selectElement.selectByAttribute('value', fieldType);
}

async function unselectFieldName(browser: CompassBrowser, fieldName: string) {
  const checkboxElement = await browser.$(
    Selectors.importPreviewFieldHeaderCheckbox(fieldName)
  );
  await checkboxElement.waitForDisplayed();
  await checkboxElement.scrollIntoView();
  expect(await checkboxElement.isSelected()).to.be.true;
  await checkboxElement.click();
  expect(await checkboxElement.isSelected()).to.be.false;
}

describe('Collection import', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await createDummyCollections();
    await browser.connectWithConnectionString('mongodb://localhost:27091/test');
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('supports single JSON objects', async function () {
    await browser.navigateToCollectionTab('test', 'json-array', 'Documents');

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
    await browser.setAceValue(
      Selectors.InsertJSONEditor,
      '{ "foo": 10, "long": { "$numberLong": "99" } }'
    );

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
      return text === 'Displaying documents 0 - 1 of 1';
    });

    const result = await getFirstListDocument(browser);

    expect(result._id).to.exist;
    delete result._id;

    expect(result).to.deep.equal({
      foo: '10',
      long: '99',
    });
  });

  it('supports single objects in document view mode', async function () {
    await browser.navigateToCollectionTab('test', 'json-array', 'Documents');

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

    // pick list view
    await browser.clickVisible(
      '[data-test-id="insert-document-dialog-view-list"]'
    );

    // hover over the generated ObjectId to get the '+' for adding a new field
    await browser.hover(
      `${Selectors.InsertDialog} ${Selectors.HadronDocumentElement}`
    );
    await browser.clickVisible(
      `${Selectors.InsertDialog} ${Selectors.HadronDocumentAddElementMenuButton}`
    );
    await browser.clickVisible(
      `${Selectors.InsertDialog} ${Selectors.HadronDocumentAddSibling}`
    );

    // Add field data
    const keyInput = await browser.$(
      `${Selectors.InsertDialog} ${Selectors.HadronDocumentElement}:last-child ${Selectors.HadronDocumentKeyEditor}`
    );
    await keyInput.setValue('bar');
    const valueInput = await browser.$(
      `${Selectors.InsertDialog} ${Selectors.HadronDocumentElement}:last-child ${Selectors.HadronDocumentValueEditor}`
    );
    await valueInput.setValue('42');

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
      return text === 'Displaying documents 0 - 1 of 1';
    });

    const result = await getFirstListDocument(browser);

    expect(result._id).to.exist;
    delete result._id;

    expect(result).to.deep.equal({
      bar: '"42"',
    });
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

    const result = await getFirstListDocument(browser);

    expect(result._id).to.exist;
    delete result._id;

    expect(result).to.deep.equal({
      n: '0',
      n_square: '0',
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

    const result = await getFirstListDocument(browser);

    expect(result._id).to.exist;
    delete result._id;

    expect(result).to.deep.equal({
      id: '2818',
      name: '"Quiet Garden View Room & Super Fast WiFi"',
      host_id: '3159',
      host_name: '"Daniel"',
      neighbourhood: '"Oostelijk Havengebied - Indische Buurt"',
      neighbourhood_group: '""',
      latitude: '52.36435',
      longitude: '4.94358',
      room_type: '"Private room"',
      price: '59',
      minimum_nights: '3',
      number_of_reviews: '280',
      last_review: '"2019-11-21"', // NOTE: wasn't automatically interpreted as a date
      reviews_per_month: '2.86',
      calculated_host_listings_count: '1',
      availability_365: '124',
      number_of_reviews_ltm: '2',
      license: '"0363 5F3A 5684 6750 D14D"',
    });
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

    const result = await getFirstListDocument(browser);

    expect(result._id).to.exist;
    delete result._id;

    // Array and Object could be expanded, but this is probably good enough.
    expect(result).to.deep.equal({
      arrayField_canonical: 'Array',
      arrayField_relaxed: 'Array',
      dateBefore1970: '1920-01-01T00:00:00.000+00:00',
      dateField_canonical: '2019-08-11T17:54:14.692+00:00',
      dateField_relaxed: '2019-08-11T17:54:14.692+00:00',
      decimal128Field: '10.99',
      documentField: 'Object',
      doubleField_canonical: '10.5',
      doubleField_relaxed: '10.5',
      infiniteNumber: 'Infinity',
      int32field_canonical: '10',
      int32field_relaxed: '10',
      int64Field_canonical: '50',
      int64Field_relaxed: '50',
      maxKeyField: 'MaxKey()',
      minKeyField: 'MinKey()',
      regexField: '/^H/i',
      timestampField: 'Timestamp({ t: 1565545664, i: 1 })',
    });
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
    const errorElement = await browser.$(Selectors.ImportErrorBox);
    await errorElement.waitForDisplayed();
    const errorText = await errorElement.getText();
    expect(errorText).to.contain('Unexpected token "i"');

    // click the cancel button
    await browser.clickVisible(Selectors.ImportCancel);

    // wait for the modal to go away
    await importModal.waitForDisplayed({ reverse: false });
  });

  it('supports CSV files', async function () {
    const csvPath = path.resolve(__dirname, '..', 'fixtures', 'listings.csv');

    await browser.navigateToCollectionTab('test', 'csv-file', 'Documents');

    // open the import modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = await browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // wait for the modal to appear and select the file
    const importModal = await browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed({ timeout: 10_000 });
    await browser.selectFile(Selectors.ImportFileInput, csvPath);

    // make sure it auto-selected CSV
    const fileTypeCSV = await browser.$(Selectors.FileTypeCSV);
    await browser.waitUntil(async () => {
      const selected = await fileTypeCSV.getAttribute('aria-selected');
      return selected === 'true';
    });

    // pick some types
    const typeMapping = {
      id: 'Number',
      host_id: 'Number',
      latitude: 'Double',
      longitude: 'Double',
      price: 'Number',
      minimum_nights: 'Number',
      number_of_reviews: 'Number',
      last_review: 'Date',
      reviews_per_month: 'Double',
      calculated_host_listings_count: 'Number',
      availability_365: 'Number',
      number_of_reviews_ltm: 'Number',
    };

    for (const [fieldName, fieldType] of Object.entries(typeMapping)) {
      await selectFieldType(browser, fieldName, fieldType);
    }

    // deselect a field
    await unselectFieldName(browser, 'license');

    // confirm
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

    const result = await getFirstListDocument(browser);

    // _id is different every time
    expect(result._id).to.exist;
    delete result._id;

    // The values are the text as they appear in the page, so numbers are
    // strings, strings have double-quotes inside them and the date got
    // formatted.
    expect(result).to.deep.equal({
      id: '2818',
      name: '"Quiet Garden View Room & Super Fast WiFi"',
      host_id: '3159',
      host_name: '"Daniel"',
      neighbourhood: '"Oostelijk Havengebied - Indische Buurt"',
      latitude: '52.36435',
      longitude: '4.94358',
      room_type: '"Private room"',
      price: '59',
      minimum_nights: '3',
      number_of_reviews: '280',
      last_review: '2019-11-21T00:00:00.000+00:00',
      reviews_per_month: '2.86',
      calculated_host_listings_count: '1',
      availability_365: '124',
      number_of_reviews_ltm: '2',
      // NOTE: no license field
    });
  });

  it('supports CSV files with BOM', async function () {
    const csvPath = path.resolve(
      __dirname,
      '..',
      'fixtures',
      'source-with-bom.csv'
    );

    await browser.navigateToCollectionTab('test', 'bom-csv-file', 'Documents');

    // open the import modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = await browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // wait for the modal to appear and select the file
    const importModal = await browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed({ timeout: 10_000 });
    await browser.selectFile(Selectors.ImportFileInput, csvPath);

    // make sure it auto-selected CSV
    const fileTypeCSV = await browser.$(Selectors.FileTypeCSV);
    await browser.waitUntil(async () => {
      const selected = await fileTypeCSV.getAttribute('aria-selected');
      return selected === 'true';
    });

    const selectImportDelimiter = await browser.$(Selectors.ImportDelimiter);
    await selectImportDelimiter.waitForDisplayed();
    await selectImportDelimiter.scrollIntoView();
    await selectImportDelimiter.selectByAttribute('value', ';');

    // pick some types
    const typeMapping = {
      amount: 'Number',
      description: 'String',
      category: 'Number',
      name: 'String',
      order: 'String',
      color: 'String',
      date: 'String',
    };

    for (const [fieldName, fieldType] of Object.entries(typeMapping)) {
      await selectFieldType(browser, fieldName, fieldType);
    }

    // confirm
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
    expect(text).to.equal('Displaying documents 1 - 1 of 1');

    const result = await getFirstListDocument(browser);

    // _id is different every time
    expect(result._id).to.exist;
    delete result._id;

    // The values are the text as they appear in the page, so numbers are
    // strings, strings have double-quotes inside them and the date got
    // formatted.
    expect(result).to.deep.equal({
      amount: '18080',
      category: '9',
      name: '"anything"',
      order: '"9"',
      date: '"12-01-2016"',
      // NOTE: amount is a number.
    });
  });

  it('displays an error if an incompatible type is chosen for a column', async function () {
    const csvPath = path.resolve(__dirname, '..', 'fixtures', 'listings.csv');

    await browser.navigateToCollectionTab('test', 'csv-file', 'Documents');

    // open the import modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = await browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // wait for the modal to appear and select the file
    const importModal = await browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed({ timeout: 10_000 });
    await browser.selectFile(Selectors.ImportFileInput, csvPath);

    // make sure it auto-selected CSV
    const fileTypeCSV = await browser.$(Selectors.FileTypeCSV);
    await browser.waitUntil(async () => {
      const selected = await fileTypeCSV.getAttribute('aria-selected');
      return selected === 'true';
    });

    // pick an incompatible type
    await selectFieldType(browser, 'id', 'ObjectID');

    // confirm
    await browser.clickVisible(Selectors.ImportConfirm);

    // wait for the error message to appear
    const errorElement = await browser.$(Selectors.ImportErrorBox);
    await errorElement.waitForDisplayed();
    const errorText = await errorElement.getText();
    expect(errorText).to.equal(
      'Argument passed in must be a string of 12 bytes or a string of 24 hex characters or an integer'
    );

    // click the cancel button
    await browser.clickVisible(Selectors.ImportCancel);

    // wait for the modal to go away
    await importModal.waitForDisplayed({ reverse: false });
  });
});
