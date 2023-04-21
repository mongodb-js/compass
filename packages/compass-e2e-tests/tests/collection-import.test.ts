import path from 'path';
import chai from 'chai';
import { promises as fs } from 'fs';

import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import { getFirstListDocument } from '../helpers/read-first-document-content';
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

  // Select the file.
  await browser.selectFile(Selectors.ImportFileInput, jsonPath);

  // Wait for the modal to appear.
  const importModal = await browser.$(Selectors.ImportModal);
  await importModal.waitForDisplayed();

  // Confirm import.
  await browser.clickVisible(Selectors.ImportConfirm);

  // Wait for the modal to go away.
  await importModal.waitForDisplayed({ reverse: true });

  // Wait for the done toast to appear and close it.
  const toastElement = await browser.$(Selectors.ImportToast);
  await toastElement.waitForDisplayed();
  await browser
    .$(Selectors.closeToastButton(Selectors.ImportToast))
    .waitForDisplayed();
  await browser.clickVisible(Selectors.closeToastButton(Selectors.ImportToast));

  await toastElement.waitForDisplayed({ reverse: true });
}

async function selectFieldType(
  browser: CompassBrowser,
  fieldName: string,
  fieldType: string
) {
  await browser.clickVisible(
    Selectors.importPreviewFieldHeaderSelect(fieldName)
  );

  const fieldTypeSelectMenu = await browser.$(
    Selectors.importPreviewFieldHeaderSelectMenu(fieldName)
  );
  await fieldTypeSelectMenu.waitForDisplayed();

  const fieldTypeSelectSpan = await fieldTypeSelectMenu.$(`span=${fieldType}`);
  await fieldTypeSelectSpan.waitForDisplayed();
  await fieldTypeSelectSpan.scrollIntoView();
  await browser.pause(1000);
  await fieldTypeSelectSpan.click();

  // Wait so that the menu animation can complete.
  // Without this clicking multiple select menus bugs out.
  await fieldTypeSelectMenu.waitForDisplayed({
    reverse: true,
  });
}

async function unselectFieldName(browser: CompassBrowser, fieldName: string) {
  const checkboxElement = await browser.$(
    Selectors.importPreviewFieldHeaderCheckbox(fieldName)
  );
  const checkboxLabel = await checkboxElement.parentElement();
  await checkboxLabel.waitForDisplayed();
  await checkboxLabel.scrollIntoView();
  expect(await checkboxElement.isSelected()).to.be.true;
  await checkboxLabel.click();
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
    await browser.connectWithConnectionString();

    delete process.env.COMPASS_E2E_TEST_IMPORT_ABORT_TIMEOUT;
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
      return text === '1 – 1 of 1';
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
      '[data-testid="insert-document-dialog-view-list"]'
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
      return text === '1 – 1 of 1';
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
      return text === '1 – 20 of 1000';
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
    expect(text).to.equal('1 – 20 of 16116');

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
    expect(text).to.equal('1 – 1 of 1');

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
    const jsonPath = path.resolve(
      __dirname,
      '..',
      'fixtures',
      'broken-json.json'
    );

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

    // Select the file.
    await browser.selectFile(Selectors.ImportFileInput, jsonPath);
    // Wait for the modal to appear.
    const importModal = await browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed();

    // Confirm import.
    await browser.clickVisible(Selectors.ImportConfirm);

    // Wait for the modal to go away.
    await importModal.waitForDisplayed({ reverse: true });

    // Wait for the error toast to appear and close it.
    const toastElement = await browser.$(Selectors.ImportToast);
    await toastElement.waitForDisplayed();
    const errorText = await toastElement.getText();
    expect(errorText).to.include('Failed to import with the following error');
    expect(errorText).to.include('Parser has expected a value');
    await browser
      .$(Selectors.closeToastButton(Selectors.ImportToast))
      .waitForDisplayed();
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ImportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });
  });

  it('supports CSV files', async function () {
    const csvPath = path.resolve(__dirname, '..', 'fixtures', 'listings.csv');

    await browser.navigateToCollectionTab('test', 'csv-file', 'Documents');

    // open the import modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = await browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // Select the file.
    // Unfortunately this opens a second open dialog and the one that got
    // automatically opened when clicking on import file sticks around on top of
    // everything :(
    await browser.selectFile(Selectors.ImportFileInput, csvPath);

    // Wait for the modal to appear.
    const importModal = await browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed();

    // wait for it to finish analyzing
    await browser.$(Selectors.ImportConfirm).waitForDisplayed();
    await browser
      .$(Selectors.importPreviewFieldHeaderField('id'))
      .waitForDisplayed();

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

    // Confirm import.
    await browser.clickVisible(Selectors.ImportConfirm);

    // Wait for the modal to go away.
    await importModal.waitForDisplayed({ reverse: true });

    // Wait for the done toast to appear and close it.
    const toastElement = await browser.$(Selectors.ImportToast);
    await toastElement.waitForDisplayed();
    await browser
      .$(Selectors.closeToastButton(Selectors.ImportToast))
      .waitForDisplayed();
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ImportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });

    const messageElement = await browser.$(
      Selectors.DocumentListActionBarMessage
    );
    const text = await messageElement.getText();
    expect(text).to.equal('1 – 20 of 16116');

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

    // Select the file.
    await browser.selectFile(Selectors.ImportFileInput, csvPath);

    // Wait for the modal to appear.
    const importModal = await browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed();

    // it now autodetects the delimiter
    const importDelimiterSelectButton = await browser.$(
      Selectors.ImportDelimiterSelect
    );
    expect(await importDelimiterSelectButton.getText()).to.equal('Semicolon');

    // wait for it to finish analyzing
    await browser.$(Selectors.ImportConfirm).waitForDisplayed();
    await browser
      .$(Selectors.importPreviewFieldHeaderField('amount'))
      .waitForDisplayed();

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

    // Confirm import.
    await browser.clickVisible(Selectors.ImportConfirm);

    // Wait for the modal to go away.
    await importModal.waitForDisplayed({ reverse: true });

    // Wait for the done toast to appear and close it.
    const toastElement = await browser.$(Selectors.ImportToast);
    await toastElement.waitForDisplayed();
    await browser
      .$(Selectors.closeToastButton(Selectors.ImportToast))
      .waitForDisplayed();
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ImportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });

    const messageElement = await browser.$(
      Selectors.DocumentListActionBarMessage
    );
    const text = await messageElement.getText();
    expect(text).to.equal('1 – 1 of 1');

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

    // Select the file.
    await browser.selectFile(Selectors.ImportFileInput, csvPath);

    // Wait for the modal to appear.
    const importModal = await browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed();

    // wait for it to finish analyzing
    await browser.$(Selectors.ImportConfirm).waitForDisplayed();
    await browser
      .$(Selectors.importPreviewFieldHeaderField('id'))
      .waitForDisplayed();

    // pick an incompatible type
    await selectFieldType(browser, 'id', 'ObjectId');

    // Confirm import.
    await browser.clickVisible(Selectors.ImportConfirm);

    // Wait for the modal to go away.
    await importModal.waitForDisplayed({ reverse: true });

    // Wait for the error toast to appear and close it.
    const toastElement = await browser.$(Selectors.ImportToast);
    await toastElement.waitForDisplayed();
    await browser.waitUntil(async function () {
      const toastText = await toastElement.getText();
      return toastText.includes('"2818" is not an ObjectId');
    });
    await browser
      .$(Selectors.closeToastButton(Selectors.ImportToast))
      .waitForDisplayed();
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ImportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });
  });

  it('allows changing the delimiter', async function () {
    const csvPath = path.resolve(
      __dirname,
      '..',
      'fixtures',
      'source-with-bom.csv'
    );

    await browser.navigateToCollectionTab(
      'test',
      'broken-delimiter',
      'Documents'
    );

    // open the import modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = await browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // select the file
    await browser.selectFile(Selectors.ImportFileInput, csvPath);

    // wait for the modal to appear
    const importModal = await browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed();

    // it now autodetects the delimiter correctly
    const importDelimiterSelectButton = await browser.$(
      Selectors.ImportDelimiterSelect
    );
    expect(await importDelimiterSelectButton.getText()).to.equal('Semicolon');

    // but let's break it anyway
    await importDelimiterSelectButton.waitForDisplayed();
    await importDelimiterSelectButton.click();
    const importDelimiterSelectMenu = await browser.$(
      Selectors.ImportDelimiterMenu
    );
    await importDelimiterSelectMenu.waitForDisplayed();
    const delimiterSelectSpan = await importDelimiterSelectMenu.$('span=Comma');
    await delimiterSelectSpan.waitForDisplayed();
    await delimiterSelectSpan.click();

    // nothing to see here
    const typeMapping = {
      'amount;description;category;name;order;color;date': 'String',
    };

    for (const [fieldName, fieldType] of Object.entries(typeMapping)) {
      await selectFieldType(browser, fieldName, fieldType);
    }

    // Confirm import.
    await browser.clickVisible(Selectors.ImportConfirm);

    // Wait for the modal to go away.
    await importModal.waitForDisplayed({ reverse: true });

    // Wait for the done toast to appear and close it.
    const toastElement = await browser.$(Selectors.ImportToast);
    await toastElement.waitForDisplayed();
    await browser
      .$(Selectors.closeToastButton(Selectors.ImportToast))
      .waitForDisplayed();
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ImportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });

    const messageElement = await browser.$(
      Selectors.DocumentListActionBarMessage
    );
    const text = await messageElement.getText();
    expect(text).to.equal('1 – 1 of 1');

    const result = await getFirstListDocument(browser);

    // _id is different every time
    expect(result._id).to.exist;
    delete result._id;

    // broken as expected
    expect(result).to.deep.equal({
      'amount;description;category;name;order;color;date':
        '"18080;;9;anything;9;;12-01-2016"',
    });
  });

  it('stops on errors and displays the first error', async function () {
    const jsonPath = path.resolve(
      __dirname,
      '..',
      'fixtures',
      'three-documents.json'
    );

    await browser.navigateToCollectionTab(
      'test',
      'import-stop-first-error',
      'Documents'
    );

    // First import it (so that the next import will conflict _ids).
    await importJSONFile(browser, jsonPath);

    // Open the import modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = await browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // select the file
    await browser.selectFile(Selectors.ImportFileInput, jsonPath);

    // wait for the modal to appear
    const importModal = await browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed();

    // Click the stop on errors checkbox.
    const stopOnErrorsCheckbox = await browser.$(
      Selectors.ImportStopOnErrorsCheckbox
    );
    const stopOnErrorsLabel = await stopOnErrorsCheckbox.parentElement();
    await stopOnErrorsLabel.click();

    // Confirm import.
    await browser.clickVisible(Selectors.ImportConfirm);

    // Wait for the modal to go away.
    await importModal.waitForDisplayed({ reverse: true });

    // Wait for the error toast to appear and close it.
    const toastElement = await browser.$(Selectors.ImportToast);
    await toastElement.waitForDisplayed();
    const toastText = await toastElement.getText();
    expect(toastText).to.include('Failed to import with the following error:');
    expect(toastText).to.include('E11000 duplicate key error collection');

    await browser
      .$(Selectors.closeToastButton(Selectors.ImportToast))
      .waitForDisplayed();
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ImportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });
  });

  it('shows a log file with the errors', async function () {
    const fileName = 'three-documents.json';
    const jsonPath = path.resolve(__dirname, '..', 'fixtures', fileName);

    await browser.navigateToCollectionTab(
      'test',
      'import-with-errors',
      'Documents'
    );

    // First import it (so that the next import will conflict _ids).
    await importJSONFile(browser, jsonPath);

    // Open the import modal.
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = await browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // Select the file.
    await browser.selectFile(Selectors.ImportFileInput, jsonPath);

    // Wait for the modal to appear.
    const importModal = await browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed();

    // Confirm import.
    await browser.clickVisible(Selectors.ImportConfirm);

    // Wait for the modal to go away.
    await importModal.waitForDisplayed({ reverse: true });

    // Wait for the error toast to appear.
    const toastElement = await browser.$(Selectors.ImportToast);
    await toastElement.waitForDisplayed();
    await browser
      .$(Selectors.closeToastButton(Selectors.ImportToast))
      .waitForDisplayed();

    // Displays first two errors in the toast and view log.
    const toastText = await toastElement.getText();
    expect(toastText).to.include(
      'Import completed 0/3 with the following errors:'
    );
    expect(
      (toastText.match(/E11000 duplicate key error collection/g) || []).length
    ).to.equal(2);
    expect(toastText).to.include('VIEW LOG');

    const logFilePath = path.resolve(
      compass.userDataPath || '',
      compass.appName || '',
      'ImportErrorLogs',
      `import-${fileName}.log`
    );
    await expect(fs.stat(logFilePath)).to.not.be.rejected;

    // Check the log file contents for 3 errors.
    const logFileContent = await fs.readFile(logFilePath, 'utf-8');
    const errorCount = (
      logFileContent.match(/E11000 duplicate key error collection/g) || []
    ).length;
    expect(errorCount).to.equal(4);

    // Close toast.
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ImportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });
  });

  describe('aborting an import', function () {
    afterEach(function () {
      delete process.env.COMPASS_E2E_TEST_IMPORT_ABORT_TIMEOUT;
    });

    it('aborts an in progress import', async function () {
      process.env.COMPASS_E2E_TEST_IMPORT_ABORT_TIMEOUT = 'true';

      // 16116 documents.
      const csvPath = path.resolve(__dirname, '..', 'fixtures', 'listings.csv');

      await browser.navigateToCollectionTab(
        'test',
        'import-abort',
        'Documents'
      );

      // Open the import modal.
      await browser.clickVisible(Selectors.AddDataButton);
      const insertDocumentOption = await browser.$(Selectors.ImportFileOption);
      await insertDocumentOption.waitForDisplayed();
      await browser.clickVisible(Selectors.ImportFileOption);

      // Select the file.
      await browser.selectFile(Selectors.ImportFileInput, csvPath);

      // Wait for the modal to appear.
      const importModal = await browser.$(Selectors.ImportModal);
      await importModal.waitForDisplayed();

      // Confirm import.
      await browser.clickVisible(Selectors.ImportConfirm);

      // Wait for the in progress toast to appear and click stop.
      await browser.clickVisible(Selectors.ImportToastAbort);

      // Wait for the done toast to appear.
      const toastElement = await browser.$(Selectors.ImportToast);
      await toastElement.waitForDisplayed();
      await browser
        .$(Selectors.closeToastButton(Selectors.ImportToast))
        .waitForDisplayed();

      // Check it displays that the import was aborted.
      const toastText = await toastElement.getText();
      try {
        expect(toastText).to.include('Import aborted.');
      } catch (err) {
        console.log(toastText);
        throw err;
      }

      // Check at least one and fewer than 16116 documents were imported.
      const messageElement = await browser.$(
        Selectors.DocumentListActionBarMessage
      );
      const documentsText = await messageElement.getText();
      expect(documentsText).to.not.equal('1 – 20 of 16116');
      const result = await getFirstListDocument(browser);
      expect(result._id).to.exist;

      // Close toast.
      await browser.clickVisible(
        Selectors.closeToastButton(Selectors.ImportToast)
      );
      await toastElement.waitForDisplayed({ reverse: true });
    });

    it('aborts when disconnected', async function () {
      process.env.COMPASS_E2E_TEST_IMPORT_ABORT_TIMEOUT = 'true';

      // 16116 documents.
      const csvPath = path.resolve(__dirname, '..', 'fixtures', 'listings.csv');

      await browser.navigateToCollectionTab(
        'test',
        'import-abort',
        'Documents'
      );

      // Open the import modal.
      await browser.clickVisible(Selectors.AddDataButton);
      const insertDocumentOption = await browser.$(Selectors.ImportFileOption);
      await insertDocumentOption.waitForDisplayed();
      await browser.clickVisible(Selectors.ImportFileOption);

      // Select the file.
      await browser.selectFile(Selectors.ImportFileInput, csvPath);

      // Wait for the modal to appear.
      const importModal = await browser.$(Selectors.ImportModal);
      await importModal.waitForDisplayed();

      // Confirm import.
      await browser.clickVisible(Selectors.ImportConfirm);
      // Wait for the in progress toast to appear.
      await browser.$(Selectors.ImportToastAbort).waitForDisplayed();

      await browser.disconnect();
      await browser
        .$(Selectors.SidebarTitle)
        .waitForDisplayed({ reverse: true });

      // Wait for the aborted toast to appear.
      await browser
        .$(Selectors.closeToastButton(Selectors.ImportToast))
        .waitForDisplayed();

      const toastElement = await browser.$(Selectors.ImportToast);
      // Check it displays that the import was aborted.
      const toastText = await toastElement.getText();
      try {
        expect(toastText).to.include('Import aborted.');
      } catch (err) {
        console.log(toastText);
        throw err;
      }

      // Close toast.
      await browser.clickVisible(
        Selectors.closeToastButton(Selectors.ImportToast)
      );
      await toastElement.waitForDisplayed({ reverse: true });
    });
  });
});
