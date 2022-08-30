import { expect } from 'chai';
import semver from 'semver';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import { MONGODB_VERSION } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { getFirstListDocument } from '../helpers/read-first-document-content';
import { MongoClient } from 'mongodb';
import path from 'path';

import delay from '../helpers/delay';

import { LOG_PATH } from '../helpers/compass';

const CONNECTION_HOSTS = 'localhost:27091';
const CONNECTION_STRING = `mongodb://${CONNECTION_HOSTS}/`;

describe('FLE2', function () {
  describe('server version gte 4.2.20 and not a linux platform', function () {
    const databaseName = 'fle-test';
    const collectionName = 'my-another-collection';
    let compass: Compass;
    let browser: CompassBrowser;

    before(async function () {
      if (
        semver.lt(MONGODB_VERSION, '4.2.20') ||
        process.env.MONGODB_USE_ENTERPRISE !== 'yes' ||
        // TODO(COMPASS-5911): Saved connections are not being displayed after disconnect on Linux CI.
        process.platform === 'linux'
      ) {
        return this.skip();
      }

      compass = await beforeTests();
      browser = compass.browser;
    });

    beforeEach(async function () {
      const sidebar = await browser.$(Selectors.SidebarTitle);
      if (await sidebar.isDisplayed()) {
        await browser.disconnect();
      }
    });

    after(async function () {
      if (compass) {
        await afterTests(compass, this.currentTest);
      }
    });

    it('does not store KMS settings if the checkbox is not set', async function () {
      const favoriteName = 'My FLE Favorite';
      const options = {
        hosts: [CONNECTION_HOSTS],
        fleKeyVaultNamespace: `${databaseName}.keyvault`,
        fleKey: 'A'.repeat(128),
        fleEncryptedFieldsMap: `{
          '${databaseName}.${collectionName}': {
            fields: [
              {
                path: 'phoneNumber',
                keyId: UUID("28bbc608-524e-4717-9246-33633361788e"),
                bsonType: 'string',
                queries: { queryType: 'equality' }
              }
            ]
          }
        }`,
      };

      await browser.setConnectFormState(options);

      // Save & Connect
      await browser.clickVisible(Selectors.ConnectionFormSaveAndConnectButton);
      await browser.$(Selectors.FavoriteModal).waitForDisplayed();
      await browser.$(Selectors.FavoriteNameInput).setValue(favoriteName);
      await browser.clickVisible(
        `${Selectors.FavoriteColorSelector} [data-testid="color-pick-color2"]`
      );

      // The modal's button text should read Save & Connect and not the default Save
      expect(await browser.$(Selectors.FavoriteSaveButton).getText()).to.equal(
        'Save & Connect'
      );

      await browser.$(Selectors.FavoriteSaveButton).waitForEnabled();
      await browser.clickVisible(Selectors.FavoriteSaveButton);
      await browser.$(Selectors.FavoriteModal).waitForExist({ reverse: true });

      // Wait for it to connect
      const element = await browser.$(Selectors.MyQueriesList);
      await element.waitForDisplayed();

      await delay(10000);

      try {
        await browser.disconnect();
      } catch (err) {
        console.error('Error during disconnect:');
        console.error(err);
      }

      await delay(10000);
      await browser.saveScreenshot(
        path.join(LOG_PATH, 'saved-connections-after-disconnect.png')
      );

      await browser.clickVisible(Selectors.sidebarFavoriteButton(favoriteName));
      await browser.waitUntil(async () => {
        const text = await browser.$(Selectors.ConnectionTitle).getText();
        return text === favoriteName;
      });

      const state = await browser.getConnectFormState();

      expect(state.connectionString).to.be.equal(CONNECTION_STRING);
      expect(state.fleKeyVaultNamespace).to.be.equal('fle-test.keyvault');
      expect(state.fleStoreCredentials).to.be.equal(false);
      expect(state.fleEncryptedFieldsMap).to.include(
        'fle-test.my-another-collection'
      );
    });
  });

  describe('server version gte 6.0.0-rc0', function () {
    before(function () {
      if (
        semver.lt(MONGODB_VERSION, '6.0.0-rc0') ||
        process.env.MONGODB_USE_ENTERPRISE !== 'yes'
      ) {
        return this.skip();
      }
    });

    describe('when fleEncryptedFieldsMap is not specified while connecting', function () {
      const databaseName = 'db-for-fle';
      const collectionName = 'my-encrypted-collection';
      let compass: Compass;
      let browser: CompassBrowser;

      before(async function () {
        compass = await beforeTests();
        browser = compass.browser;

        await browser.connectWithConnectionForm({
          hosts: [CONNECTION_HOSTS],
          fleKeyVaultNamespace: `${databaseName}.keyvault`,
          fleKey: 'A'.repeat(128),
        });
      });

      after(async function () {
        if (compass) {
          await afterTests(compass, this.currentTest);
        }
      });

      beforeEach(async function () {
        await browser.shellEval(
          `db.getMongo().getDB('${databaseName}').createCollection('default')`
        );
        await browser.clickVisible(Selectors.SidebarInstanceRefreshButton);
      });

      it('can create a fle2 collection with encryptedFields', async function () {
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
        expect(collectionListFLE2BadgeElementText).to.equal(
          'QUERYABLE ENCRYPTION'
        );

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

    describe('when fleEncryptedFieldsMap is specified while connecting', function () {
      const databaseName = 'fle-test';
      const collectionName = 'my-another-collection';
      const collectionNameUnindexed = 'my-another-collection2';
      let compass: Compass;
      let browser: CompassBrowser;
      let plainMongo: MongoClient;

      before(async function () {
        compass = await beforeTests();
        browser = compass.browser;
      });

      beforeEach(async function () {
        await browser.connectWithConnectionForm({
          hosts: [CONNECTION_HOSTS],
          fleKeyVaultNamespace: `${databaseName}.keyvault`,
          fleKey: 'A'.repeat(128),
          fleEncryptedFieldsMap: `{
            '${databaseName}.${collectionName}': {
              fields: [
                {
                  path: 'phoneNumber',
                  keyId: UUID("28bbc608-524e-4717-9246-33633361788e"),
                  bsonType: 'string',
                  queries: { queryType: 'equality' }
                }
              ]
            },
            '${databaseName}.${collectionNameUnindexed}': {
              fields: [
                {
                  path: 'phoneNumber',
                  keyId: UUID("28bbc608-524e-4717-9246-33633361788e"),
                  bsonType: 'string'
                }
              ]
            }
          }`,
        });
        await browser.shellEval(`use ${databaseName}`);
        await browser.shellEval(
          'db.keyvault.insertOne({' +
            '"_id": UUID("28bbc608-524e-4717-9246-33633361788e"),' +
            '"keyMaterial": BinData(0, "/yeYyj8IxowIIZGOs5iUcJaUm7KHhoBDAAzNxBz8c5mr2hwBIsBWtDiMU4nhx3fCBrrN3cqXG6jwPgR22gZDIiMZB5+xhplcE9EgNoEEBtRufBE2VjtacpXoqrMgW0+m4Dw76qWUCsF/k1KxYBJabM35KkEoD6+BI1QxU0rwRsR1rE/OLuBPKOEq6pmT5x74i+ursFlTld+5WiOySRDcZg=="),' +
            '"creationDate": ISODate("2022-05-27T18:28:33.925Z"),' +
            '"updateDate": ISODate("2022-05-27T18:28:33.925Z"),' +
            '"status": 0,' +
            '"masterKey": { "provider" : "local" }' +
            '})'
        );
        await browser.clickVisible(Selectors.SidebarInstanceRefreshButton);
        plainMongo = await MongoClient.connect(CONNECTION_STRING);
      });

      after(async function () {
        if (compass) {
          await afterTests(compass, this.currentTest);
        }
      });

      afterEach(async function () {
        await plainMongo.db(databaseName).dropDatabase();
        await plainMongo.close();
      });

      it('can create a fle2 collection without encryptedFields', async function () {
        await browser.navigateToDatabaseTab(databaseName, 'Collections');
        await browser.clickVisible(Selectors.DatabaseCreateCollectionButton);
        await browser.addCollection(collectionName);

        const selector = Selectors.collectionCard(databaseName, collectionName);
        await browser.scrollToVirtualItem(
          Selectors.CollectionsGrid,
          selector,
          'grid'
        );

        const collectionCard = await browser.$(selector);
        await collectionCard.waitForDisplayed();

        const collectionListFLE2BadgeElement = await browser.$(
          Selectors.CollectionListFLE2Badge
        );
        const collectionListFLE2BadgeElementText =
          await collectionListFLE2BadgeElement.getText();
        expect(collectionListFLE2BadgeElementText).to.equal(
          'QUERYABLE ENCRYPTION'
        );

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

      it('can insert a document with an encrypted field and a non-encrypted field', async function () {
        await browser.shellEval(`db.createCollection('${collectionName}')`);

        await browser.clickVisible(Selectors.SidebarInstanceRefreshButton);

        await browser.navigateToCollectionTab(
          databaseName,
          collectionName,
          'Documents'
        );

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
          '{ "phoneNumber": "30303030", "name": "Person X" }'
        );

        const insertCSFLEHasKnownSchemaMsg = await browser.$(
          Selectors.insertCSFLEHasKnownSchemaMsg
        );
        const insertCSFLEHasKnownSchemaMsgText =
          await insertCSFLEHasKnownSchemaMsg.getText();
        expect(insertCSFLEHasKnownSchemaMsgText).to.include('phoneNumber');

        // confirm
        const insertConfirm = await browser.$(Selectors.InsertConfirm);
        await insertConfirm.waitForEnabled();
        await browser.clickVisible(Selectors.InsertConfirm);

        // wait for the modal to go away
        await insertDialog.waitForDisplayed({ reverse: true });

        const result = await getFirstListDocument(browser);

        expect(result._id).to.exist;
        expect(result.__safeContent__).to.exist;
        delete result._id;
        delete result.__safeContent__;

        expect(result).to.deep.equal({
          phoneNumber: '"30303030"',
          name: '"Person X"',
        });
      });

      it('shows a decrypted field icon', async function () {
        await browser.shellEval(`db.createCollection('${collectionName}')`);
        await browser.shellEval(
          `db[${JSON.stringify(
            collectionName
          )}].insertOne({ "phoneNumber": "30303030", "name": "Person X" })`
        );

        await browser.navigateToCollectionTab(
          databaseName,
          collectionName,
          'Documents'
        );
        const document = await browser.$(Selectors.DocumentListEntry);

        const documentPhoneNumberDecryptedIcon = await document.$(
          `${Selectors.HadronDocumentElement}[data-field="phoneNumber"] ${Selectors.HadronDocumentElementDecryptedIcon}`
        );
        const isDocumentPhoneNumberDecryptedIconExisting =
          await documentPhoneNumberDecryptedIcon.isExisting();
        expect(isDocumentPhoneNumberDecryptedIconExisting).to.be.equal(true);
      });

      for (const [mode, coll] of [
        ['indexed', collectionName],
        ['unindexed', collectionNameUnindexed],
      ]) {
        it(`can edit and query the ${mode} encrypted field in the CRUD view`, async function () {
          await browser.shellEval(`db.createCollection('${coll}')`);
          await browser.shellEval(
            `db[${JSON.stringify(
              coll
            )}].insertOne({ "phoneNumber": "30303030", "name": "Person X" })`
          );

          await browser.navigateToCollectionTab(
            databaseName,
            coll,
            'Documents'
          );

          const result = await getFirstListDocument(browser);
          expect(result.phoneNumber).to.be.equal('"30303030"');

          const document = await browser.$(Selectors.DocumentListEntry);
          const value = await document.$(
            `${Selectors.HadronDocumentElement}[data-field="phoneNumber"] ${Selectors.HadronDocumentClickableValue}`
          );
          await value.doubleClick();

          const input = await document.$(
            `${Selectors.HadronDocumentElement}[data-field="phoneNumber"] ${Selectors.HadronDocumentValueEditor}`
          );
          await input.setValue('10101010');

          const footer = await document.$(Selectors.DocumentFooterMessage);
          expect(await footer.getText()).to.equal('Document modified.');

          const button = await document.$(Selectors.UpdateDocumentButton);
          await button.click();
          try {
            // Prmpt failure is required here and so the timeout should be
            // present and smaller than the default one to allow for tests to
            // proceed correctly
            await footer.waitForDisplayed({ reverse: true, timeout: 10000 });
          } catch (err) {
            if (
              mode === 'unindexed' &&
              (await footer.getText()) ===
                'Found indexed encrypted fields but could not find __safeContent__'
            ) {
              return; // This version is affected by SERVER-68065 where updates on unindexed fields in QE are buggy.
            }
          }
          await footer.waitForDisplayed({ reverse: true });

          await browser.runFindOperation(
            'Documents',
            "{ phoneNumber: '10101010' }"
          );

          const modifiedResult = await getFirstListDocument(browser);
          expect(modifiedResult.phoneNumber).to.be.equal('"10101010"');
          expect(modifiedResult._id).to.be.equal(result._id);
        });
      }

      it('can edit and query the encrypted field in the JSON view', async function () {
        await browser.shellEval(`db.createCollection('${collectionName}')`);
        await browser.shellEval(
          `db[${JSON.stringify(
            collectionName
          )}].insertOne({ "phoneNumber": "30303030", "name": "Person X" })`
        );

        await browser.navigateToCollectionTab(
          databaseName,
          collectionName,
          'Documents'
        );
        await browser.clickVisible(Selectors.SelectJSONView);

        const document = await browser.$(Selectors.DocumentJSONEntry);
        await document.waitForDisplayed();

        // Recursively expand __safeContent__ so that the JSON is valid
        for (let i = 0; i < 3; i++) {
          await browser.clickVisible(
            `${Selectors.DocumentJSONEntry} .ace_fold-widget.ace_closed`
          );
        }
        let json = '';
        await browser.waitUntil(async function () {
          json = await document.getText();
          try {
            JSON.parse(json);
            return true;
          } catch {
            return false;
          }
        });

        expect(json).to.include('30303030');
        expect(json).to.include('__safeContent__');

        await browser.hover('[data-test-id="editable-json"]');
        await browser.clickVisible('[data-testid="edit-document-button"]');

        const newjson = JSON.stringify({
          ...JSON.parse(json),
          phoneNumber: '10101010',
        });
        await browser.setAceValue(
          '[data-test-id="editable-json"] .ace_editor',
          newjson
        );

        const footer = await document.$(Selectors.DocumentFooterMessage);
        expect(await footer.getText()).to.equal('Document modified.');

        const button = await document.$(Selectors.UpdateDocumentButton);
        await button.click();
        await footer.waitForDisplayed({ reverse: true });

        await browser.runFindOperation(
          'Documents',
          "{ phoneNumber: '10101010' }"
        );

        const modifiedResult = await getFirstListDocument(browser);
        expect(modifiedResult.phoneNumber).to.be.equal('"10101010"');
      });

      it('can not edit the copied encrypted field', async function () {
        await browser.shellEval(`db.createCollection('${collectionName}')`);
        await browser.shellEval(
          `db[${JSON.stringify(
            collectionName
          )}].insertOne({ "phoneNumber": "30303030", "name": "Person Z" })`
        );

        const doc = await plainMongo
          .db(databaseName)
          .collection(collectionName)
          .findOne();

        await plainMongo.db(databaseName).collection(collectionName).insertOne({
          phoneNumber: doc?.phoneNumber,
          faxNumber: doc?.phoneNumber,
          name: 'La La',
        });

        await browser.clickVisible(Selectors.SidebarInstanceRefreshButton);
        await browser.navigateToCollectionTab(
          databaseName,
          collectionName,
          'Documents'
        );

        await browser.runFindOperation('Documents', "{ name: 'Person Z' }");

        const originalDocument = await browser.$(Selectors.DocumentListEntry);
        const originalValue = await originalDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="phoneNumber"] ${Selectors.HadronDocumentClickableValue}`
        );
        await originalValue.doubleClick();
        const originalDocumentPhoneNumberEditor = await originalDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="phoneNumber"] ${Selectors.HadronDocumentValueEditor}`
        );
        const isOriginalDocumentPhoneNumberEditorExisting =
          await originalDocumentPhoneNumberEditor.isExisting();
        expect(isOriginalDocumentPhoneNumberEditorExisting).to.be.equal(true);

        await browser.runFindOperation('Documents', "{ name: 'La La' }");

        const copiedDocument = await browser.$(Selectors.DocumentListEntry);
        const copiedValue = await copiedDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="phoneNumber"] ${Selectors.HadronDocumentClickableValue}`
        );
        await copiedValue.doubleClick();
        const copiedDocumentPhoneNumberEditor = await copiedDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="phoneNumber"] ${Selectors.HadronDocumentValueEditor}`
        );
        const isCopiedDocumentPhoneNumberEditorExisting =
          await copiedDocumentPhoneNumberEditor.isExisting();
        expect(isCopiedDocumentPhoneNumberEditorExisting).to.be.equal(true);
        const copiedDocumentFaxNumberEditor = await copiedDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="faxNumber"] ${Selectors.HadronDocumentValueEditor}`
        );
        const isCopiedDocumentFaxNumberEditorExisting =
          await copiedDocumentFaxNumberEditor.isExisting();
        expect(isCopiedDocumentFaxNumberEditorExisting).to.be.equal(true);

        const copiedDocumentFaxNumberDecryptedIcon = await copiedDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="faxNumber"] ${Selectors.HadronDocumentElementDecryptedIcon}`
        );
        const isCopiedDocumentFaxNumberDecryptedIconExisting =
          await copiedDocumentFaxNumberDecryptedIcon.isExisting();
        expect(isCopiedDocumentFaxNumberDecryptedIconExisting).to.be.equal(
          true
        );

        await copiedDocumentFaxNumberEditor.setValue('0');

        const button = await copiedDocument.$(Selectors.UpdateDocumentButton);
        await button.click();

        const footer = await copiedDocument.$(Selectors.DocumentFooterMessage);
        expect(await footer.getText()).to.equal(
          'Update blocked as it could unintentionally write unencrypted data due to a missing or incomplete schema.'
        );
      });

      it('shows incomplete schema for cloned document banner', async function () {
        await browser.shellEval(`db.createCollection('${collectionName}')`);
        await browser.shellEval(
          `db[${JSON.stringify(
            collectionName
          )}].insertOne({ "phoneNumber": "30303030", "name": "First" })`
        );

        const doc = await plainMongo
          .db(databaseName)
          .collection(collectionName)
          .findOne();

        await plainMongo.db(databaseName).collection(collectionName).insertOne({
          phoneNumber: doc?.phoneNumber,
          faxNumber: doc?.phoneNumber,
          name: 'Second',
        });

        await browser.clickVisible(Selectors.SidebarInstanceRefreshButton);
        await browser.navigateToCollectionTab(
          databaseName,
          collectionName,
          'Documents'
        );

        await browser.runFindOperation('Documents', "{ name: 'Second' }");

        const document = await browser.$(Selectors.DocumentListEntry);
        await document.waitForDisplayed();

        await browser.hover(Selectors.DocumentListEntry);
        await browser.clickVisible(Selectors.CloneDocumentButton);

        // wait for the modal to appear
        const insertDialog = await browser.$(Selectors.InsertDialog);
        await insertDialog.waitForDisplayed();

        // set the text in the editor
        await browser.setAceValue(
          Selectors.InsertJSONEditor,
          '{ "phoneNumber": "30303030", "faxNumber": "30303030", "name": "Third" }'
        );

        const incompleteSchemaForClonedDocMsg = await browser.$(
          Selectors.incompleteSchemaForClonedDocMsg
        );
        const incompleteSchemaForClonedDocMsgText =
          await incompleteSchemaForClonedDocMsg.getText();
        expect(incompleteSchemaForClonedDocMsgText).to.include('phoneNumber');

        // confirm
        const insertConfirm = await browser.$(Selectors.InsertConfirm);
        await insertConfirm.waitForEnabled();
        await browser.clickVisible(Selectors.InsertConfirm);

        // wait for the modal to go away
        await insertDialog.waitForDisplayed({ reverse: true });

        await browser.runFindOperation('Documents', "{ name: 'Third' }");

        const result = await getFirstListDocument(browser);

        delete result._id;
        delete result.__safeContent__;

        expect(result).to.deep.equal({
          phoneNumber: '"30303030"',
          faxNumber: '"30303030"',
          name: '"Third"',
        });

        const clonedDocument = await browser.$(Selectors.DocumentListEntry);

        const clonedDocumentPhoneNumberDecryptedIcon = await clonedDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="phoneNumber"] ${Selectors.HadronDocumentElementDecryptedIcon}`
        );
        const isClonedDocumentPhoneNumberDecryptedIconExisting =
          await clonedDocumentPhoneNumberDecryptedIcon.isExisting();
        expect(isClonedDocumentPhoneNumberDecryptedIconExisting).to.be.equal(
          true
        );

        const clonedDocumentFaxNumberDecryptedIcon = await clonedDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="faxNumber"] ${Selectors.HadronDocumentElementDecryptedIcon}`
        );
        const isClonedDocumentFaxNumberDecryptedIconExisting =
          await clonedDocumentFaxNumberDecryptedIcon.isExisting();
        expect(isClonedDocumentFaxNumberDecryptedIconExisting).to.be.equal(
          false
        );
      });

      it('can enable and disable in-use encryption from the sidebar', async function () {
        await browser.shellEval(`db.createCollection('${collectionName}')`);
        await browser.shellEval(
          `db[${JSON.stringify(
            collectionName
          )}].insertOne({ "phoneNumber": "30303030", "name": "Person Z" })`
        );

        await browser.navigateToCollectionTab(
          databaseName,
          collectionName,
          'Documents'
        );

        let decryptedResult = await getFirstListDocument(browser);

        delete decryptedResult._id;
        delete decryptedResult.__safeContent__;

        expect(decryptedResult).to.deep.equal({
          phoneNumber: '"30303030"',
          name: '"Person Z"',
        });

        await browser.clickVisible(Selectors.FleConnectionConfigurationBanner);

        let modal = await browser.$(Selectors.CSFLEConnectionModal);
        await modal.waitForDisplayed();

        await browser.clickVisible(Selectors.SetCSFLEEnabledLabel);

        await browser.clickVisible(Selectors.CSFLEConnectionModalCloseButton);
        await modal.waitForDisplayed({ reverse: true });

        const encryptedResult = await getFirstListDocument(browser);

        delete encryptedResult._id;
        delete encryptedResult.__safeContent__;

        expect(encryptedResult).to.deep.equal({
          phoneNumber: '*********',
          name: '"Person Z"',
        });

        await browser.clickVisible(Selectors.FleConnectionConfigurationBanner);

        modal = await browser.$(Selectors.CSFLEConnectionModal);
        await modal.waitForDisplayed();

        await browser.clickVisible(Selectors.SetCSFLEEnabledLabel);

        await browser.clickVisible(Selectors.CSFLEConnectionModalCloseButton);
        await modal.waitForDisplayed({ reverse: true });

        decryptedResult = await getFirstListDocument(browser);

        delete decryptedResult._id;
        delete decryptedResult.__safeContent__;

        expect(decryptedResult).to.deep.equal({
          phoneNumber: '"30303030"',
          name: '"Person Z"',
        });
      });
    });
  });
});
