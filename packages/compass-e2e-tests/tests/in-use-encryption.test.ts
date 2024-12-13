import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  serverSatisfies,
  skipForWeb,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import { MongoClient } from 'mongodb';

import delay from '../helpers/delay';
import type { ConnectFormState } from '../helpers/connect-form-state';

const CONNECTION_HOSTS = '127.0.0.1:27091';
const CONNECTION_STRING = `mongodb://${CONNECTION_HOSTS}/`;

async function refresh(browser: CompassBrowser, connectionName: string) {
  // We refresh immediately after running commands, so there is an opportunity
  // for race conditions. Ideally we'd wait for something to become true, then
  // hit refresh, then wait for a transition to occur that will correlate to the
  // data actually being refreshed and arriving.

  await browser.selectConnectionMenuItem(
    connectionName,
    Selectors.Multiple.RefreshDatabasesItem
  );
}

/**
 * @securityTest In-Use Encryption Testing
 *
 * MongoDB supports a set of features referred to as "In-Use Encryption".
 * The most sensitive data handled as part of these features are Key Management System
 * credentials -- our tests verify that these are not stored, unless the user explicitly
 * requests that behavior.
 *
 * Additionally, the application provides a layer of protection for users against
 * accidental misconfiguration: When updating decrypted data coming from the server,
 * we ensure that when writing back into the database, it is always encrypted again,
 * and never sent in plaintext.
 */
describe('CSFLE / QE', function () {
  // reuse the same connectionName so that connectWithConnectionForm (or
  // connectWithConnectionString for that matter) will remove the connection
  // every time before connecting
  const connectionName = 'fle';

  before(function () {
    skipForWeb(this, 'not available in compass-web');
  });

  describe('server version gte 4.2.20 and not a linux platform', function () {
    const databaseName = 'fle-test';
    const collectionName = 'my-another-collection';
    let compass: Compass;
    let browser: CompassBrowser;

    before(async function () {
      if (
        !serverSatisfies('>= 4.2.20', true) ||
        // TODO(COMPASS-5911): Saved connections are not being displayed after disconnect on Linux CI.
        process.platform === 'linux'
      ) {
        return this.skip();
      }

      compass = await init(this.test?.fullTitle());
      browser = compass.browser;
    });

    beforeEach(async function () {
      await browser.disconnectAll();
    });

    afterEach(async function () {
      if (compass) {
        await screenshotIfFailed(compass, this.currentTest);
      }
    });

    after(async function () {
      if (compass) {
        await cleanup(compass);
      }
    });

    it('does not store KMS settings if the checkbox is not set', async function () {
      const options: ConnectFormState = {
        hosts: [CONNECTION_HOSTS],
        fleKeyVaultNamespace: `${databaseName}.keyvault`,
        kmsProviders: {
          local: [
            {
              key: 'A'.repeat(128),
            },
          ],
        },
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

      // Save & Connect

      // in the multiple connections world the favorite form fields are just
      // part of the connection form
      options.connectionName = connectionName;
      options.connectionColor = 'color1';
      options.connectionFavorite = true;

      await browser.setConnectFormState(options);

      await browser.clickVisible(Selectors.ConnectionModalConnectButton);

      // Wait for it to connect
      await browser.waitForConnectionResult(connectionName, {
        connectionStatus: 'success',
      });

      // extra pause to make very sure that it saved the connection before we disconnect
      await delay(10000);

      try {
        await browser.disconnectAll();
      } catch (err) {
        console.error('Error during disconnect:');
        console.error(err);
      }

      // extra pause to make very sure that it loaded the connections
      await delay(10000);

      // in the multiple connections world, if we clicked the connection it
      // would connect and that's not what we want in this case. So we select
      // edit from the menu.
      await browser.selectConnectionMenuItem(
        connectionName,
        Selectors.Multiple.EditConnectionItem
      );

      // The modal should appear and the title of the modal should be the favorite name
      await browser.waitUntil(async () => {
        const connectionTitleSelector = Selectors.ConnectionModalTitle;
        const text = await browser.$(connectionTitleSelector).getText();
        return text === connectionName;
      });

      // The form should have the relevant field values
      const state = await browser.getConnectFormState();
      expect(state.connectionString).to.be.equal(CONNECTION_STRING);
      expect(state.fleKeyVaultNamespace).to.be.equal(
        `${databaseName}.keyvault`
      );
      expect(state.fleStoreCredentials).to.be.equal(false);
      expect(state.fleEncryptedFieldsMap).to.include(
        `${databaseName}.${collectionName}`
      );
    });
  });

  describe('server version gte 7.0.0', function () {
    before(function () {
      // Queryable Encryption v2 only available on 7.0+
      if (!serverSatisfies('>= 7.0', true)) {
        return this.skip();
      }
    });

    describe('when fleEncryptedFieldsMap is not specified while connecting', function () {
      const databaseName = 'db-for-fle';
      const collectionName = 'my-encrypted-collection';
      let compass: Compass;
      let browser: CompassBrowser;
      const connectionName = 'fle';

      before(async function () {
        compass = await init(this.test?.fullTitle());
        browser = compass.browser;
        await browser.connectWithConnectionForm({
          hosts: [CONNECTION_HOSTS],
          fleKeyVaultNamespace: `${databaseName}.keyvault`,
          kmsProviders: {
            local: [
              {
                name: 'local',
                key: 'A'.repeat(128),
              },
            ],
          },
          connectionName,
        });

        // create a collection so we can navigate to the database
        await browser.shellEval(
          connectionName,
          `db.getMongo().getDB('${databaseName}').createCollection('default')`
        );
        await refresh(browser, connectionName);
      });

      after(async function () {
        if (compass) {
          await cleanup(compass);
        }
      });

      afterEach(async function () {
        if (compass) {
          await screenshotIfFailed(compass, this.currentTest);
        }
      });

      it('can create a fle2 collection with encryptedFields', async function () {
        await browser.navigateToDatabaseCollectionsTab(
          connectionName,
          databaseName
        );

        // open the create collection modal from the button at the top
        await browser.clickVisible(Selectors.DatabaseCreateCollectionButton);
        await browser.addCollection(
          collectionName,
          {
            encryptedFields: `{
              fields: [{
                path: 'phoneNumber',
                keyId: UUID("fd6275d7-9260-4e6c-a86b-68ec5240814a"),
                bsonType: 'string',
                queries: { queryType: 'equality' }
              }]
            }`,
          },
          'add-collection-modal-encryptedfields.png'
        );

        await browser.navigateToDatabaseCollectionsTab(
          connectionName,
          databaseName
        );

        const collectionListFLE2BadgeElement = browser.$(
          Selectors.CollectionListFLE2Badge
        );
        const collectionListFLE2BadgeElementText =
          await collectionListFLE2BadgeElement.getText();
        expect(collectionListFLE2BadgeElementText).to.equal(
          'QUERYABLE ENCRYPTION'
        );

        await browser.navigateToCollectionTab(
          connectionName,
          databaseName,
          collectionName,
          'Documents'
        );

        const collectionHeaderLE2BadgeElement = browser.$(
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
      const collectionNameRange = 'my-range-collection';
      let compass: Compass;
      let browser: CompassBrowser;
      let plainMongo: MongoClient;

      before(async function () {
        compass = await init(this.test?.fullTitle());
        browser = compass.browser;
      });

      beforeEach(async function () {
        await browser.disconnectAll();
        await browser.connectWithConnectionForm({
          hosts: [CONNECTION_HOSTS],
          fleKeyVaultNamespace: `${databaseName}.keyvault`,
          kmsProviders: {
            local: [
              {
                name: 'local',
                key: 'A'.repeat(128),
              },
            ],
          },
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
            },
            '${databaseName}.${collectionNameRange}': {
              fields: [
                {
                  path: 'date',
                  keyId: UUID("28bbc608-524e-4717-9246-33633361788e"),
                  bsonType: 'date',
                  queries: [{
                    queryType: "range",
                    contention: 4,
                    sparsity: 1,
                    min: new Date('1970'),
                    max: new Date('2100')
                  }]
                }
              ]
            }
          }`,
          connectionName,
        });
        await browser.shellEval(connectionName, [
          `use ${databaseName}`,
          'db.keyvault.insertOne({' +
            '"_id": UUID("28bbc608-524e-4717-9246-33633361788e"),' +
            '"keyMaterial": BinData(0, "/yeYyj8IxowIIZGOs5iUcJaUm7KHhoBDAAzNxBz8c5mr2hwBIsBWtDiMU4nhx3fCBrrN3cqXG6jwPgR22gZDIiMZB5+xhplcE9EgNoEEBtRufBE2VjtacpXoqrMgW0+m4Dw76qWUCsF/k1KxYBJabM35KkEoD6+BI1QxU0rwRsR1rE/OLuBPKOEq6pmT5x74i+ursFlTld+5WiOySRDcZg=="),' +
            '"creationDate": ISODate("2022-05-27T18:28:33.925Z"),' +
            '"updateDate": ISODate("2022-05-27T18:28:33.925Z"),' +
            '"status": 0,' +
            '"masterKey": { "provider" : "local:local" }' +
            '})',
          // make sure there is a collection so we can navigate to the database
          `db.getMongo().getDB('${databaseName}').createCollection('default')`,
        ]);
        await refresh(browser, connectionName);

        plainMongo = await MongoClient.connect(CONNECTION_STRING);
      });

      after(async function () {
        if (compass) {
          await cleanup(compass);
        }
      });

      afterEach(async function () {
        if (compass) {
          await screenshotIfFailed(compass, this.currentTest);
        }
        await plainMongo.db(databaseName).dropDatabase();
        await plainMongo.close();
      });

      it('can create a fle2 collection without encryptedFields', async function () {
        await browser.navigateToDatabaseCollectionsTab(
          connectionName,
          databaseName
        );
        await browser.clickVisible(Selectors.DatabaseCreateCollectionButton);
        await browser.addCollection(collectionName);

        await browser.navigateToDatabaseCollectionsTab(
          connectionName,
          databaseName
        );

        const selector = Selectors.collectionCard(databaseName, collectionName);
        await browser.scrollToVirtualItem(
          Selectors.CollectionsGrid,
          selector,
          'grid'
        );

        const collectionCard = browser.$(selector);
        await collectionCard.waitForDisplayed();

        const collectionListFLE2BadgeElement = browser.$(
          Selectors.CollectionListFLE2Badge
        );
        const collectionListFLE2BadgeElementText =
          await collectionListFLE2BadgeElement.getText();
        expect(collectionListFLE2BadgeElementText).to.equal(
          'QUERYABLE ENCRYPTION'
        );

        await browser.navigateToCollectionTab(
          connectionName,
          databaseName,
          collectionName,
          'Documents'
        );

        const collectionHeaderLE2BadgeElement = browser.$(
          Selectors.CollectionHeaderFLE2Badge
        );
        const collectionHeaderLE2BadgeElementText =
          await collectionHeaderLE2BadgeElement.getText();
        expect(collectionHeaderLE2BadgeElementText).to.include(
          'QUERYABLE ENCRYPTION'
        );
      });

      it('can insert a document with an encrypted field and a non-encrypted field', async function () {
        await browser.shellEval(connectionName, [
          `use ${databaseName}`,
          `db.createCollection('${collectionName}')`,
        ]);
        await refresh(browser, connectionName);

        await browser.navigateToCollectionTab(
          connectionName,
          databaseName,
          collectionName,
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

        // set the text in the editor
        await browser.setCodemirrorEditorValue(
          Selectors.InsertJSONEditor,
          '{ "phoneNumber": "30303030", "name": "Person X" }'
        );

        const insertCSFLEHasKnownSchemaMsg = browser.$(
          Selectors.insertCSFLEHasKnownSchemaMsg
        );
        const insertCSFLEHasKnownSchemaMsgText =
          await insertCSFLEHasKnownSchemaMsg.getText();
        expect(insertCSFLEHasKnownSchemaMsgText).to.include('phoneNumber');

        // confirm
        const insertConfirm = browser.$(Selectors.InsertConfirm);
        await insertConfirm.waitForEnabled();
        await browser.clickVisible(Selectors.InsertConfirm);

        // wait for the modal to go away
        await insertDialog.waitForDisplayed({ reverse: true });

        const result = await browser.getFirstListDocument();

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
        await browser.shellEval(connectionName, [
          `use ${databaseName}`,
          `db.createCollection('${collectionName}')`,
          `db[${JSON.stringify(
            collectionName
          )}].insertOne({ "phoneNumber": "30303030", "name": "Person X" })`,
        ]);
        await refresh(browser, connectionName);

        await browser.navigateToCollectionTab(
          connectionName,
          databaseName,
          collectionName,
          'Documents'
        );
        const document = browser.$(Selectors.DocumentListEntry);

        const documentPhoneNumberDecryptedIcon = document.$(
          `${Selectors.HadronDocumentElement}[data-field="phoneNumber"] ${Selectors.HadronDocumentElementDecryptedIcon}`
        );
        const isDocumentPhoneNumberDecryptedIconExisting =
          await documentPhoneNumberDecryptedIcon.isExisting();
        expect(isDocumentPhoneNumberDecryptedIconExisting).to.be.equal(true);
      });

      for (const [mode, coll] of [
        ['indexed', collectionName],
        ['unindexed', collectionNameUnindexed],
        ['range', collectionNameRange],
      ] as const) {
        it(`can edit and query the ${mode} encrypted field in the CRUD view`, async function () {
          if (mode === 'range' && serverSatisfies('< 7.99.99', true)) {
            // We are using latest crypt libraries which only support range algorithm.
            console.log('Skipping range test for server version < 7.99.99');
            return this.skip();
          }
          const [field, oldValue, newValue] =
            mode !== 'range'
              ? ['phoneNumber', '"30303030"', '"10101010"']
              : [
                  'date',
                  'new Date("1999-01-01T00:00:00.000Z")',
                  'new Date("2023-02-10T11:08:34.456Z")',
                ];
          const oldValueJS = eval(oldValue);
          const newValueJS = eval(newValue);
          const toString = (v: any) =>
            v?.toISOString?.()?.replace(/Z$/, '+00:00') ?? JSON.stringify(v);

          await browser.shellEval(connectionName, [
            `use ${databaseName}`,
            `db.createCollection('${coll}')`,
            `db[${JSON.stringify(
              coll
            )}].insertOne({ "${field}": ${oldValue}, "name": "Person X" })`,
          ]);
          await refresh(browser, connectionName);

          await browser.navigateToCollectionTab(
            connectionName,
            databaseName,
            coll,
            'Documents'
          );

          const result = await browser.getFirstListDocument();
          expect(result[field]).to.be.equal(toString(oldValueJS));

          const document = browser.$(Selectors.DocumentListEntry);
          const value = document.$(
            `${Selectors.HadronDocumentElement}[data-field="${field}"] ${Selectors.HadronDocumentClickableValue}`
          );
          await value.doubleClick();

          const input = document.$(
            `${Selectors.HadronDocumentElement}[data-field="${field}"] ${Selectors.HadronDocumentValueEditor}`
          );
          await browser.setValueVisible(
            input,
            typeof newValueJS === 'string' ? newValueJS : toString(newValueJS)
          );

          const footer = document.$(Selectors.DocumentFooterMessage);
          expect(await footer.getText()).to.equal('Document modified.');

          const button = document.$(Selectors.UpdateDocumentButton);
          await button.click();
          try {
            // Prompt failure is required here and so the timeout should be
            // present and smaller than the default one to allow for tests to
            // proceed correctly
            await footer.waitForDisplayed({ reverse: true, timeout: 10000 });
          } catch (err) {
            if (
              mode === 'unindexed' &&
              (await footer.getText()) ===
                'Found indexed encrypted fields but could not find __safeContent__'
            ) {
              return; // MongodDB < 6.1 is affected by SERVER-68065 where updates on unindexed fields in QE are buggy.
            }
          }
          await footer.waitForDisplayed({ reverse: true });

          await browser.runFindOperation(
            'Documents',
            // Querying on encrypted fields when they are unindexed is not
            // supported, so we use document _id instead
            mode === 'unindexed'
              ? `{ _id: ${result._id} }`
              : `{ ${field}: ${newValue} }`
          );

          const modifiedResult = await browser.getFirstListDocument();
          expect(modifiedResult[field]).to.be.equal(toString(newValueJS));
          expect(modifiedResult._id).to.be.equal(result._id);
        });
      }

      it('can edit and query the encrypted field in the JSON view', async function () {
        await browser.shellEval(connectionName, [
          `use ${databaseName}`,
          `db.createCollection('${collectionName}')`,
          `db[${JSON.stringify(
            collectionName
          )}].insertOne({ "phoneNumber": "30303030", "name": "Person X" })`,
        ]);
        await refresh(browser, connectionName);

        await browser.navigateToCollectionTab(
          connectionName,
          databaseName,
          collectionName,
          'Documents'
        );
        await browser.clickVisible(Selectors.SelectJSONView);

        const document = browser.$(Selectors.DocumentJSONEntry);
        await document.waitForDisplayed();

        const json = await browser.getCodemirrorEditorText(
          Selectors.DocumentJSONEntry
        );

        expect(json).to.include('30303030');
        expect(json).to.include('__safeContent__');

        await browser.hover(Selectors.JSONDocumentCard);
        await browser.clickVisible(Selectors.JSONEditDocumentButton);

        const newjson = JSON.stringify({
          ...JSON.parse(json),
          phoneNumber: '10101010',
        });
        await browser.setCodemirrorEditorValue(
          Selectors.DocumentJSONEntry,
          newjson
        );

        const footer = document.$(Selectors.DocumentFooterMessage);
        expect(await footer.getText()).to.equal('Document modified.');

        const button = document.$(Selectors.UpdateDocumentButton);
        await button.click();
        await footer.waitForDisplayed({ reverse: true });

        await browser.runFindOperation(
          'Documents',
          "{ phoneNumber: '10101010' }"
        );

        const modifiedResult = await browser.getFirstListDocument();
        expect(modifiedResult.phoneNumber).to.be.equal('"10101010"');
      });

      it('can not edit the copied encrypted field', async function () {
        await browser.shellEval(connectionName, [
          `use ${databaseName}`,
          `db.createCollection('${collectionName}')`,
          `db[${JSON.stringify(
            collectionName
          )}].insertOne({ "phoneNumber": "30303030", "name": "Person Z" })`,
        ]);
        await refresh(browser, connectionName);

        const doc = await plainMongo
          .db(databaseName)
          .collection(collectionName)
          .findOne();

        await plainMongo.db(databaseName).collection(collectionName).insertOne({
          phoneNumber: doc?.phoneNumber,
          faxNumber: doc?.phoneNumber,
          name: 'La La',
        });

        await refresh(browser, connectionName);
        await browser.navigateToCollectionTab(
          connectionName,
          databaseName,
          collectionName,
          'Documents'
        );

        await browser.runFindOperation('Documents', "{ name: 'Person Z' }");

        const originalDocument = browser.$(Selectors.DocumentListEntry);
        const originalValue = originalDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="phoneNumber"] ${Selectors.HadronDocumentClickableValue}`
        );
        await originalValue.doubleClick();
        const originalDocumentPhoneNumberEditor = originalDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="phoneNumber"] ${Selectors.HadronDocumentValueEditor}`
        );
        const isOriginalDocumentPhoneNumberEditorExisting =
          await originalDocumentPhoneNumberEditor.isExisting();
        expect(isOriginalDocumentPhoneNumberEditorExisting).to.be.equal(true);

        await browser.runFindOperation('Documents', "{ name: 'La La' }");

        const copiedDocument = browser.$(Selectors.DocumentListEntry);
        const copiedValue = copiedDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="phoneNumber"] ${Selectors.HadronDocumentClickableValue}`
        );
        await copiedValue.doubleClick();
        const copiedDocumentPhoneNumberEditor = copiedDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="phoneNumber"] ${Selectors.HadronDocumentValueEditor}`
        );
        const isCopiedDocumentPhoneNumberEditorExisting =
          await copiedDocumentPhoneNumberEditor.isExisting();
        expect(isCopiedDocumentPhoneNumberEditorExisting).to.be.equal(true);
        const copiedDocumentFaxNumberEditor = copiedDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="faxNumber"] ${Selectors.HadronDocumentValueEditor}`
        );
        const isCopiedDocumentFaxNumberEditorExisting =
          await copiedDocumentFaxNumberEditor.isExisting();
        expect(isCopiedDocumentFaxNumberEditorExisting).to.be.equal(true);

        const copiedDocumentFaxNumberDecryptedIcon = copiedDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="faxNumber"] ${Selectors.HadronDocumentElementDecryptedIcon}`
        );
        const isCopiedDocumentFaxNumberDecryptedIconExisting =
          await copiedDocumentFaxNumberDecryptedIcon.isExisting();
        expect(isCopiedDocumentFaxNumberDecryptedIconExisting).to.be.equal(
          true
        );

        await browser.setValueVisible(copiedDocumentFaxNumberEditor, '0');

        const button = copiedDocument.$(Selectors.UpdateDocumentButton);
        await button.click();

        const footer = copiedDocument.$(Selectors.DocumentFooterMessage);
        expect(await footer.getText()).to.equal(
          'Update blocked as it could unintentionally write unencrypted data due to a missing or incomplete schema.'
        );
      });

      it('shows incomplete schema for cloned document banner', async function () {
        await browser.shellEval(connectionName, [
          `use ${databaseName}`,
          `db.createCollection('${collectionName}')`,
          `db[${JSON.stringify(
            collectionName
          )}].insertOne({ "phoneNumber": "30303030", "name": "First" })`,
        ]);
        await refresh(browser, connectionName);

        const doc = await plainMongo
          .db(databaseName)
          .collection(collectionName)
          .findOne();

        await plainMongo.db(databaseName).collection(collectionName).insertOne({
          phoneNumber: doc?.phoneNumber,
          faxNumber: doc?.phoneNumber,
          name: 'Second',
        });

        await refresh(browser, connectionName);
        await browser.navigateToCollectionTab(
          connectionName,
          databaseName,
          collectionName,
          'Documents'
        );

        await browser.runFindOperation('Documents', "{ name: 'Second' }");

        const document = browser.$(Selectors.DocumentListEntry);
        await document.waitForDisplayed();

        await browser.hover(Selectors.DocumentListEntry);
        await browser.clickVisible(Selectors.CloneDocumentButton);

        // wait for the modal to appear
        const insertDialog = browser.$(Selectors.InsertDialog);
        await insertDialog.waitForDisplayed();

        // set the text in the editor
        await browser.setCodemirrorEditorValue(
          Selectors.InsertJSONEditor,
          '{ "phoneNumber": "30303030", "faxNumber": "30303030", "name": "Third" }'
        );

        const incompleteSchemaForClonedDocMsg = browser.$(
          Selectors.incompleteSchemaForClonedDocMsg
        );
        const incompleteSchemaForClonedDocMsgText =
          await incompleteSchemaForClonedDocMsg.getText();
        expect(incompleteSchemaForClonedDocMsgText).to.include('phoneNumber');

        // confirm
        const insertConfirm = browser.$(Selectors.InsertConfirm);
        await insertConfirm.waitForEnabled();
        await browser.clickVisible(Selectors.InsertConfirm);

        // wait for the modal to go away
        await insertDialog.waitForDisplayed({ reverse: true });

        await browser.runFindOperation('Documents', "{ name: 'Third' }");

        const result = await browser.getFirstListDocument();

        delete result._id;
        delete result.__safeContent__;

        expect(result).to.deep.equal({
          phoneNumber: '"30303030"',
          faxNumber: '"30303030"',
          name: '"Third"',
        });

        const clonedDocument = browser.$(Selectors.DocumentListEntry);

        const clonedDocumentPhoneNumberDecryptedIcon = clonedDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="phoneNumber"] ${Selectors.HadronDocumentElementDecryptedIcon}`
        );
        const isClonedDocumentPhoneNumberDecryptedIconExisting =
          await clonedDocumentPhoneNumberDecryptedIcon.isExisting();
        expect(isClonedDocumentPhoneNumberDecryptedIconExisting).to.be.equal(
          true
        );

        const clonedDocumentFaxNumberDecryptedIcon = clonedDocument.$(
          `${Selectors.HadronDocumentElement}[data-field="faxNumber"] ${Selectors.HadronDocumentElementDecryptedIcon}`
        );
        const isClonedDocumentFaxNumberDecryptedIconExisting =
          await clonedDocumentFaxNumberDecryptedIcon.isExisting();
        expect(isClonedDocumentFaxNumberDecryptedIconExisting).to.be.equal(
          false
        );
      });

      it('can enable and disable in-use encryption from the sidebar', async function () {
        await browser.shellEval(connectionName, [
          `use ${databaseName}`,
          `db.createCollection('${collectionName}')`,
          `db[${JSON.stringify(
            collectionName
          )}].insertOne({ "phoneNumber": "30303030", "name": "Person Z" })`,
        ]);
        await refresh(browser, connectionName);

        await browser.navigateToCollectionTab(
          connectionName,
          databaseName,
          collectionName,
          'Documents'
        );

        let decryptedResult = await browser.getFirstListDocument();

        delete decryptedResult._id;
        delete decryptedResult.__safeContent__;

        expect(decryptedResult).to.deep.equal({
          phoneNumber: '"30303030"',
          name: '"Person Z"',
        });

        await browser.clickVisible(
          Selectors.sidebarConnectionActionButton(
            connectionName,
            Selectors.Multiple.InUseEncryptionMarker
          )
        );

        await browser.$(Selectors.CSFLEConnectionModal).waitForDisplayed();

        await browser.clickVisible(Selectors.SetCSFLEEnabledLabel);

        await browser.clickVisible(Selectors.CSFLEConnectionModalCloseButton);
        await browser
          .$(Selectors.CSFLEConnectionModal)
          .waitForDisplayed({ reverse: true });

        const encryptedResult = await browser.getFirstListDocument();

        delete encryptedResult._id;
        delete encryptedResult.__safeContent__;

        expect(encryptedResult).to.deep.equal({
          phoneNumber: '*********',
          name: '"Person Z"',
        });

        await browser.clickVisible(
          Selectors.sidebarConnectionActionButton(
            connectionName,
            Selectors.Multiple.InUseEncryptionMarker
          )
        );

        await browser.$(Selectors.CSFLEConnectionModal).waitForDisplayed();

        await browser.clickVisible(Selectors.SetCSFLEEnabledLabel);

        await browser.clickVisible(Selectors.CSFLEConnectionModalCloseButton);
        await browser
          .$(Selectors.CSFLEConnectionModal)
          .waitForDisplayed({ reverse: true });

        decryptedResult = await browser.getFirstListDocument();

        delete decryptedResult._id;
        delete decryptedResult.__safeContent__;

        expect(decryptedResult).to.deep.equal({
          phoneNumber: '"30303030"',
          name: '"Person Z"',
        });
      });
    });

    describe('multiple kms providers of the same type', function () {
      const databaseName = 'fle-test';
      const collection1 = 'collection-1';
      const collection2 = 'collection-2';
      const phoneNumber1 = '1234567890';
      const phoneNumber2 = '0987654321';
      let compass: Compass;
      let browser: CompassBrowser;
      let plainMongo: MongoClient;

      before(async function () {
        compass = await init(this.test?.fullTitle());
        browser = compass.browser;
      });

      beforeEach(async function () {
        await browser.disconnectAll();
        await browser.connectWithConnectionForm({
          hosts: [CONNECTION_HOSTS],
          fleKeyVaultNamespace: `${databaseName}.keyvault`,
          fleEncryptedFieldsMap: `{
            '${databaseName}.${collection1}': {
              fields: [
                {
                  path: 'phoneNumber',
                  keyId: UUID("28bbc608-524e-4717-9246-33633361788e"),
                  bsonType: 'string',
                  queries: { queryType: 'equality' }
                }
              ]
            },
            '${databaseName}.${collection2}': {
              fields: [
                {
                  path: 'phoneNumber',
                  keyId: UUID("9c932ef9-f43c-489a-98f3-31012a83bc46"),
                  bsonType: 'string',
                  queries: { queryType: 'equality' }
                }
              ]
            },
          }`,
          kmsProviders: {
            local: [
              {
                name: 'localA',
                key: 'A'.repeat(128),
              },
              {
                name: 'localB',
                key: 'B'.repeat(128),
              },
            ],
          },
          connectionName,
        });
        await browser.shellEval(connectionName, [
          `use ${databaseName}`,
          'db.keyvault.insertOne({' +
            '"_id": UUID("28bbc608-524e-4717-9246-33633361788e"),' +
            '"keyMaterial": Binary.createFromBase64("fqZuVyi6ThsSNbgUWtn9MCFDxOQtL3dibMa2P456l+1xJUvAkqzZB2SZBr5Zd2xLDua45IgYAagWFeLhX+hpi0KkdVgdIZu2zlZ+mJSbtwZrFxcuyQ3oPCPnp7l0YH1fSfxeoEIQNVMFpnHzfbu2CgZ/nC8jp6IaB9t+tcszTDdJRLeHnzPuHIKzblFGP8CfuQHJ81B5OA0PrBJr+HbjJg==", 0),' +
            '"creationDate": ISODate("2022-05-27T18:28:33.925Z"),' +
            '"updateDate": ISODate("2022-05-27T18:28:33.925Z"),' +
            '"status": 0,' +
            '"masterKey": { "provider" : "local:localA" }' +
            '})',
          'db.keyvault.insertOne({' +
            '"_id": UUID("9c932ef9-f43c-489a-98f3-31012a83bc46"),' +
            '"keyMaterial": Binary.createFromBase64("TymoH++xeTsaiIl498fviLaklY4xTM/baQydmVUABphJzvBsitjWfkoiKlGod/J45Vwoou1VfDRsFaiVHNth7aiFBvEsqvto5ETDFC9hSzP17c1ZrQI1nqrOfI0VGJm+WBALB7IMVFuyd9LV2i6KDIslxBfchOGR4q05Gm1Vgb/cTTUPJpvYLxmduyNSjxqH6lBAJ2ut9TgmUxCC+dMQRQ==", 0),' +
            '"creationDate": ISODate("2022-05-27T18:28:34.925Z"),' +
            '"updateDate": ISODate("2022-05-27T18:28:34.925Z"),' +
            '"status": 0,' +
            '"masterKey": { "provider" : "local:localB" }' +
            '})',
          // make sure there is a collection so we can navigate to the database
          `db.getMongo().getDB('${databaseName}').createCollection('default')`,
        ]);
        await refresh(browser, connectionName);

        plainMongo = await MongoClient.connect(CONNECTION_STRING);
      });

      after(async function () {
        if (compass) {
          await cleanup(compass);
        }
      });

      afterEach(async function () {
        if (compass) {
          await screenshotIfFailed(compass, this.currentTest);
        }
        await plainMongo.db(databaseName).dropDatabase();
        await plainMongo.close();
      });

      it('allows setting multiple kms providers of the same type', async function () {
        async function verifyCollectionHasValue(
          collection: string,
          value: string
        ) {
          await browser.navigateToCollectionTab(
            connectionName,
            databaseName,
            collection,
            'Documents'
          );
          const result = await browser.getFirstListDocument();
          expect(result.phoneNumber).to.be.equal(JSON.stringify(value));
        }

        await browser.shellEval(connectionName, [
          `use ${databaseName}`,
          `db.createCollection("${collection1}")`,
          `db.createCollection("${collection2}")`,
          `db["${collection1}"].insertOne({ "phoneNumber": "${phoneNumber1}", "name": "LocalA" })`,
          `db["${collection2}"].insertOne({ "phoneNumber": "${phoneNumber2}", "name": "LocalB" })`,
        ]);
        await refresh(browser, connectionName);

        await verifyCollectionHasValue(collection1, phoneNumber1);
        await verifyCollectionHasValue(collection2, phoneNumber2);

        // create a new encrypted collection using keyId for local:localB
        await browser.navigateToDatabaseCollectionsTab(
          connectionName,
          databaseName
        );
        const collection3 = 'collection-3';
        const phoneNumber3 = '1111111111';
        await browser.clickVisible(Selectors.DatabaseCreateCollectionButton);
        await browser.addCollection(collection3, {
          encryptedFields: `{
            fields: [{
              path: 'phoneNumber',
              keyId: UUID("9c932ef9-f43c-489a-98f3-31012a83bc46"),
              bsonType: 'string',
              queries: { queryType: 'equality' }
            }]
          }`,
        });

        await browser.shellEval(connectionName, [
          `use ${databaseName}`,
          `db["${collection3}"].insertOne({ "phoneNumber": "${phoneNumber3}", "name": "LocalB" })`,
        ]);

        await verifyCollectionHasValue(collection3, phoneNumber3);
      });
    });
  });

  describe('server version gte 6.0 and lt 7.0', function () {
    const databaseName = 'db-for-fle';
    const collectionName = 'my-encrypted-collection';

    let compass: Compass;
    let browser: CompassBrowser;

    before(async function () {
      if (!serverSatisfies('>= 6.0', true)) {
        return this.skip();
      }

      compass = await init(this.test?.fullTitle());
      browser = compass.browser;
    });

    beforeEach(async function () {
      await browser.disconnectAll();
    });

    afterEach(async function () {
      if (compass) {
        await screenshotIfFailed(compass, this.currentTest);
      }
    });

    after(async function () {
      if (compass) {
        await cleanup(compass);
      }
    });

    it('can read QE data stored in a mongodb 6 database', async function () {
      // connect without QE and insert some fixture data that we generated against a 6.x database using the shell
      await browser.connectWithConnectionForm({
        hosts: [CONNECTION_HOSTS],
        connectionName,
      });

      await browser.shellEval(connectionName, [
        `use ${databaseName}`,
        // insert the dataKey that was used to encrypt the payloads used below
        'dataKey = new UUID("2871cd1d-8317-4d0c-92be-1ac934ed26b1");',
        `db.getCollection("keyvault").insertOne({
          _id: new UUID("2871cd1d-8317-4d0c-92be-1ac934ed26b1"),
          keyMaterial: Binary.createFromHexString("519e2b15d20f00955a3960aab31e70a8e3fdb661129ef0d8a752291599488f8fda23ca64ddcbced93dbc715d03f45ab53a8e8273f2230c41c0e64d9ef746d6959cbdc1abcf0e9d020856e2da09a91ef129ac60ef13a98abcd5ee0cbfba21f1de153974996ab002bddccf7dc0268fed90a172dc373e90b63bc2369a5a1bfc78e0c2d7d81e65e970a38ca585248fef53b70452687024b8ecd308930a25414518e3", 0),
          creationDate: ISODate("2023-05-05T10:58:12.473Z"),
          updateDate: ISODate("2023-05-05T10:58:12.473Z"),
          status: 0,
          masterKey: { provider: 'local' }
        });`,
        `db.runCommand({
          create: '${collectionName}',
          encryptedFields: {
            fields: [{
              keyId: dataKey,
              path: 'v',
              bsonType: 'string',
              queries: [{ queryType: 'equality' }]
            }]
          }
        });`,
        // these payloads were encrypted using dataKey
        `db.runCommand({
          insert: '${collectionName}',
          documents: [
            {
              _id: 'asdf',
              v: Binary.createFromHexString("072871cd1d83174d0c92be1ac934ed26b1025438da7f9034a7d6bf03452c9b910381a16b4a0d52592ed6eafc64cc45dde441ac136269b4606f197e939fd54dd9fb257ce2c5afe94853b3b150a9101d65a3063f948ce05350fc4a5811eb5f29793dfd5a9cab77c680bba17f91845895cfd080c123e02a3f1c7e5d5c8c6448a0ac7d624669d0306be6fdcea35106062e742bec39a9873de969196ad95960d4bc247e98dc88a33d9c974646c8283178f3198749c7f24dbd66dc5e7ecf42efc08f64b6a646aa50e872a6f30907b54249039f3226af503d2e2e947323", 6),
              __safeContent__: [
                Binary.createFromHexString("91865d04a1a1719e2ef89d66eeb8a35515f22470558831fe9494f011e9a209c3", 0)
              ]
            },
            {
              _id: 'ghjk',
              v: Binary.createFromHexString("072871cd1d83174d0c92be1ac934ed26b10299f34210f149673b61f0d369f89290577c410b800ff38ed10eec235aef3677d3594c6371dd5b8f8d4c34769228bf7aea00b1754036a5850a4fef25c40969451151695614ae6142e954bab6c72080b5f43ccac774f6a1791bcc2ca4ca8998b9d5148441180631c7d8136034ff5019ca31a082464ec2fdcf212460a121d14dec3b8ee313541dc46689c79636929f0828dfdef7dfd4d53e1a924bbf70be34b1668d9352f6102a32265ec45d9c5cc0d7cf5f9266cf161497ee5b4a9495e16926b09282c6e4029d22d88e", 6),
              __safeContent__: [
                Binary.createFromHexString("b04e26633d569cb47b9cbec650d812a597ffdadacb9a61ee7b1661f52228d661", 0)
              ]
            }
          ],
          bypassDocumentValidation: true
        });`,
        `db.runCommand({
          insert: 'enxcol_.${collectionName}.ecoc',
          documents: [
            {
              _id: ObjectId("6454e14689ef42f381f7336b"),
              fieldName: 'v',
              value: Binary.createFromHexString("3eb89d3a95cf955ca0c8c56e54018657a45daaf465dd967d9b24895a188d7e3055734f3c0af88302ceab460874f3806fe52fa4541c9f4b32b5cee6c5a6df9399da664f576dd9bde23bce92f5deea0cb3", 0)
            },
            {
              _id: ObjectId("6454e14689ef42f381f73385"),
              fieldName: 'v',
              value: Binary.createFromHexString("2299cd805a28efb6503120e0250798f1b19137d8234690d12eb7e3b7fa74edd28e80c26022c00d53f5983f16e7b5abb7c3b95e30f265a7ba36adb290eda39370b30cedba960a4002089eb5de2fd118fc", 0)
            }
          ],
          bypassDocumentValidation: true
        });`,
        `db.runCommand({
          insert: 'enxcol_.${collectionName}.esc',
          documents: [
            {
              _id: Binary.createFromHexString("51db700df02cbbfa25498921f858d3a9d5568cabb97f7283e7b3c9d0e3520ac4", 0),
              value: Binary.createFromHexString("dc7169f28df2c990551b098b8dec8f5b1bfeb65d3f40d0fdb241a518310674a6", 0)
            },
            {
              _id: Binary.createFromHexString("948b3d29e335485b0503ffc6ade6bfa6fce664c2a1d14790a523c09223da3f09", 0),
              value: Binary.createFromHexString("7622097476c59c0ca5bf9d05a52fe725517e03ad811f6c073b0d0184a9d26131", 0)
            }
          ],
          bypassDocumentValidation: true
        });`,
      ]);

      await browser.disconnectAll();

      // now connect with QE and check that we can query the data stored in a 6.x database
      await browser.connectWithConnectionForm({
        hosts: [CONNECTION_HOSTS],
        fleKeyVaultNamespace: `${databaseName}.keyvault`,
        kmsProviders: {
          local: [
            {
              key: 'A'.repeat(128),
            },
          ],
        },
        connectionName,
      });

      await browser.navigateToCollectionTab(
        connectionName,
        databaseName,
        collectionName,
        'Documents'
      );

      // { v: "123", _id: 'asdf' }
      // { v: "456", _id: 'ghjk' }

      let decryptedResult = await browser.getFirstListDocument();
      delete decryptedResult.__safeContent__;
      expect(decryptedResult).to.deep.equal({ v: '"123"', _id: '"asdf"' });

      // We can't search for the encrypted value, but it does get decrypted
      await browser.runFindOperation('Documents', '{ _id: "ghjk" }');
      decryptedResult = await browser.getFirstListDocument();
      delete decryptedResult.__safeContent__;
      expect(decryptedResult).to.deep.equal({ v: '"456"', _id: '"ghjk"' });
    });
  });
});
