import type { CSFLECollectionTracker } from './csfle-collection-tracker';
import { expect } from 'chai';
import type { DataService, DataServiceImpl } from './data-service';
import type { AutoEncryptionOptions, MongoClient } from 'mongodb';
import type { Binary } from 'bson';
import connect from './connect';
import { mochaTestServer } from '@mongodb-js/compass-test-server';

describe('CSFLECollectionTracker', function () {
  const DECRYPTED_KEYS = Symbol.for('@@mdb.decryptedKeys');
  const ALGO_DET = 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic';
  const ALGO_RND = 'AEAD_AES_256_CBC_HMAC_SHA_512-Random';

  let dataService: DataService;
  let tracker: CSFLECollectionTracker;
  let dbName: string;

  before(function () {
    if (!process.env.COMPASS_CRYPT_LIBRARY_PATH) {
      return this.skip();
    }
    dbName = `test-${Date.now()}-${(Math.random() * 10000) | 0}`;
  });

  const cluster = mochaTestServer({
    topology: 'replset',
    secondaries: 0,
    version: '>= 7.0.0-rc5',
    downloadOptions: {
      enterprise: true,
    },
  });

  afterEach(async function () {
    await dataService.dropDatabase(dbName);
    await dataService.disconnect();
  });

  async function createTracker(
    autoEncryption:
      | AutoEncryptionOptions
      | ((keys: [Binary, Binary]) => AutoEncryptionOptions) = {}
  ): Promise<[CSFLECollectionTracker, DataService, Binary, Binary]> {
    if (typeof autoEncryption === 'function') {
      // This autoEncryption config depends on the keys, so we first need
      // to set up the keys with one DataService instance,
      // then create the 'real' DataService instance.
      const [, tempDataService, someKey1, someKey2] = await createTracker({});
      await tempDataService.disconnect();
      const [tracker, dataService] = await createTracker(
        autoEncryption([someKey1, someKey2])
      );
      return [tracker, dataService, someKey1, someKey2];
    }

    const dataService = await connect({
      connectionOptions: {
        connectionString: cluster().connectionString,
        fleOptions: {
          storeCredentials: false,
          autoEncryption: {
            kmsProviders: { local: { key: 'A'.repeat(128) } },
            keyVaultNamespace: `${dbName}.kv`,
            extraOptions: {
              cryptSharedLibPath: process.env.COMPASS_CRYPT_LIBRARY_PATH,
            },
            ...autoEncryption,
          },
        },
      },
    });
    // It can be useful to have one or two pre-defined keys in the key vault.
    const someKey1 = (await dataService.createDataKey('local')) as Binary;
    const someKey2 = (await dataService.createDataKey('local')) as Binary;
    return [
      (dataService as DataServiceImpl)['_getCSFLECollectionTracker'](),
      dataService,
      someKey1,
      someKey2,
    ];
  }

  // Run tests for isUpdateAllowed where the collections:
  // - test1 does not have an FLE schema
  // - test2 has an FLE schema for encrypting 'a' as indexed/equality-queryable
  // - test3 has an FLE schema for encrypting 'n.a' as unindexed
  async function runIsUpdateAllowedTestsWithSchema(
    tracker: CSFLECollectionTracker
  ): Promise<void> {
    expect(
      await tracker.isUpdateAllowed(`${dbName}.test1`, {
        a: 1,
        [DECRYPTED_KEYS]: ['a'],
      })
    ).to.equal(false);
    expect(
      await tracker.isUpdateAllowed(`${dbName}.test1`, {
        a: 1,
      })
    ).to.equal(true);

    expect(
      await tracker.isUpdateAllowed(`${dbName}.test2`, {
        a: 1,
        [DECRYPTED_KEYS]: ['a'],
      })
    ).to.equal(true);
    expect(
      await tracker.isUpdateAllowed(`${dbName}.test2`, {
        a: 1,
      })
    ).to.equal(true);

    expect(
      await tracker.isUpdateAllowed(`${dbName}.test3`, {
        n: {
          a: 1,
          [DECRYPTED_KEYS]: ['a'],
        },
      })
    ).to.equal(true);
    expect(
      await tracker.isUpdateAllowed(`${dbName}.test3`, {
        n: {
          a: 1,
          b: 2,
          [DECRYPTED_KEYS]: ['b'],
        },
      })
    ).to.equal(false);
  }

  context('with no client-side or server-side schema info', function () {
    beforeEach(async function () {
      [tracker, dataService] = await createTracker();
    });

    it('correctly returns whether updates are allowed', async function () {
      expect(
        await tracker.isUpdateAllowed(`${dbName}.test`, {
          a: 1,
          [DECRYPTED_KEYS]: ['a'],
        })
      ).to.equal(false);
      expect(
        await tracker.isUpdateAllowed(`${dbName}.test`, {
          a: 1,
        })
      ).to.equal(true);
    });

    it('correctly returns whether there is a known schema', async function () {
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test`)
      ).to.deep.equal({
        hasSchema: false,
        encryptedFields: { _encryptedFields: [] },
      });
    });
  });

  context('with client-side FLE1 schema info', function () {
    beforeEach(async function () {
      [tracker, dataService] = await createTracker(([SOME_UUID1]) => ({
        schemaMap: {
          [`${dbName}.test1`]: {
            properties: {
              a: { bsonType: 'number' },
            },
          },
          [`${dbName}.test2`]: {
            properties: {
              a: {
                encrypt: {
                  bsonType: 'number',
                  keyId: [SOME_UUID1],
                  algorithm: ALGO_DET,
                },
              },
            },
          },
          [`${dbName}.test3`]: {
            properties: {
              n: {
                properties: {
                  a: {
                    encrypt: {
                      bsonType: 'number',
                      keyId: [SOME_UUID1],
                      algorithm: ALGO_RND,
                    },
                  },
                },
              },
            },
          },
        },
      }));
    });

    it('correctly returns whether updates are allowed', async function () {
      await runIsUpdateAllowedTestsWithSchema(tracker);
    });

    it('correctly returns whether there is a known schema', async function () {
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test1`)
      ).to.deep.equal({
        hasSchema: false,
        encryptedFields: { _encryptedFields: [] },
      });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test2`)
      ).to.deep.equal({
        hasSchema: true,
        encryptedFields: {
          _encryptedFields: [{ path: ['a'], equalityQueryable: true }],
        },
      });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test3`)
      ).to.deep.equal({
        hasSchema: true,
        encryptedFields: {
          _encryptedFields: [{ path: ['n', 'a'], equalityQueryable: false }],
        },
      });
    });
  });

  context('with client-side FLE2 schema info', function () {
    beforeEach(async function () {
      [tracker, dataService] = await createTracker(
        ([SOME_UUID1, SOME_UUID2]) => ({
          encryptedFieldsMap: {
            [`${dbName}.test2`]: {
              fields: [
                {
                  path: 'a',
                  keyId: SOME_UUID1,
                  bsonType: 'string',
                  queries: { queryType: 'equality' },
                },
              ],
            },
            [`${dbName}.test3`]: {
              fields: [{ path: 'n.a', keyId: SOME_UUID2, bsonType: 'string' }],
            },
          },
        })
      );
    });

    it('correctly returns whether updates are allowed', async function () {
      await runIsUpdateAllowedTestsWithSchema(tracker);
    });

    it('correctly returns whether there is a known schema', async function () {
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test1`)
      ).to.deep.equal({
        hasSchema: false,
        encryptedFields: { _encryptedFields: [] },
      });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test2`)
      ).to.deep.equal({
        hasSchema: true,
        encryptedFields: {
          _encryptedFields: [{ path: ['a'], equalityQueryable: true }],
        },
      });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test3`)
      ).to.deep.equal({
        hasSchema: true,
        encryptedFields: {
          _encryptedFields: [{ path: ['n', 'a'], equalityQueryable: false }],
        },
      });
    });
  });

  context('with server-side FLE1 schema info', function () {
    let SOME_UUID1;
    beforeEach(async function () {
      [tracker, dataService, SOME_UUID1] = await createTracker();
      // TODO: This might/should be the CRUD client, but that doesn't
      // work -- https://jira.mongodb.org/browse/MONGOCRYPT-436 tracks this.
      const metadataClient: MongoClient = (
        dataService as any
      )._initializedClient('META');
      await metadataClient.db(dbName).createCollection('test1', {
        validator: {
          $jsonSchema: {
            properties: {
              a: { bsonType: 'number' },
            },
          },
        },
      });

      await metadataClient.db(dbName).createCollection('test2', {
        validator: {
          $jsonSchema: {
            properties: {
              a: {
                encrypt: {
                  bsonType: 'number',
                  keyId: [SOME_UUID1],
                  algorithm: ALGO_DET,
                },
              },
            },
          },
        },
      });

      await metadataClient.db(dbName).createCollection('test3', {
        validator: {
          $jsonSchema: {
            properties: {
              n: {
                properties: {
                  a: {
                    encrypt: {
                      bsonType: 'number',
                      keyId: [SOME_UUID1],
                      algorithm: ALGO_RND,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    it('correctly returns whether updates are allowed', async function () {
      await runIsUpdateAllowedTestsWithSchema(tracker);
    });

    it('correctly returns whether there is a known schema', async function () {
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test1`)
      ).to.deep.equal({
        hasSchema: true,
        encryptedFields: { _encryptedFields: [] },
      });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test2`)
      ).to.deep.equal({
        hasSchema: true,
        encryptedFields: {
          _encryptedFields: [{ path: ['a'], equalityQueryable: true }],
        },
      });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test3`)
      ).to.deep.equal({
        hasSchema: true,
        encryptedFields: {
          _encryptedFields: [{ path: ['n', 'a'], equalityQueryable: false }],
        },
      });
    });
  });

  context('with server-side FLE2 schema info', function () {
    let SOME_UUID1, SOME_UUID2;
    beforeEach(async function () {
      [tracker, dataService, SOME_UUID1, SOME_UUID2] = await createTracker();
      // Creating the collections needs to be done through the non-FLE-aware
      // client here, because newer libmongocrypt versions also fetch
      // collection infos when doing createCollection commands.
      const metaDataClient: MongoClient = (
        dataService as any
      )._initializedClient('META');
      await metaDataClient.db(dbName).createCollection('test2', {
        encryptedFields: {
          fields: [
            {
              path: 'a',
              keyId: SOME_UUID1,
              bsonType: 'string',
              queries: [{ queryType: 'equality' }],
            },
          ],
        },
      });

      await metaDataClient.db(dbName).createCollection('test3', {
        encryptedFields: {
          fields: [{ path: 'n.a', keyId: SOME_UUID2, bsonType: 'string' }],
        },
      });
    });

    it('correctly returns whether updates are allowed', async function () {
      await runIsUpdateAllowedTestsWithSchema(tracker);
    });

    it('correctly returns whether there is a known schema', async function () {
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test1`)
      ).to.deep.equal({
        hasSchema: false,
        encryptedFields: { _encryptedFields: [] },
      });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test2`)
      ).to.deep.equal({
        hasSchema: true,
        encryptedFields: {
          _encryptedFields: [{ path: ['a'], equalityQueryable: true }],
        },
      });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test3`)
      ).to.deep.equal({
        hasSchema: true,
        encryptedFields: {
          _encryptedFields: [{ path: ['n', 'a'], equalityQueryable: false }],
        },
      });
    });

    context('when server validation changes', function () {
      beforeEach(async function () {
        // Check whether an update would theoretically be allowed
        // first to ensure that the listCollections cache is populated.
        expect(
          await tracker.isUpdateAllowed(`${dbName}.test2`, {
            a: 1,
            [DECRYPTED_KEYS]: ['a'],
          })
        ).to.equal(true);
        // An easy way to loosen validation is to drop
        // and possibly re-create the collection.
        const metadataClient: MongoClient = (
          dataService as any
        )._initializedClient('META');
        await metadataClient.db(dbName).dropCollection('test2');
        await metadataClient
          .db(dbName)
          .dropCollection('enxcol_.test2.esc')
          .catch(() => {});
        await metadataClient
          .db(dbName)
          .dropCollection('enxcol_.test2.ecoc')
          .catch(() => {});
      });

      it('ensures that writes fail when server validation has been removed in the background', async function () {
        //await metadataClient.db(dbName).collection('test2').insertOne({ a: 1 });
        let err;
        try {
          await dataService.findOneAndUpdate(
            `${dbName}.test2`,
            {},
            { $set: { a: '2' } }
          );
        } catch (error) {
          err = error;
        }
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.match(
          /\[Compass\] Missing encrypted field information of collection/
        );
      });

      it('ensures that writes fail when server validation has been loosened in the background', async function () {
        const metadataClient: MongoClient = (
          dataService as any
        )._initializedClient('META');
        await metadataClient.db(dbName).createCollection('test2', {
          encryptedFields: {
            fields: [{ path: 'b', keyId: SOME_UUID1, bsonType: 'string' }],
          },
        });
        let err;
        try {
          await dataService.findOneAndUpdate(
            `${dbName}.test2`,
            {},
            { $set: { a: '2' } }
          );
        } catch (error) {
          err = error;
        }
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.match(
          /\[Compass\] Missing encrypted field 'a' of collection/
        );
      });

      it('lets normal writes pass through', async function () {
        const crudClient: MongoClient = (dataService as any)._initializedClient(
          'CRUD'
        );
        await crudClient.db(dbName).collection('test4').insertOne({ a: 1 });
        await dataService.findOneAndUpdate(
          `${dbName}.test4`,
          {},
          { $set: { a: 2 } }
        );
        const result = await crudClient
          .db(dbName)
          .collection('test4')
          .findOne();
        expect(result?.a).to.equal(2);
      });
    });
  });

  context('with client-side and server-side FLE2 schema info', function () {
    let SOME_UUID2;

    beforeEach(async function () {
      [tracker, dataService, SOME_UUID2] = await createTracker(
        ([SOME_UUID2]) => ({
          encryptedFieldsMap: {
            [`${dbName}.test3`]: {
              fields: [{ path: 'n.a', keyId: SOME_UUID2, bsonType: 'string' }],
            },
          },
        })
      );
      const crudClient: MongoClient = (dataService as any)._initializedClient(
        'CRUD'
      );
      await crudClient.db(dbName).createCollection('test3', {
        encryptedFields: {
          fields: [{ path: 'n.a', keyId: SOME_UUID2, bsonType: 'string' }],
        },
      });
    });

    it('does not return duplicates of encrypted fields', async function () {
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test3`)
      ).to.deep.equal({
        hasSchema: true,
        encryptedFields: {
          _encryptedFields: [{ path: ['n', 'a'], equalityQueryable: false }],
        },
      });
    });
  });
});
