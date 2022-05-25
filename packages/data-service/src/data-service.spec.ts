import assert from 'assert';
import type { Document } from 'bson';
import { ObjectId } from 'bson';
import { expect } from 'chai';
import type { Sort } from 'mongodb';
import { MongoClient } from 'mongodb';
import sinon from 'sinon';
import { v4 as uuid } from 'uuid';

import type { DataService } from './data-service';
import { DataServiceImpl } from './data-service';
import type {
  ConnectionFleOptions,
  ConnectionOptions,
} from './connection-options';
import EventEmitter from 'events';
import { createMongoClientMock } from '../test/helpers';
import { AbortController } from '../test/mocks';

const TEST_DOCS = [
  {
    1: 'a',
    a: 1,
  },
  {
    2: 'a',
    a: 2,
  },
];

describe('DataService', function () {
  context('with real client', function () {
    this.slow(10000);
    this.timeout(20000);

    let dataService: DataService;
    let mongoClient: MongoClient;
    let sandbox: sinon.SinonSandbox;
    let connectionOptions: ConnectionOptions;
    let testCollectionName: string;
    let testDatabaseName: string;
    let testNamespace: string;

    before(async function () {
      testDatabaseName = `compass-data-service-tests`;
      connectionOptions = {
        connectionString: `mongodb://127.0.0.1:27018/${testDatabaseName}`,
      };

      mongoClient = new MongoClient(connectionOptions.connectionString);
      await mongoClient.connect();

      dataService = new DataServiceImpl(connectionOptions);
      await dataService.connect();
    });

    after(async function () {
      await dataService?.disconnect().catch(console.log);
      await mongoClient?.close();
    });

    beforeEach(async function () {
      sandbox = sinon.createSandbox();

      testCollectionName = `coll-${uuid()}`;
      testNamespace = `${testDatabaseName}.${testCollectionName}`;

      await mongoClient
        .db(testDatabaseName)
        .collection(testCollectionName)
        .insertMany(TEST_DOCS);
    });

    afterEach(async function () {
      sandbox.restore();

      await mongoClient
        .db(testDatabaseName)
        .collection(testCollectionName)
        .drop();
    });

    describe('#isConnected', function () {
      let dataServiceIsConnected: DataService;

      afterEach(async function () {
        await dataServiceIsConnected?.disconnect();
      });

      it('returns false when not connected initially', function () {
        dataServiceIsConnected = new DataServiceImpl(connectionOptions);
        expect(dataServiceIsConnected.isConnected()).to.equal(false);
      });

      it('returns true if client is connected', async function () {
        dataServiceIsConnected = new DataServiceImpl(connectionOptions);
        await dataServiceIsConnected.connect();
        expect(dataServiceIsConnected.isConnected()).to.equal(true);
      });

      it('returns false if client is disconnected', async function () {
        dataServiceIsConnected = new DataServiceImpl(connectionOptions);

        await dataServiceIsConnected.connect();
        await dataServiceIsConnected.disconnect();

        expect(dataServiceIsConnected.isConnected()).to.equal(false);
      });
    });

    describe('#setupListeners', function () {
      it('emits log events for MongoClient heartbeat events', function () {
        const dataService: any = new DataServiceImpl(null as any);
        const client: Pick<MongoClient, 'on' | 'emit'> =
          new EventEmitter() as any;
        const logEntries: any[] = [];
        process.on('compass:log', ({ line }) =>
          logEntries.push(JSON.parse(line))
        );
        dataService.setupListeners(client as MongoClient);
        const connectionId = 'localhost:27017';
        client.emit('serverHeartbeatSucceeded', {
          connectionId,
          duration: 100,
        } as any);
        client.emit('serverHeartbeatSucceeded', {
          connectionId,
          duration: 200,
        } as any);
        client.emit('serverHeartbeatSucceeded', {
          connectionId,
          duration: 300,
        } as any);
        client.emit('serverHeartbeatSucceeded', {
          connectionId,
          duration: 400,
        } as any);
        client.emit('serverHeartbeatFailed', {
          connectionId,
          duration: 400,
          failure: new Error('fail'),
        });
        client.emit('serverHeartbeatFailed', {
          connectionId,
          duration: 600,
          failure: new Error('fail'),
        });
        client.emit('serverHeartbeatFailed', {
          connectionId,
          duration: 800,
          failure: new Error('fail'),
        });
        expect(logEntries.map((entry) => entry.attr)).to.deep.equal([
          { connectionId, duration: 100 },
          { connectionId, duration: 400 },
          { connectionId, duration: 400, failure: 'fail' },
          { connectionId, duration: 800, failure: 'fail' },
        ]);
      });
    });

    describe('#deleteOne', function () {
      it('deletes the document from the collection', function (done) {
        dataService.insertOne(
          testNamespace,
          {
            a: 500,
          },
          {},
          function (err) {
            assert.equal(null, err);
            dataService.deleteOne(
              testNamespace,
              {
                a: 500,
              },
              {},
              function (er) {
                assert.equal(null, er);
                dataService.find(
                  testNamespace,
                  {
                    a: 500,
                  },
                  {},
                  function (error, docs) {
                    assert.equal(null, error);
                    expect(docs.length).to.equal(0);
                    done();
                  }
                );
              }
            );
          }
        );
      });
    });

    describe('#command', function () {
      it('executes the command', function (done) {
        dataService.command(
          `${testDatabaseName}`,
          { ping: 1 },
          function (error, result) {
            assert.equal(null, error);
            expect(result.ok).to.equal(1);
            done();
          }
        );
      });
    });

    describe('#dropCollection', function () {
      beforeEach(async function () {
        await mongoClient.db(testDatabaseName).createCollection('bar');
      });

      afterEach(async function () {
        try {
          await mongoClient.db(testDatabaseName).collection('bar').drop();
        } catch {
          /* ignore ns not found */
        }
      });

      it('drops a collection', function (done) {
        dataService.dropCollection(`${testDatabaseName}.bar`, function (error) {
          assert.equal(null, error);
          dataService
            .listCollections(testDatabaseName, {})
            .then(function (items) {
              expect(items).to.not.include({ name: 'bar', options: {} });
              done();
            })
            .catch(done);
        });
      });

      it('drops a collection with fle2 options', async function () {
        const buildInfo = await new Promise<Document>((resolve, reject) => {
          dataService.command('admin', { buildInfo: 1 }, (error, result) => {
            error ? reject(error) : resolve(result);
          });
        });
        if (
          (buildInfo.versionArray?.[0] ?? 0) <= 5 ||
          dataService.currentTopologyType() === 'Single' ||
          process.env.COMPASS_CSFLE_SUPPORT !== 'true'
        ) {
          return this.skip(); // FLE2 requires 6.0+ replset
        }

        await mongoClient.db(testDatabaseName).createCollection('fle2', {
          encryptedFields: {
            escCollection: 'enxcol_.fle2.esc',
            eccCollection: 'enxcol_.fle2.ecc',
            ecocCollection: 'enxcol_.fle2.ecoc',
            fields: [],
          },
        });

        let items = (
          await mongoClient
            .db(testDatabaseName)
            .listCollections({}, { nameOnly: true })
            .toArray()
        ).map(({ name }) => name);
        expect(items).to.include('fle2');
        expect(items).to.include('enxcol_.fle2.esc');
        expect(items).to.include('enxcol_.fle2.ecc');
        expect(items).to.include('enxcol_.fle2.ecoc');

        await new Promise<void>((resolve, reject) => {
          dataService.dropCollection(
            `${testDatabaseName}.fle2`,
            function (error) {
              error ? reject(error) : resolve();
            }
          );
        });

        items = (
          await mongoClient
            .db(testDatabaseName)
            .listCollections({}, { nameOnly: true })
            .toArray()
        ).map(({ name }) => name);
        expect(items).to.not.include('fle2');
        expect(items).to.not.include('enxcol_.fle2.esc');
        expect(items).to.not.include('enxcol_.fle2.ecc');
        expect(items).to.not.include('enxcol_.fle2.ecoc');
      });
    });

    describe('#dropDatabase', function () {
      let dbName: string;
      beforeEach(async function () {
        dbName = uuid();
        await mongoClient.db(dbName).createCollection('testing');
      });

      it('drops a database', function (done) {
        dataService.dropDatabase(dbName, function (error) {
          assert.equal(null, error);
          dataService
            .listDatabases()
            .then(function (dbs) {
              expect(dbs).to.not.have.property('name', 'mangoDB');
              done();
            })
            .catch(done);
        });
      });
    });

    describe('#dropIndex', function () {
      beforeEach(function (done) {
        mongoClient
          .db(testDatabaseName)
          .collection(testCollectionName)
          .createIndex(
            {
              a: 1,
            },
            {},
            function (error) {
              assert.equal(null, error);
              done();
            }
          );
      });

      it('removes an index from a collection', function (done) {
        const namespace = testNamespace;
        dataService.dropIndex(namespace, 'a_1', function (error) {
          assert.equal(null, error);
          dataService.indexes(namespace, {}, function (err, indexes) {
            assert.equal(null, err);
            expect(indexes).to.not.have.property('name', 'a_1');
            done();
          });
        });
      });
    });

    describe('#deleteMany', function () {
      it('deletes the document from the collection', function (done) {
        dataService.insertOne(
          testNamespace,
          {
            a: 500,
          },
          {},
          function (err) {
            assert.equal(null, err);
            dataService.deleteMany(
              testNamespace,
              {
                a: 500,
              },
              {},
              function (er) {
                assert.equal(null, er);
                dataService.find(
                  testNamespace,
                  {
                    a: 500,
                  },
                  {},
                  function (error, docs) {
                    assert.equal(null, error);
                    expect(docs.length).to.equal(0);
                    done();
                  }
                );
              }
            );
          }
        );
      });
    });

    describe('#aggregate', function () {
      it('returns a cursor for the documents', function (done) {
        let count = 0;
        dataService
          .aggregate(
            testNamespace,
            [{ $match: {} }, { $group: { _id: '$a', total: { $sum: '$a' } } }],
            { cursor: { batchSize: 10000 } }
          )
          .forEach(
            function () {
              count++;
            },
            function (err) {
              assert.equal(null, err);
              expect(count).to.equal(2);
              done();
            }
          );
      });
      it('returns null, calls callback', function (done) {
        dataService.aggregate(
          testNamespace,
          [{ $match: {} }, { $group: { _id: '$a', total: { $sum: '$a' } } }],
          {},
          function (error, result) {
            assert.equal(null, error);
            result.toArray((err, r) => {
              assert.equal(null, err);
              expect(r!.length).to.equal(2);
              done();
            });
          }
        );
      });
    });

    describe('#find', function () {
      it('returns a cursor for the documents', function (done) {
        dataService.find(
          testNamespace,
          {},
          {
            skip: 1,
          },
          function (error, docs) {
            assert.equal(null, error);
            expect(docs.length).to.equal(1);
            done();
          }
        );
      });

      context('when a filter is provided', function () {
        it('returns a cursor for the matching documents', function (done) {
          dataService.find(
            testNamespace,
            {
              a: 1,
            },
            {},
            function (error, docs) {
              assert.equal(null, error);
              expect(docs.length).to.equal(1);
              done();
            }
          );
        });
      });

      context('when no filter is provided', function () {
        it('returns a cursor for all documents', function (done) {
          dataService.find(testNamespace, {}, {}, function (error, docs) {
            assert.equal(null, error);
            expect(docs.length).to.equal(2);
            done();
          });
        });
      });

      context('when options are provided', function () {
        it('returns a cursor for the documents', function (done) {
          dataService.find(
            testNamespace,
            {},
            {
              skip: 1,
            },
            function (error, docs) {
              assert.equal(null, error);
              expect(docs.length).to.equal(1);
              done();
            }
          );
        });
      });

      context('when array sort is provided', function () {
        it('returns documents with correct sort order', function (done) {
          const sort: Sort = [
            ['2', -1],
            ['1', -1],
          ];
          dataService.find(testNamespace, {}, { sort }, function (error, docs) {
            assert.strictEqual(null, error);
            expect(docs[0]).to.have.nested.property('2', 'a');
            expect(docs[1]).to.have.nested.property('1', 'a');
            done();
          });
        });
      });
    });

    describe('#fetch', function () {
      it('returns a cursor for the documents', function (done) {
        const cursor = dataService.fetch(testNamespace, {}, { skip: 1 });
        cursor.toArray(function (error, docs) {
          assert.equal(null, error);
          expect(docs!.length).to.equal(1);
          done();
        });
      });

      context('when a filter is provided', function () {
        it('returns a cursor for the matching documents', function (done) {
          const cursor = dataService.fetch(testNamespace, { a: 1 }, {});
          cursor.toArray(function (error, docs) {
            assert.equal(null, error);
            expect(docs!.length).to.equal(1);
            done();
          });
        });
      });

      context('when no filter is provided', function () {
        it('returns a cursor for all documents', function (done) {
          const cursor = dataService.fetch(testNamespace, {}, {});
          cursor.toArray(function (error, docs) {
            assert.equal(null, error);
            expect(docs!.length).to.equal(2);
            done();
          });
        });
      });

      context('when options are provided', function () {
        it('returns a cursor for the documents', function (done) {
          const cursor = dataService.fetch(testNamespace, {}, { skip: 1 });
          cursor.toArray(function (error, docs) {
            assert.equal(null, error);
            expect(docs!.length).to.equal(1);
            done();
          });
        });
      });
    });

    describe('#findOneAndReplace', function () {
      const id = new ObjectId();

      it('returns the updated document', function (done) {
        dataService.insertOne(
          testNamespace,
          {
            _id: id,
            a: 500,
          },
          {},
          function (err) {
            assert.equal(null, err);
            dataService.findOneAndReplace(
              testNamespace,
              {
                _id: id,
              },
              {
                b: 5,
              },
              {
                returnDocument: 'after',
              },
              function (error, result) {
                expect(error).to.equal(null);
                expect(result._id.toString()).to.deep.equal(id.toString());
                expect(result.b).to.equal(5);
                expect(result).to.not.haveOwnProperty('a');
                done();
              }
            );
          }
        );
      });
    });

    describe('#findOneAndUpdate', function () {
      const id = new ObjectId();

      it('returns the updated document', function (done) {
        dataService.insertOne(
          testNamespace,
          {
            _id: id,
            a: 500,
          },
          {},
          function (err) {
            assert.equal(null, err);
            dataService.findOneAndUpdate(
              testNamespace,
              {
                _id: id,
              },
              {
                $set: {
                  b: 5,
                },
              },
              {
                returnDocument: 'after',
              },
              function (error, result) {
                expect(error).to.equal(null);
                expect(result._id.toString()).to.deep.equal(id.toString());
                expect(result.b).to.equal(5);
                expect(result).to.haveOwnProperty('a');
                done();
              }
            );
          }
        );
      });
    });

    describe('#collection', function () {
      it('returns the collection details', function (done) {
        dataService.collection(testNamespace, {}, function (err, coll) {
          assert.equal(null, err);
          expect(coll.ns).to.equal(testNamespace);
          expect(coll.index_count).to.equal(1);
          done();
        });
      });
    });

    describe('#collectionStats', function () {
      context('when the collection is not a system collection', function () {
        it('returns an object with the collection stats', function (done) {
          dataService.collectionStats(
            `${testDatabaseName}`,
            testCollectionName,
            function (err, stats) {
              assert.equal(null, err);
              expect(stats.name).to.equal(testCollectionName);
              done();
            }
          );
        });
      });
    });

    describe('#listCollections', function () {
      it('returns the collections', async function () {
        const collections = await dataService.listCollections(
          `${testDatabaseName}`,
          {}
        );
        expect(collections).to.have.lengthOf(1);
        expect(collections).to.have.nested.property(
          '[0].name',
          testCollectionName
        );
        expect(collections).to.have.nested.property('[0].type', 'collection');
      });
    });

    describe('#updateCollection', function () {
      it('returns the update result', function (done) {
        dataService.updateCollection(testNamespace, {}, function (err, result) {
          assert.equal(null, err);
          expect(result.ok).to.equal(1.0);
          done();
        });
      });
    });

    describe('#estimatedCount', function () {
      it('returns a 0 for an empty collection', function (done) {
        dataService.estimatedCount(
          `${testDatabaseName}.empty`,
          {},
          function (error, count) {
            assert.equal(null, error);
            expect(count).to.equal(0);
            done();
          }
        );
      });

      it('returns the estimated count', function (done) {
        dataService.estimatedCount(testNamespace, {}, function (error, count) {
          assert.equal(null, error);
          expect(count).to.equal(2);
          done();
        });
      });
    });

    describe('#count', function () {
      context('when a filter is provided', function () {
        it('returns 0 for an empty collection', function (done) {
          dataService.count(
            `${testDatabaseName}.empty`,
            {
              a: 1,
            },
            {},
            function (error, count) {
              assert.equal(null, error);
              expect(count).to.equal(0);
              done();
            }
          );
        });

        it('returns a count for the matching documents', function (done) {
          dataService.count(
            testNamespace,
            {
              a: 1,
            },
            {},
            function (error, count) {
              assert.equal(null, error);
              expect(count).to.equal(1);
              done();
            }
          );
        });
      });

      context('when max timeout is provided', function () {
        context('when the count times out', function () {
          it('throws the error', function (done) {
            dataService.count(
              testNamespace,
              {
                $where: 'function() { sleep(5500); return true; }',
              },
              { maxTimeMS: 500 },
              function (error) {
                expect(error).to.not.equal(null);
                done();
              }
            );
          });
        });
      });
    });

    describe('#database', function () {
      it('returns the database details', function (done) {
        dataService.database(
          `${testDatabaseName}`,
          {},
          function (err, database) {
            assert.equal(null, err);
            expect(database._id).to.equal(`${testDatabaseName}`);
            expect(database.stats.document_count).to.not.equal(undefined);
            done();
          }
        );
      });
    });

    describe('#listDatabases', function () {
      it('returns the databases', async function () {
        const databases = await dataService.listDatabases();
        const databaseNames = databases.map((db) => db.name);
        if (dataService.isMongos()) {
          expect(databaseNames).to.not.contain('local');
        } else {
          expect(databaseNames).to.contain('local');
        }
        expect(databaseNames).to.contain(`${testDatabaseName}`);
      });
    });

    describe('#createCollection', function () {
      afterEach(function (done) {
        mongoClient
          .db(testDatabaseName)
          .dropCollection('foo', {}, function (error) {
            assert.equal(null, error);
            done();
          });
      });

      it('creates a new collection', function (done) {
        const options = {};
        dataService.createCollection(
          `${testDatabaseName}.foo`,
          options,
          function (error) {
            if (error) {
              done(error);
              return;
            }
            dataService
              .collectionInfo(testDatabaseName, 'foo')
              .then((collInfo) => {
                expect(collInfo).to.have.property('name', 'foo');
                expect(collInfo).to.have.property('type', 'collection');
                done();
              })
              .catch(done);
          }
        );
      });
    });

    describe('#createIndex', function () {
      context('when options are provided', function () {
        it('creates a new index with the provided options', function (done) {
          const namespace = testNamespace;
          const spec = { a: 1 };
          const options = { unique: true };
          dataService.createIndex(namespace, spec, options, function (error) {
            assert.equal(null, error);
            dataService.indexes(namespace, {}, function (err, indexes) {
              assert.equal(null, err);
              expect(indexes.length).to.equal(2);
              done();
            });
          });
        });
      });

      context('when no options are provided', function () {
        it('creates a new single index', function (done) {
          const namespace = testNamespace;
          const spec = { b: 1 };
          const options = {};
          dataService.createIndex(namespace, spec, options, function (error) {
            assert.equal(null, error);
            dataService.indexes(namespace, {}, function (err, indexes) {
              assert.equal(null, err);
              expect(indexes.length).to.equal(2);
              done();
            });
          });
        });

        it('creates a new compound index', function (done) {
          const namespace = testNamespace;
          const spec = { a: -1, b: 1 };
          const options = {};
          dataService.createIndex(namespace, spec, options, function (error) {
            assert.equal(null, error);
            dataService.indexes(namespace, {}, function (err, indexes) {
              assert.equal(null, err);
              expect(indexes.length).to.equal(2);
              done();
            });
          });
        });
      });
    });

    describe('#instance', function () {
      it('returns the instance', async function () {
        const instance = await dataService.instance();
        expect(instance.genuineMongoDB).to.deep.equal({
          isGenuine: true,
          dbType: 'mongodb',
        });
        expect(instance.dataLake).to.deep.equal({
          isDataLake: false,
          version: null,
        });
      });
    });

    describe('#indexes', function () {
      it('returns the indexes', function (done) {
        dataService.indexes(testNamespace, {}, function (err, indexes) {
          assert.equal(null, err);
          expect(indexes[0].name).to.equal('_id_');
          expect(indexes[0].size).to.be.a('number');
          done();
        });
      });
    });

    describe('#insertOne', function () {
      it('inserts the document into the collection', function (done) {
        dataService.insertOne(
          testNamespace,
          {
            a: 500,
          },
          {},
          function (err) {
            assert.equal(null, err);
            dataService.find(
              testNamespace,
              {
                a: 500,
              },
              {},
              function (error, docs) {
                assert.equal(null, error);
                expect(docs.length).to.equal(1);
                done();
              }
            );
          }
        );
      });
    });

    describe('#insertMany', function () {
      it('inserts the documents into the collection', function (done) {
        dataService.insertMany(
          testNamespace,
          [
            {
              a: 500,
            },
            {
              a: 500,
            },
          ],
          {},
          function (err) {
            assert.equal(null, err);
            dataService.find(
              testNamespace,
              {
                a: 500,
              },
              {},
              function (error, docs) {
                assert.equal(null, error);
                expect(docs.length).to.equal(2);
                done();
              }
            );
          }
        );
      });
    });

    describe('#sample', function () {
      it('returns a cursor of sampled documents', async function () {
        const docs = await dataService.sample(testNamespace).toArray();
        expect(docs.length).to.equal(2);
      });

      it('allows to pass a query', async function () {
        const docs = await dataService
          .sample(testNamespace, {
            query: { a: 1 },
          })
          .toArray();
        expect(docs.length).to.equal(1);
        expect(docs[0]).to.haveOwnProperty('_id');
        expect(docs[0].a).to.equal(1);
      });

      it('allows to pass a projection', async function () {
        const docs = await dataService
          .sample(testNamespace, {
            fields: {
              a: 1,
              _id: 0,
            },
          })
          .toArray();

        expect(docs).to.deep.include.members([{ a: 1 }, { a: 2 }]);
      });

      it('allows to set a sample size', async function () {
        const docs = await dataService
          .sample(testNamespace, {
            size: 1,
          })
          .toArray();

        expect(docs.length).to.equal(1);
      });

      it('always sets default sample size and allowDiskUse: true', function () {
        sandbox.spy(dataService, 'aggregate');
        dataService.sample('db.coll');

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(dataService.aggregate).to.have.been.calledWith(
          'db.coll',
          [{ $sample: { size: 1000 } }],
          { allowDiskUse: true }
        );
      });

      it('allows to pass down aggregation options to the driver', function () {
        sandbox.spy(dataService, 'aggregate');
        dataService.sample(
          'db.coll',
          {},
          {
            maxTimeMS: 123,
            session: undefined,
            raw: true,
          }
        );

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(dataService.aggregate).to.have.been.calledWith(
          'db.coll',
          [{ $sample: { size: 1000 } }],
          { allowDiskUse: true, maxTimeMS: 123, session: undefined, raw: true }
        );
      });

      it('allows to override allowDiskUse', function () {
        sandbox.spy(dataService, 'aggregate');
        dataService.sample(
          'db.coll',
          {},
          {
            allowDiskUse: false,
          }
        );

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(dataService.aggregate).to.have.been.calledWith(
          'db.coll',
          [{ $sample: { size: 1000 } }],
          { allowDiskUse: false }
        );
      });
    });

    describe('#updateOne', function () {
      it('updates the document', function (done) {
        dataService.insertOne(
          testNamespace,
          {
            a: 500,
          },
          {},
          function (err) {
            assert.equal(null, err);
            dataService.updateOne(
              testNamespace,
              {
                a: 500,
              },
              {
                $set: {
                  a: 600,
                },
              },
              {},
              function (er) {
                assert.equal(null, er);
                dataService.find(
                  testNamespace,
                  {
                    a: 600,
                  },
                  {},
                  function (error, docs) {
                    assert.equal(null, error);
                    expect(docs.length).to.equal(1);
                    done();
                  }
                );
              }
            );
          }
        );
      });
    });

    describe('#getLastSeenTopology', function () {
      it("returns the server's toplogy description", function () {
        const topology = dataService.getLastSeenTopology();

        expect(topology).to.not.be.null;
        expect(topology!.servers.values().next().value.address).to.be.a(
          'string'
        );

        expect(topology).to.deep.include({
          compatible: true,
          heartbeatFrequencyMS: 10000,
          localThresholdMS: 15,
          logicalSessionTimeoutMinutes: 30,
          stale: false,
        });
      });

      it("it returns null when a topology description event hasn't yet occured", function () {
        const testService = new DataServiceImpl(connectionOptions);
        expect(testService.getLastSeenTopology()).to.equal(null);
      });
    });

    describe('#updateMany', function () {
      it('updates the documents', function (done) {
        dataService.insertMany(
          testNamespace,
          [
            {
              a: 500,
            },
            {
              a: 500,
            },
          ],
          {},
          function (err) {
            assert.equal(null, err);
            dataService.updateMany(
              testNamespace,
              {
                a: 500,
              },
              {
                $set: {
                  a: 600,
                },
              },
              {},
              function (er) {
                assert.equal(null, er);
                dataService.find(
                  testNamespace,
                  {
                    a: 600,
                  },
                  {},
                  function (error, docs) {
                    assert.equal(null, error);
                    expect(docs.length).to.equal(2);
                    done();
                  }
                );
              }
            );
          }
        );
      });
    });

    describe('#views', function () {
      beforeEach(async function () {
        await mongoClient
          .db(testDatabaseName)
          .collection('testViewSourceColl')
          .insertMany(TEST_DOCS);
      });

      afterEach(async function () {
        await mongoClient
          .db(testDatabaseName)
          .dropCollection('testViewSourceColl');
      });

      it('creates a new view', function (done) {
        dataService.createView(
          'myView',
          `${testDatabaseName}.testViewSourceColl`,
          [{ $project: { a: 0 } }],
          {},
          function (err) {
            if (err) return done(err);
            done();
          }
        );
      });

      it('returns documents from the view', function (done) {
        dataService.find(
          `${testDatabaseName}.myView`,
          {},
          {},
          function (err, docs) {
            if (err) return done(err);

            assert.equal(docs.length, 2);
            assert.strictEqual(docs[0].a, undefined);
            assert.strictEqual(docs[1].a, undefined);
            done();
          }
        );
      });

      it('updates the view', function (done) {
        dataService.updateView(
          'myView',
          `${testDatabaseName}.testViewSourceColl`,
          [{ $project: { a: 1 } }],
          {},
          function (err) {
            if (err) return done(err);
            done();
          }
        );
      });

      it('returns documents from the updated', function (done) {
        dataService.find(
          `${testDatabaseName}.myView`,
          {},
          {},
          function (err, docs) {
            if (err) return done(err);

            assert.equal(docs.length, 2);
            assert.strictEqual(docs[0].a, 1);
            assert.strictEqual(docs[1].a, 2);
            done();
          }
        );
      });

      it('drops the view', function (done) {
        dataService.dropView(`${testDatabaseName}.myView`, done);
      });

      it('returns 0 documents because the view has been dropped', function (done) {
        dataService.count(
          `${testDatabaseName}.myView`,
          {},
          {},
          function (err, _count) {
            if (err) return done(err);

            assert.equal(_count, 0);
            done();
          }
        );
      });

      // describe('#collectionDetail', function () {
      //   it('returns the collection details', function (done) {
      //     service._collectionDetail(`${testDatabaseName}.${collectionName}`, function (err, coll) {
      //       assert.equal(null, err);
      //       expect(coll.ns).to.equal(`${testDatabaseName}.${collectionName}`);
      //       expect(coll.index_count).to.equal(1);
      //       done();
      //     });
      //   });
      // });

      // describe('#collectionNames', function () {
      //   it('returns the collection names', function (done) {
      //     service._collectionNames(`${testDatabaseName}`, function (err, names) {
      //       assert.equal(null, err);
      //       expect(names[0]).to.not.equal(undefined);
      //       done();
      //     });
      //   });
      // });

      describe('#collections', function () {
        context('when no readonly views exist', function () {
          it('returns the collections', function (done) {
            dataService.collections(
              `${testDatabaseName}`,
              function (err, collections) {
                assert.equal(null, err);
                expect(collections[0].name).to.not.equal(undefined);
                done();
              }
            );
          });
        });

        context('when readonly views exist', function () {
          afterEach(async function () {
            await mongoClient
              .db(testDatabaseName)
              .dropCollection('readonlyfoo');
            await mongoClient
              .db(testDatabaseName)
              .dropCollection('system.views');
          });

          it('returns empty stats for the readonly views', function (done) {
            const pipeline = [{ $match: { name: testCollectionName } }];
            const options = { viewOn: testCollectionName, pipeline: pipeline };
            dataService.createCollection(
              `${testDatabaseName}.readonlyfoo`,
              options,
              function (error) {
                if (error) {
                  assert.notEqual(null, error.message);
                  done();
                } else {
                  dataService.collections(
                    `${testDatabaseName}`,
                    function (err, collections) {
                      assert.equal(null, err);
                      expect(collections[0].name).to.not.equal(undefined);
                      done();
                    }
                  );
                }
              }
            );
          });
        });
      });

      describe('#currentOp', function () {
        it('returns an object with the currentOp', function (done) {
          dataService.currentOp(true, function (err, result) {
            assert.equal(null, err);
            expect(result.inprog).to.not.equal(undefined); // TODO: are these tests enough?
            done();
          });
        });
      });

      describe('#serverstats', function () {
        it('returns an object with the serverstats', function (done) {
          dataService.serverstats(function (err, result) {
            assert.equal(null, err);
            expect(result.ok).to.equal(1);
            done();
          });
        });
      });

      describe('#top', function () {
        it('returns an object with the results from top', function (done) {
          dataService.top(function (err, result) {
            if (dataService.isMongos()) {
              assert(err);
              expect(err.message).to.contain('top');
              done();
              return;
            }
            assert.equal(null, err);
            expect(result.ok).to.equal(1);
            done();
          });
        });
      });

      // describe('#databaseDetail', function () {
      //   it('returns the database details', function (done) {
      //     service.databaseDetail(`${testDatabaseName}`, function (err, database) {
      //       assert.equal(null, err);
      //       expect(database._id).to.equal(`${testDatabaseName}`);
      //       expect(database.stats.document_count).to.not.equal(undefined);
      //       done();
      //     });
      //   });
      // });

      // describe('#databaseStats', function () {
      //   context('when the user is authorized', function () {
      //     it('returns an object with the db stats', function (done) {
      //       service.databaseStats('native-service', function (err, stats) {
      //         assert.equal(null, err);
      //         expect(stats.document_count).to.equal(0);
      //         done();
      //       });
      //     });
      //   });

      //   context('when the user is not authorized', function () {
      //     it('passes an error to the callback');
      //   });
      // });

      describe('#explain', function () {
        context('when a filter is provided', function () {
          it('returns an explain object for the provided filter', function (done) {
            dataService.explain(
              testNamespace,
              {
                a: 1,
              },
              {},
              function (error, explanation) {
                assert.equal(null, error);
                expect(explanation).to.be.an('object');
                done();
              }
            );
          });
        });
      });

      describe('#startSession', function () {
        it('returns a new client session', function () {
          const session = dataService.startSession('CRUD');
          expect(session.constructor.name).to.equal('ClientSession');

          // used by killSessions, must be a bson UUID in order to work
          expect(session.id!.id._bsontype).to.equal('Binary');
          expect(session.id!.id.sub_type).to.equal(4);
        });
      });

      describe('#killSessions', function () {
        it('does not throw if kill a non existing session', async function () {
          const session = dataService.startSession('CRUD');
          await dataService.killSessions(session);
        });

        it('kills a command with a session', async function () {
          const commandSpy = sinon.spy();
          sandbox.replace(
            (dataService as any)._crudClient,
            'db',
            () =>
              ({
                command: commandSpy,
              } as any)
          );

          const session = dataService.startSession('CRUD');
          await dataService.killSessions(session);

          expect(commandSpy.args[0][0]).to.deep.equal({
            killSessions: [session.id],
          });
        });
      });
    });

    describe('CSFLE logging', function () {
      it('picks a selected set of CSFLE options for logging', function () {
        const fleOptions: ConnectionFleOptions = {
          storeCredentials: false,
          autoEncryption: {
            keyVaultNamespace: 'abc.def',
            schemaMap: { 'a.b': {} },
            encryptedFieldsMap: { 'a.c': {} },
            kmsProviders: {
              aws: { accessKeyId: 'id', secretAccessKey: 'secret' },
              local: { key: 'secret' },
              kmip: { endpoint: '' },
            },
          },
        };
        expect(
          (dataService as DataServiceImpl)._csfleLogInformation(fleOptions)
        ).to.deep.equal({
          storeCredentials: false,
          keyVaultNamespace: 'abc.def',
          encryptedFieldsMapNamespaces: ['a.c', 'a.b'],
          kmsProviders: ['aws', 'local'],
        });
      });
    });

    context('with csfle options', function () {
      let csfleDataService: DataService;
      let csfleConnectionOptions: ConnectionOptions;

      before(async function () {
        csfleConnectionOptions = {
          ...connectionOptions,
          fleOptions: {
            storeCredentials: false,
            autoEncryption: {
              bypassAutoEncryption: true, // skip mongocryptd/csfle library requirement
              keyVaultNamespace: `${testDatabaseName}.keyvault`,
              kmsProviders: {
                local: { key: 'A'.repeat(128) },
              },
            },
          },
        };

        csfleDataService = new DataServiceImpl(csfleConnectionOptions);
        await csfleDataService.connect();
      });

      after(async function () {
        await csfleDataService?.disconnect().catch(console.log);
      });

      it('can create data keys', async function () {
        const uuid = await csfleDataService.createDataKey('local');
        const keyDoc = await csfleDataService
          .fetch(`${testDatabaseName}.keyvault`, {}, {})
          .next();
        expect(uuid).to.deep.equal(keyDoc._id);
      });
    });

    describe('#explainAggregate', function () {
      const initialAbortController = global.AbortController;
      before(function () {
        (global as any).AbortController = AbortController;
      });
      after(function () {
        global.AbortController = initialAbortController;
      });
      it('returns an explain object', async function () {
        const explain = await dataService.explainAggregate(
          testNamespace,
          [
            {
              $match: {
                a: 1,
              },
            },
          ],
          {},
          {}
        );
        expect(explain).to.be.an('object');
      });
      it('returns an explain object - cancellable', async function () {
        const abortController = new AbortController();
        const abortSignal = abortController.signal;
        const pipeline = [
          {
            $addFields: {
              lazy: {
                $function: {
                  body: `function () {
                    return sleep(1000);
                  }`,
                  args: [],
                  lang: 'js',
                },
              },
            },
          },
        ];
        const executionOptions = {
          abortSignal,
        };

        // cancellable explain
        const promise = dataService
          .explainAggregate(
            testNamespace,
            pipeline,
            {},
            executionOptions as any
          )
          .catch((err) => err);
        // cancel the operation
        abortController.abort();
        const error = await promise;

        expect(error).to.be.instanceOf(Error);
        expect(dataService.isOperationCancelledError(error)).to.true;
      });
    });

    describe('#cancellableOperation', function () {
      it('does not call stop when signal is not set', async function () {
        const stop = sinon.spy();
        const response = await (dataService as any).cancellableOperation(
          () => Promise.resolve(10),
          () => stop()
        );
        expect(response).to.equal(10);
        expect(stop.callCount).to.equal(0);
      });
      it('does not call stop when signal is set and operation succeeds', async function () {
        const abortSignal = new AbortController().signal;
        const stop = sinon.spy();
        const response = await (dataService as any).cancellableOperation(
          () => Promise.resolve(10),
          () => stop(),
          abortSignal
        );
        expect(response).to.equal(10);
        expect(stop.callCount).to.equal(0);
      });
      it('calls stop when operation fails', async function () {
        const abortController = new AbortController();
        const abortSignal = abortController.signal;

        const stop = sinon.spy();
        const promise = (dataService as any)
          .cancellableOperation(
            () => new Promise(() => {}),
            () => stop(),
            abortSignal
          )
          .catch((error) => error);

        abortController.abort();
        await promise;

        expect(stop.callCount).to.equal(1);
      });
    });
  });

  context('with mocked client', function () {
    function createDataServiceWithMockedClient(clientConfig) {
      const dataService = new DataServiceImpl({
        connectionString: 'mongodb://localhost:27020',
      });
      const client = createMongoClientMock(clientConfig);
      (dataService as any)._crudClient = client;
      (dataService as any)._metadataClient = client;
      return dataService;
    }

    describe('#listDatabases', function () {
      it('returns databases from listDatabases command', async function () {
        const dataService = createDataServiceWithMockedClient({
          commands: {
            listDatabases: {
              databases: [{ name: 'foo' }, { name: 'bar' }],
            },
            connectionStatus: { authInfo: { authenticatedUserPrivileges: [] } },
          },
        });
        const dbs = (await dataService.listDatabases()).map((db) => db.name);
        expect(dbs).to.deep.eq(['foo', 'bar']);
      });

      it('returns databases with `find` privilege from privileges', async function () {
        const dataService = createDataServiceWithMockedClient({
          commands: {
            connectionStatus: {
              authInfo: {
                authenticatedUserPrivileges: [
                  {
                    resource: { db: 'foo', collection: 'bar' },
                    actions: ['find'],
                  },
                  {
                    resource: { db: 'foo', collection: 'buz' },
                    actions: [],
                  },
                ],
              },
            },
          },
        });
        const dbs = (await dataService.listDatabases()).map((db) => db.name);
        expect(dbs).to.deep.eq(['foo']);
      });

      it('returns databases with `read`, `readWrite`, `dbAdmin`, `dbOwner` roles roles', async function () {
        const dataService = createDataServiceWithMockedClient({
          commands: {
            connectionStatus: {
              authInfo: {
                authenticatedUserPrivileges: [],
                authenticatedUserRoles: [
                  {
                    role: 'readWrite',
                    db: 'pineapple',
                  },
                  {
                    role: 'dbAdmin',
                    db: 'pineapple',
                  },
                  {
                    role: 'dbAdmin',
                    db: 'readerOfPineapple',
                  },
                  {
                    role: 'dbOwner',
                    db: 'pineappleBoss',
                  },
                  {
                    role: 'customRole',
                    db: 'mint',
                  },
                  {
                    role: 'read',
                    db: 'foo',
                  },
                  {
                    role: 'readWrite',
                    db: 'watermelon',
                  },
                ],
              },
            },
          },
        });
        const dbs = (await dataService.listDatabases()).map((db) => db.name);
        expect(dbs).to.deep.eq([
          'pineapple',
          'readerOfPineapple',
          'pineappleBoss',
          'foo',
          'watermelon',
        ]);
      });

      it('filters out databases with no name from privileges', async function () {
        const dataService = createDataServiceWithMockedClient({
          commands: {
            connectionStatus: {
              authInfo: {
                authenticatedUserPrivileges: [
                  {
                    resource: { db: 'bar', collection: 'bar' },
                    actions: ['find'],
                  },
                  {
                    resource: { db: '', collection: 'buz' },
                    actions: ['find'],
                  },
                ],
              },
            },
          },
        });
        const dbs = (await dataService.listDatabases()).map((db) => db.name);
        expect(dbs).to.deep.eq(['bar']);
      });

      it('merges databases from listDatabases, privileges, and roles', async function () {
        const dataService = createDataServiceWithMockedClient({
          commands: {
            listDatabases: { databases: [{ name: 'foo' }, { name: 'bar' }] },
            connectionStatus: {
              authInfo: {
                authenticatedUserPrivileges: [
                  {
                    resource: { db: 'foo', collection: 'bar' },
                    actions: ['find'],
                  },
                  {
                    resource: { db: 'buz', collection: 'bar' },
                    actions: ['find'],
                  },
                ],
                authenticatedUserRoles: [
                  {
                    role: 'readWrite',
                    db: 'pineapple',
                  },
                  {
                    role: 'dbAdmin',
                    db: 'pineapple',
                  },
                  {
                    role: 'customRole',
                    db: 'mint',
                  },
                ],
              },
            },
          },
        });
        const dbs = (await dataService.listDatabases()).map((db) => db.name);
        expect(dbs).to.deep.eq(['pineapple', 'foo', 'buz', 'bar']);
      });

      it('returns result from privileges even if listDatabases threw any error', async function () {
        const dataService = createDataServiceWithMockedClient({
          commands: {
            listDatabases: new Error('nope'),
            connectionStatus: {
              authInfo: {
                authenticatedUserPrivileges: [
                  {
                    resource: { db: 'foo', collection: 'bar' },
                    actions: ['find'],
                  },
                ],
              },
            },
          },
        });
        const dbs = (await dataService.listDatabases()).map((db) => db.name);
        expect(dbs).to.deep.eq(['foo']);
      });
    });

    describe('#listCollections', function () {
      it('returns collections for a database', async function () {
        const dataService = createDataServiceWithMockedClient({
          commands: {
            connectionStatus: { authInfo: { authenticatedUserPrivileges: [] } },
          },
          collections: {
            buz: ['foo', 'bar'],
          },
        });
        const colls = (await dataService.listCollections('buz')).map(
          (coll) => coll.name
        );
        expect(colls).to.deep.eq(['foo', 'bar']);
      });

      it('returns collections with `find` privilege from privileges', async function () {
        const dataService = createDataServiceWithMockedClient({
          commands: {
            connectionStatus: {
              authInfo: {
                authenticatedUserPrivileges: [
                  {
                    resource: { db: 'foo', collection: 'bar' },
                    actions: ['find'],
                  },
                  {
                    resource: { db: 'foo', collection: 'buz' },
                    actions: [],
                  },
                ],
              },
            },
          },
        });
        const colls = (await dataService.listCollections('foo')).map(
          (coll) => coll.name
        );
        expect(colls).to.deep.eq(['bar']);
      });

      it('filters out collections with no name from privileges', async function () {
        const dataService = createDataServiceWithMockedClient({
          commands: {
            connectionStatus: {
              authInfo: {
                authenticatedUserPrivileges: [
                  {
                    resource: { db: 'foo', collection: '' },
                    actions: ['find'],
                  },
                  {
                    resource: { db: 'foo', collection: 'buz' },
                    actions: ['find'],
                  },
                ],
              },
            },
          },
        });
        const colls = (await dataService.listCollections('foo')).map(
          (coll) => coll.name
        );
        expect(colls).to.deep.eq(['buz']);
      });

      it('merges collections from listCollections and privileges', async function () {
        const dataService = createDataServiceWithMockedClient({
          commands: {
            connectionStatus: {
              authInfo: {
                authenticatedUserPrivileges: [
                  {
                    resource: { db: 'foo', collection: 'bar' },
                    actions: ['find'],
                  },
                  {
                    resource: { db: 'foo', collection: 'buz' },
                    actions: [],
                  },
                ],
              },
            },
          },
          collections: {
            foo: ['buz', 'bla', 'meow'],
          },
        });
        const colls = (await dataService.listCollections('foo')).map(
          (coll) => coll.name
        );
        expect(colls).to.deep.eq(['bar', 'buz', 'bla', 'meow']);
      });

      it('returns result from privileges even if listCollections threw any error', async function () {
        const dataService = createDataServiceWithMockedClient({
          commands: {
            connectionStatus: {
              authInfo: {
                authenticatedUserPrivileges: [
                  {
                    resource: { db: 'foo', collection: 'bar' },
                    actions: ['find'],
                  },
                ],
              },
            },
          },
          collections: {
            foo: new Error('nope'),
          },
        });
        const colls = (await dataService.listCollections('foo')).map(
          (coll) => coll.name
        );
        expect(colls).to.deep.eq(['bar']);
      });
    });

    it('allows disabling/enabling the split-client model for CSFLE', function () {
      const dataService: any = createDataServiceWithMockedClient({});
      const a = {};
      const b = {};
      dataService._crudClient = a;
      dataService._metadataClient = b;

      expect(dataService._initializedClient('CRUD')).to.equal(a);
      expect(dataService._initializedClient('META')).to.equal(b);

      dataService.setCSFLEEnabled(false);

      expect(dataService._initializedClient('CRUD')).to.equal(b);
      expect(dataService._initializedClient('META')).to.equal(b);

      dataService.setCSFLEEnabled(true);

      expect(dataService._initializedClient('CRUD')).to.equal(a);
      expect(dataService._initializedClient('META')).to.equal(b);
    });
  });
});
