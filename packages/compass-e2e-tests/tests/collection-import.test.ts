import path from 'path';
import chai from 'chai';
import { promises as fs } from 'fs';

import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
  DEFAULT_CONNECTION_NAME_1,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { startTelemetryServer } from '../helpers/telemetry';
import type { Telemetry } from '../helpers/telemetry';
import {
  createDummyCollections,
  createNumbersCollection,
} from '../helpers/insert-data';

const { expect } = chai;

async function importJSONFile(browser: CompassBrowser, jsonPath: string) {
  // open the import modal
  await browser.clickVisible(Selectors.AddDataButton);
  const insertDocumentOption = browser.$(Selectors.ImportFileOption);
  await insertDocumentOption.waitForDisplayed();
  await browser.clickVisible(Selectors.ImportFileOption);

  // Select the file.
  await browser.selectFile(Selectors.ImportFileInput, jsonPath);

  // Wait for the modal to appear.
  const importModal = browser.$(Selectors.ImportModal);
  await importModal.waitForDisplayed();

  // Confirm import.
  await browser.clickVisible(Selectors.ImportConfirm);

  // Wait for the modal to go away.
  await importModal.waitForDisplayed({ reverse: true });

  // Wait for the done toast to appear and close it.
  const toastElement = browser.$(Selectors.ImportToast);
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

  const fieldTypeSelectMenu = browser.$(
    Selectors.importPreviewFieldHeaderSelectMenu(fieldName)
  );
  await fieldTypeSelectMenu.waitForDisplayed();

  const fieldTypeSelectSpan = fieldTypeSelectMenu.$(`span=${fieldType}`);
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
  const checkboxElement = browser.$(
    Selectors.importPreviewFieldHeaderCheckbox(fieldName)
  );
  const checkboxLabel = checkboxElement.parentElement();
  await checkboxLabel.waitForDisplayed();
  await checkboxLabel.scrollIntoView();
  expect(await checkboxElement.isSelected()).to.be.true;
  await checkboxLabel.click();
  expect(await checkboxElement.isSelected()).to.be.false;
}

describe('Collection import', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  before(async function () {
    skipForWeb(this, 'import not yet available in compass-web');

    telemetry = await startTelemetryServer();
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await createDummyCollections();
    await browser.disconnectAll();
    await browser.connectToDefaults();
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await cleanup(compass);
    await telemetry.stop();
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('supports single JSON objects', async function () {
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'json-array',
      'Documents'
    );

    async function getDocumentCount() {
      const countText = await browser
        .$(Selectors.CollectionTabStats('documents'))
        .getText();
      return countText ? Number(countText) : null;
    }

    // wait for the stats to load
    await browser.waitUntil(async () => {
      const count = await getDocumentCount();
      return count !== null && !isNaN(count);
    });

    // store current document count
    const initialDocCount = await getDocumentCount();

    // browse to the "Insert to Collection" modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = browser.$(Selectors.InsertDocumentOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.InsertDocumentOption);

    // wait for the modal to appear
    const insertDialog = browser.$(Selectors.InsertDialog);
    await insertDialog.waitForDisplayed();

    // set the text in the editor
    await browser.setCodemirrorEditorValue(
      Selectors.InsertJSONEditor,
      '{ "foo": 10, "long": { "$numberLong": "99" } }'
    );

    // confirm
    const insertConfirm = browser.$(Selectors.InsertConfirm);
    // this selector is very brittle, so just make sure it works
    expect(await insertConfirm.isDisplayed()).to.be.true;
    expect(await insertConfirm.getText()).to.equal('Insert');
    await insertConfirm.waitForEnabled();
    await browser.clickVisible(Selectors.InsertConfirm);

    // wait for the modal to go away
    await insertDialog.waitForDisplayed({ reverse: true });

    // make sure the documents appear in the collection
    const messageElement = browser.$(Selectors.DocumentListActionBarMessage);
    await browser.waitUntil(async () => {
      const text = await messageElement.getText();
      return text === '1 – 1 of 1';
    });

    const result = await browser.getFirstListDocument();

    expect(result._id).to.exist;
    delete result._id;

    expect(result).to.deep.equal({
      foo: '10',
      long: '99',
    });

    // make sure document count also updated
    await browser.waitUntil(async () => {
      const currentDocCount = await getDocumentCount();
      return (
        initialDocCount !== null && initialDocCount + 1 === currentDocCount
      );
    });
  });

  it('supports single objects in document view mode', async function () {
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'json-array',
      'Documents'
    );

    // browse to the "Insert to Collection" modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = browser.$(Selectors.InsertDocumentOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.InsertDocumentOption);

    // wait for the modal to appear
    const insertDialog = browser.$(Selectors.InsertDialog);
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
    await browser.setValueVisible(
      `${Selectors.InsertDialog} ${Selectors.HadronDocumentElement}:last-child ${Selectors.HadronDocumentKeyEditor}`,
      'bar'
    );
    await browser.setValueVisible(
      `${Selectors.InsertDialog} ${Selectors.HadronDocumentElement}:last-child ${Selectors.HadronDocumentValueEditor}`,
      '42'
    );

    // confirm
    const insertConfirm = browser.$(Selectors.InsertConfirm);
    // this selector is very brittle, so just make sure it works
    expect(await insertConfirm.isDisplayed()).to.be.true;
    expect(await insertConfirm.getText()).to.equal('Insert');
    await insertConfirm.waitForEnabled();
    await browser.clickVisible(Selectors.InsertConfirm);

    // wait for the modal to go away
    await insertDialog.waitForDisplayed({ reverse: true });

    // make sure the documents appear in the collection
    const messageElement = browser.$(Selectors.DocumentListActionBarMessage);
    await browser.waitUntil(async () => {
      const text = await messageElement.getText();
      return text === '1 – 1 of 1';
    });

    const result = await browser.getFirstListDocument();

    expect(result._id).to.exist;
    delete result._id;

    expect(result).to.deep.equal({
      bar: '"42"',
    });
  });

  it('supports JSON arrays', async function () {
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'json-array',
      'Documents'
    );

    const array = [];
    for (let i = 0; i < 1000; ++i) {
      array.push({ n: i, n_square: i * i });
    }
    const json = JSON.stringify(array);

    // browse to the "Insert to Collection" modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = browser.$(Selectors.InsertDocumentOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.InsertDocumentOption);

    // wait for the modal to appear
    const insertDialog = browser.$(Selectors.InsertDialog);
    await insertDialog.waitForDisplayed();

    // set the text in the editor
    await browser.setCodemirrorEditorValue(Selectors.InsertJSONEditor, json);

    // confirm
    // this selector is very brittle, so just make sure it works
    expect(await browser.$(Selectors.InsertConfirm).isDisplayed()).to.be.true;
    expect(await browser.$(Selectors.InsertConfirm).getText()).to.equal(
      'Insert'
    );
    await browser.$(Selectors.InsertConfirm).waitForEnabled();
    await browser.clickVisible(Selectors.InsertConfirm);

    // wait for the modal to go away
    await insertDialog.waitForDisplayed({ reverse: true });

    // make sure the documents appear in the collection
    const messageElement = browser.$(Selectors.DocumentListActionBarMessage);
    await browser.waitUntil(async () => {
      const text = await messageElement.getText();
      return text === '1 – 25 of 1000';
    });

    const result = await browser.getFirstListDocument();

    expect(result._id).to.exist;
    delete result._id;

    expect(result).to.deep.equal({
      n: '0',
      n_square: '0',
    });
  });

  it('displays an error for a malformed JSON array', async function () {
    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'json-array',
      'Documents'
    );

    const json = 'this is not valid JSON';

    // browse to the "Insert to Collection" modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = browser.$(Selectors.InsertDocumentOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.InsertDocumentOption);

    // wait for the modal to appear
    const insertDialog = browser.$(Selectors.InsertDialog);
    await insertDialog.waitForDisplayed();

    // set the text in the editor
    await browser.setCodemirrorEditorValue(Selectors.InsertJSONEditor, json);

    // make sure that there's an error and that the insert button is disabled
    const errorElement = browser.$(Selectors.InsertDialogErrorMessage);
    await errorElement.waitForDisplayed();
    expect(await errorElement.getText()).to.equal(
      'Insert not permitted while document contains errors.'
    );
    const insertButton = browser.$(Selectors.InsertConfirm);
    await browser.waitForAriaDisabled(insertButton, true);

    // cancel and wait for the modal to go away
    await browser.clickVisible(Selectors.InsertCancel);
    await insertDialog.waitForDisplayed({ reverse: true });
  });

  it('supports JSON files', async function () {
    const jsonPath = path.resolve(__dirname, '..', 'fixtures', 'listings.json');

    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'json-file',
      'Documents'
    );

    await importJSONFile(browser, jsonPath);

    const messageElement = browser.$(Selectors.DocumentListActionBarMessage);
    const text = await messageElement.getText();
    expect(text).to.equal('1 – 25 of 16116');

    const result = await browser.getFirstListDocument();

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
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'extended-json-file',
      'Documents'
    );

    await importJSONFile(browser, jsonPath);

    const messageElement = browser.$(Selectors.DocumentListActionBarMessage);
    const text = await messageElement.getText();
    expect(text).to.equal('1 – 1 of 1');

    const result = await browser.getFirstListDocument();

    expect(result._id).to.exist;
    delete result._id;

    // Array and Object could be expanded, but this is probably good enough.
    expect(result).to.deep.equal({
      arrayField_canonical: 'Array (2)',
      arrayField_relaxed: 'Array (2)',
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
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'extended-json-file',
      'Documents'
    );

    // open the import modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // Select the file.
    await browser.selectFile(Selectors.ImportFileInput, jsonPath);
    // Wait for the modal to appear.
    const importModal = browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed();

    // Confirm import.
    await browser.clickVisible(Selectors.ImportConfirm);

    // Wait for the modal to go away.
    await importModal.waitForDisplayed({ reverse: true });

    // Wait for the error toast to appear and close it.
    const toastElement = browser.$(Selectors.ImportToast);
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

    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'csv-file',
      'Documents'
    );

    // open the import modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // Select the file.
    // Unfortunately this opens a second open dialog and the one that got
    // automatically opened when clicking on import file sticks around on top of
    // everything :(
    await browser.selectFile(Selectors.ImportFileInput, csvPath);

    // Wait for the modal to appear.
    const importModal = browser.$(Selectors.ImportModal);
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

    const telemetryEntry = await browser.listenForTelemetryEvents(telemetry);

    // Confirm import.
    await browser.clickVisible(Selectors.ImportConfirm);

    // Wait for the modal to go away.
    await importModal.waitForDisplayed({ reverse: true });

    // Wait for the done toast to appear and close it.
    const toastElement = browser.$(Selectors.ImportToast);
    await toastElement.waitForDisplayed();
    await browser
      .$(Selectors.closeToastButton(Selectors.ImportToast))
      .waitForDisplayed();
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ImportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });

    const messageElement = browser.$(Selectors.DocumentListActionBarMessage);
    const text = await messageElement.getText();
    expect(text).to.equal('1 – 25 of 16116');

    const result = await browser.getFirstListDocument();

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

    const importCompletedEvent = await telemetryEntry('Import Completed');
    delete importCompletedEvent.duration; // Duration varies.
    expect(importCompletedEvent.connection_id).to.exist;
    delete importCompletedEvent.connection_id; // connection_id varies
    expect(importCompletedEvent).to.deep.equal({
      delimiter: ',',
      newline: '\n',
      file_type: 'csv',
      all_fields: false,
      stop_on_error_selected: false,
      number_of_docs: 16116,
      success: true,
      ignore_empty_strings: true,
    });
    expect(telemetry.screens()).to.include('import_modal');
  });

  it('supports CSV files with arrays, objects and arrays of objects', async function () {
    const csvPath = path.resolve(
      __dirname,
      '..',
      'fixtures',
      'array-documents.csv'
    );

    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'array-documents',
      'Documents'
    );

    // open the import modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // Select the file.
    // Unfortunately this opens a second open dialog and the one that got
    // automatically opened when clicking on import file sticks around on top of
    // everything :(
    await browser.selectFile(Selectors.ImportFileInput, csvPath);

    // Wait for the modal to appear.
    const importModal = browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed();

    // wait for it to finish analyzing
    await browser.$(Selectors.ImportConfirm).waitForDisplayed();
    await browser
      .$(Selectors.importPreviewFieldHeaderField('_id'))
      .waitForDisplayed();

    // extract all the type fields and check them
    const fieldNames = await browser
      .$$(Selectors.ImportFieldLabel)
      .map((el) => el.getText());

    try {
      expect(fieldNames).to.deep.equal([
        '_id',
        'listing_url',
        'name',
        'summary',
        'space',
        'description',
        'neighborhood_overview',
        'notes',
        'transit',
        'access',
        'interaction',
        'house_rules',
        'property_type',
        'room_type',
        'bed_type',
        'minimum_nights',
        'maximum_nights',
        'cancellation_policy',
        'last_scraped',
        'calendar_last_scraped',
        'first_review',
        'last_review',
        'accommodates',
        'bedrooms',
        'beds',
        'number_of_reviews',
        'bathrooms',
        'amenities[]',
        'price',
        'weekly_price',
        'monthly_price',
        'cleaning_fee',
        'extra_people',
        'guests_included',
        'images.thumbnail_url',
        'images.medium_url',
        'images.picture_url',
        'images.xl_picture_url',
        'host.host_id',
        'host.host_url',
        'host.host_name',
        'host.host_location',
        'host.host_about',
        'host.host_response_time',
        'host.host_thumbnail_url',
        'host.host_picture_url',
        'host.host_neighbourhood',
        'host.host_response_rate',
        'host.host_is_superhost',
        'host.host_has_profile_pic',
        'host.host_identity_verified',
        'host.host_listings_count',
        'host.host_total_listings_count',
        'host.host_verifications[]',
        'address.street',
        'address.suburb',
        'address.government_area',
        'address.market',
        'address.country',
        'address.country_code',
        'address.location.type',
        'address.location.coordinates[]',
        'address.location.is_location_exact',
        'availability.availability_30',
        'availability.availability_60',
        'availability.availability_90',
        'availability.availability_365',
        'review_scores.review_scores_accuracy',
        'review_scores.review_scores_cleanliness',
        'review_scores.review_scores_checkin',
        'review_scores.review_scores_communication',
        'review_scores.review_scores_location',
        'review_scores.review_scores_value',
        'review_scores.review_scores_rating',
        'reviews[]._id',
        'reviews[].date',
        'reviews[].listing_id',
        'reviews[].reviewer_id',
        'reviews[].reviewer_name',
        'reviews[].comments',
        'security_deposit',
      ]);
    } catch (err) {
      console.log(JSON.stringify(fieldNames, null, 2));
      throw err;
    }

    // Confirm import.
    await browser.clickVisible(Selectors.ImportConfirm);

    // Wait for the modal to go away.
    await importModal.waitForDisplayed({ reverse: true });

    // Wait for the done toast to appear and close it.
    const toastElement = browser.$(Selectors.ImportToast);
    await toastElement.waitForDisplayed();
    await browser
      .$(Selectors.closeToastButton(Selectors.ImportToast))
      .waitForDisplayed();
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ImportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });

    const messageElement = browser.$(Selectors.DocumentListActionBarMessage);
    const text = await messageElement.getText();
    expect(text).to.equal('1 – 3 of 3');

    // show the array and object fields
    await browser.clickVisible(Selectors.ShowMoreFieldsButton);

    const result = await browser.getFirstListDocument();

    expect(result._id).to.equal('1001265');
  });

  it('supports CSV files with BOM', async function () {
    const csvPath = path.resolve(
      __dirname,
      '..',
      'fixtures',
      'source-with-bom.csv'
    );

    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'bom-csv-file',
      'Documents'
    );

    // open the import modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // Select the file.
    await browser.selectFile(Selectors.ImportFileInput, csvPath);

    // Wait for the modal to appear.
    const importModal = browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed();

    // it now autodetects the delimiter
    const importDelimiterSelectButton = browser.$(
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
    const toastElement = browser.$(Selectors.ImportToast);
    await toastElement.waitForDisplayed();
    await browser
      .$(Selectors.closeToastButton(Selectors.ImportToast))
      .waitForDisplayed();
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ImportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });

    const messageElement = browser.$(Selectors.DocumentListActionBarMessage);
    const text = await messageElement.getText();
    expect(text).to.equal('1 – 1 of 1');

    const result = await browser.getFirstListDocument();

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

    await browser.navigateToCollectionTab(
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'csv-file',
      'Documents'
    );

    // open the import modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // Select the file.
    await browser.selectFile(Selectors.ImportFileInput, csvPath);

    // Wait for the modal to appear.
    const importModal = browser.$(Selectors.ImportModal);
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
    const toastElement = browser.$(Selectors.ImportToast);
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
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'broken-delimiter',
      'Documents'
    );

    // open the import modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // select the file
    await browser.selectFile(Selectors.ImportFileInput, csvPath);

    // wait for the modal to appear
    const importModal = browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed();

    // it now autodetects the delimiter correctly
    const importDelimiterSelectButton = browser.$(
      Selectors.ImportDelimiterSelect
    );
    expect(await importDelimiterSelectButton.getText()).to.equal('Semicolon');

    // but let's break it anyway
    await importDelimiterSelectButton.waitForDisplayed();
    await importDelimiterSelectButton.click();
    const importDelimiterSelectMenu = browser.$(Selectors.ImportDelimiterMenu);
    await importDelimiterSelectMenu.waitForDisplayed();
    const delimiterSelectSpan = importDelimiterSelectMenu.$('span=Comma');
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
    const toastElement = browser.$(Selectors.ImportToast);
    await toastElement.waitForDisplayed();
    await browser
      .$(Selectors.closeToastButton(Selectors.ImportToast))
      .waitForDisplayed();
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ImportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });

    const messageElement = browser.$(Selectors.DocumentListActionBarMessage);
    const text = await messageElement.getText();
    expect(text).to.equal('1 – 1 of 1');

    const result = await browser.getFirstListDocument();

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
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'import-stop-first-error',
      'Documents'
    );

    // First import it (so that the next import will conflict _ids).
    await importJSONFile(browser, jsonPath);

    // Open the import modal
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // select the file
    await browser.selectFile(Selectors.ImportFileInput, jsonPath);

    // wait for the modal to appear
    const importModal = browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed();

    // Click the stop on errors checkbox.
    const stopOnErrorsCheckbox = browser.$(
      Selectors.ImportStopOnErrorsCheckbox
    );
    const stopOnErrorsLabel = stopOnErrorsCheckbox.parentElement();
    await stopOnErrorsLabel.click();

    // Confirm import.
    await browser.clickVisible(Selectors.ImportConfirm);

    // Wait for the modal to go away.
    await importModal.waitForDisplayed({ reverse: true });

    // Wait for the error toast to appear and close it.
    const toastElement = browser.$(Selectors.ImportToast);
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
      DEFAULT_CONNECTION_NAME_1,
      'test',
      'import-with-errors',
      'Documents'
    );

    // First import it (so that the next import will conflict _ids).
    await importJSONFile(browser, jsonPath);

    // Open the import modal.
    await browser.clickVisible(Selectors.AddDataButton);
    const insertDocumentOption = browser.$(Selectors.ImportFileOption);
    await insertDocumentOption.waitForDisplayed();
    await browser.clickVisible(Selectors.ImportFileOption);

    // Select the file.
    await browser.selectFile(Selectors.ImportFileInput, jsonPath);

    // Wait for the modal to appear.
    const importModal = browser.$(Selectors.ImportModal);
    await importModal.waitForDisplayed();

    // Confirm import.
    await browser.clickVisible(Selectors.ImportConfirm);

    // Wait for the modal to go away.
    await importModal.waitForDisplayed({ reverse: true });

    // Wait for the error toast to appear.
    const toastElement = browser.$(Selectors.ImportToast);
    await toastElement.waitForDisplayed();
    await browser
      .$(Selectors.closeToastButton(Selectors.ImportToast))
      .waitForDisplayed();

    // Displays first two errors in the toast and view log.
    // (It tries to display two, but it also limits the text)
    const toastText = await toastElement.getText();
    expect(toastText).to.include('Import completed 0/3 with errors:');
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
    expect(errorCount).to.equal(3);

    // Close toast.
    await browser.clickVisible(
      Selectors.closeToastButton(Selectors.ImportToast)
    );
    await toastElement.waitForDisplayed({ reverse: true });
  });

  describe('aborting an import', function () {
    it('aborts an in progress CSV import', async function () {
      // 16116 documents.
      const csvPath = path.resolve(__dirname, '..', 'fixtures', 'listings.csv');

      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME_1,
        'test',
        'compass-import-abort-e2e-test',
        'Documents'
      );

      // Open the import modal.
      await browser.clickVisible(Selectors.AddDataButton);
      const insertDocumentOption = browser.$(Selectors.ImportFileOption);
      await insertDocumentOption.waitForDisplayed();
      await browser.clickVisible(Selectors.ImportFileOption);

      // Select the file.
      await browser.selectFile(Selectors.ImportFileInput, csvPath);

      // Wait for the modal to appear.
      const importModal = browser.$(Selectors.ImportModal);
      await importModal.waitForDisplayed();

      // Wait for the import button to become available because detect can take
      // a while
      await browser.$(Selectors.ImportConfirm).waitForEnabled();

      // Confirm import.
      await browser.clickVisible(Selectors.ImportConfirm);

      // Wait for the in progress toast to appear and click stop.
      const toastElement = browser.$(Selectors.ImportToast);
      await toastElement.waitForDisplayed();
      // Click the toast element. This focuses the toast, and clicking the cancel
      // button isn't consistent without it.
      await browser.clickVisible(Selectors.ImportToast);

      const importAbortButton = browser.$(Selectors.ImportToastAbort);
      await importAbortButton.waitForDisplayed();
      await browser.clickVisible(Selectors.ImportToastAbort);

      // Wait for the done toast to appear.
      await browser
        .$(Selectors.closeToastButton(Selectors.ImportToast))
        .waitForDisplayed();

      // Check it displays that the import was aborted.
      const toastText = await toastElement.getText();
      try {
        expect(toastText).to.include('Import aborted');
      } catch (err) {
        console.log(toastText);
        throw err;
      }

      // Check at least one and fewer than 16116 documents were imported.
      const messageElement = browser.$(Selectors.DocumentListActionBarMessage);
      const documentsText = await messageElement.getText();
      expect(documentsText).to.not.equal('1 – 20 of 16116');
      expect(documentsText).to.not.include('16116');

      // Close toast.
      await browser.clickVisible(
        Selectors.closeToastButton(Selectors.ImportToast)
      );
      await toastElement.waitForDisplayed({ reverse: true });
    });

    it('aborts an in progress JSON import', async function () {
      // 16116 documents.
      const jsonPath = path.resolve(
        __dirname,
        '..',
        'fixtures',
        'listings.json'
      );

      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME_1,
        'test',
        'compass-import-abort-e2e-test',
        'Documents'
      );

      // Open the import modal.
      await browser.clickVisible(Selectors.AddDataButton);
      const insertDocumentOption = browser.$(Selectors.ImportFileOption);
      await insertDocumentOption.waitForDisplayed();
      await browser.clickVisible(Selectors.ImportFileOption);

      // Select the file.
      await browser.selectFile(Selectors.ImportFileInput, jsonPath);

      // Wait for the modal to appear.
      const importModal = browser.$(Selectors.ImportModal);
      await importModal.waitForDisplayed();

      // Confirm import.
      await browser.clickVisible(Selectors.ImportConfirm);

      // Wait for the in progress toast to appear and click stop.
      const toastElement = browser.$(Selectors.ImportToast);
      await toastElement.waitForDisplayed();
      // Click the toast element. This focuses the toast, and clicking the cancel
      // button isn't consistent without it.
      await browser.clickVisible(Selectors.ImportToast);

      const importAbortButton = browser.$(Selectors.ImportToastAbort);
      await importAbortButton.waitForDisplayed();
      await browser.clickVisible(Selectors.ImportToastAbort);

      // Wait for the done toast to appear.
      await browser
        .$(Selectors.closeToastButton(Selectors.ImportToast))
        .waitForDisplayed();

      // Check it displays that the import was aborted.
      const toastText = await toastElement.getText();
      try {
        expect(toastText).to.include('Import aborted');
      } catch (err) {
        console.log(toastText);
        throw err;
      }

      // Check at least one and fewer than 16116 documents were imported.
      const messageElement = browser.$(Selectors.DocumentListActionBarMessage);
      const documentsText = await messageElement.getText();
      expect(documentsText).to.not.equal('1 – 20 of 16116');
      expect(documentsText).to.not.include('16116');

      // Close toast.
      await browser.clickVisible(
        Selectors.closeToastButton(Selectors.ImportToast)
      );
      await toastElement.waitForDisplayed({ reverse: true });
    });

    it('aborts when disconnected', async function () {
      // 16116 documents.
      const csvPath = path.resolve(__dirname, '..', 'fixtures', 'listings.csv');

      await browser.navigateToCollectionTab(
        DEFAULT_CONNECTION_NAME_1,
        'test',
        'compass-import-abort-e2e-test',
        'Documents'
      );

      // Open the import modal.
      await browser.clickVisible(Selectors.AddDataButton);
      const insertDocumentOption = browser.$(Selectors.ImportFileOption);
      await insertDocumentOption.waitForDisplayed();
      await browser.clickVisible(Selectors.ImportFileOption);

      // Select the file.
      await browser.selectFile(Selectors.ImportFileInput, csvPath);

      // Wait for the modal to appear.
      const importModal = browser.$(Selectors.ImportModal);
      await importModal.waitForDisplayed();

      // Confirm import.
      await browser.clickVisible(Selectors.ImportConfirm);
      // Wait for the in progress toast to appear.
      await browser.$(Selectors.ImportToastAbort).waitForDisplayed();

      await browser.disconnectAll({ closeToasts: false });

      // Wait for the aborted toast to appear.
      await browser
        .$(Selectors.closeToastButton(Selectors.ImportToast))
        .waitForDisplayed();

      const toastElement = browser.$(Selectors.ImportToast);
      // Check it displays that the import was aborted.
      const toastText = await toastElement.getText();
      try {
        expect(toastText).to.include('Import aborted');
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
