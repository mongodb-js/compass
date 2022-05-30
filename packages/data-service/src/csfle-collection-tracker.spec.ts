import type { CSFLECollectionTracker } from './csfle-collection-tracker';
import { CSFLECollectionTrackerImpl } from './csfle-collection-tracker';
import { expect } from 'chai';
import type { DataService } from './data-service';
import type { AutoEncryptionOptions, MongoClient } from 'mongodb';
import { UUID } from 'bson';
import connect from './connect';

describe('CSFLECollectionTracker', function () {
  const DECRYPTED_KEYS = Symbol.for('@@mdb.decryptedKeys');
  const SOME_UUID1 = new UUID(
    '00000000-0000-4000-8000-000000000001'
  ).toBinary();
  const SOME_UUID2 = new UUID(
    '00000000-0000-4000-8000-000000000002'
  ).toBinary();
  const ALGO_DET = 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic';

  let dataService: DataService;
  let tracker: CSFLECollectionTracker;
  let dbName: string;

  before(function () {
    if (!process.env.COMPASS_CRYPT_LIBRARY_PATH) {
      return this.skip();
    }
    dbName = `test-${Date.now()}-${(Math.random() * 10000) | 0}`;
  });

  afterEach(async function () {
    await new Promise((done) => dataService.dropDatabase(dbName, done));
    await dataService.disconnect();
  });

  async function createTracker(
    autoEncryption: AutoEncryptionOptions = {}
  ): Promise<[CSFLECollectionTracker, DataService]> {
    const dataService = await connect({
      connectionString: 'mongodb://localhost:27018',
      fleOptions: {
        storeCredentials: false,
        autoEncryption: {
          kmsProviders: { local: { key: 'A'.repeat(128) } },
          keyVaultNamespace: `${dbName}.kv`,
          extraOptions: {
            csflePath: process.env.COMPASS_CRYPT_LIBRARY_PATH,
          },
          ...autoEncryption,
        },
      },
    });
    const crudClient = (dataService as any)._initializedClient('CRUD');
    return [
      new CSFLECollectionTrackerImpl(dataService, crudClient),
      dataService,
    ];
  }

  // Run tests for isUpdateAllowed where the collections:
  // - test1 does not have an FLE schema
  // - test2 has an FLE schema for encrypting 'a'
  // - test3 has an FLE schema for encrypting 'n.a'
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
      ).to.deep.equal({ hasSchema: false, encryptedFields: [] });
    });
  });

  context('with client-side FLE1 schema info', function () {
    beforeEach(async function () {
      [tracker, dataService] = await createTracker({
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
                      algorithm: ALGO_DET,
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
      ).to.deep.equal({ hasSchema: false, encryptedFields: [] });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test2`)
      ).to.deep.equal({ hasSchema: true, encryptedFields: ['a'] });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test3`)
      ).to.deep.equal({ hasSchema: true, encryptedFields: ['n.a'] });
    });
  });

  context('with client-side FLE2 schema info', function () {
    beforeEach(async function () {
      [tracker, dataService] = await createTracker({
        encryptedFieldsMap: {
          [`${dbName}.test2`]: {
            fields: [{ path: 'a', keyId: SOME_UUID1, bsonType: 'string' }],
          },
          [`${dbName}.test3`]: {
            fields: [{ path: 'n.a', keyId: SOME_UUID2, bsonType: 'string' }],
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
      ).to.deep.equal({ hasSchema: false, encryptedFields: [] });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test2`)
      ).to.deep.equal({ hasSchema: true, encryptedFields: ['a'] });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test3`)
      ).to.deep.equal({ hasSchema: true, encryptedFields: ['n.a'] });
    });
  });

  context('with server-side FLE1 schema info', function () {
    beforeEach(async function () {
      [tracker, dataService] = await createTracker();
      const crudClient: MongoClient = (dataService as any)._initializedClient(
        'CRUD'
      );
      await crudClient.db(dbName).createCollection('test1', {
        validator: {
          $jsonSchema: {
            properties: {
              a: { bsonType: 'number' },
            },
          },
        },
      });

      await crudClient.db(dbName).createCollection('test2', {
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

      await crudClient.db(dbName).createCollection('test3', {
        validator: {
          $jsonSchema: {
            properties: {
              n: {
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
      ).to.deep.equal({ hasSchema: true, encryptedFields: [] });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test2`)
      ).to.deep.equal({ hasSchema: true, encryptedFields: ['a'] });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test3`)
      ).to.deep.equal({ hasSchema: true, encryptedFields: ['n.a'] });
    });
  });

  context('with server-side FLE2 schema info', function () {
    beforeEach(async function () {
      [tracker, dataService] = await createTracker();
      const crudClient: MongoClient = (dataService as any)._initializedClient(
        'CRUD'
      );
      await crudClient.db(dbName).createCollection('test2', {
        encryptedFields: {
          fields: [{ path: 'a', keyId: SOME_UUID1, bsonType: 'string' }],
        },
      });

      await crudClient.db(dbName).createCollection('test3', {
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
      ).to.deep.equal({ hasSchema: false, encryptedFields: [] });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test2`)
      ).to.deep.equal({ hasSchema: true, encryptedFields: ['a'] });
      expect(
        await tracker.knownSchemaForCollection(`${dbName}.test3`)
      ).to.deep.equal({ hasSchema: true, encryptedFields: ['n.a'] });
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
          .dropCollection('enxcol_.test2.ecc')
          .catch(() => {});
        await metadataClient
          .db(dbName)
          .dropCollection('enxcol_.test2.ecoc')
          .catch(() => {});
      });

      it('ensures that writes fail when server validation has been removed in the background', async function () {
        //await metadataClient.db(dbName).collection('test2').insertOne({ a: 1 });
        const err = await new Promise<{ message: string }>((resolve) => {
          dataService.findOneAndUpdate(
            `${dbName}.test2`,
            {},
            { $set: { a: 2 } },
            {},
            resolve
          );
        });
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
        const err = await new Promise<{ message: string }>((resolve) => {
          dataService.findOneAndUpdate(
            `${dbName}.test2`,
            {},
            { $set: { a: 2 } },
            {},
            resolve
          );
        });
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
        await new Promise((resolve) => {
          dataService.findOneAndUpdate(
            `${dbName}.test4`,
            {},
            { $set: { a: 2 } },
            {},
            resolve
          );
        });
        const result = await crudClient
          .db(dbName)
          .collection('test4')
          .findOne();
        expect(result.a).to.equal(2);
      });
    });
  });

  context('with client-side and server-side FLE2 schema info', function () {
    beforeEach(async function () {
      [tracker, dataService] = await createTracker({
        encryptedFieldsMap: {
          [`${dbName}.test3`]: {
            fields: [{ path: 'n.a', keyId: SOME_UUID2, bsonType: 'string' }],
          },
        },
      });
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
      ).to.deep.equal({ hasSchema: true, encryptedFields: ['n.a'] });
    });
  });
});
