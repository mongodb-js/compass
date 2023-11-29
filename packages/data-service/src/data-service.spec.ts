import assert from 'assert';
import { ObjectId } from 'bson';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import type { Sort } from 'mongodb';
import { Collection, MongoServerError } from 'mongodb';
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
import type { ClientMockOptions } from '../test/helpers';
import { createMongoClientMock } from '../test/helpers';
import { AbortController } from '../test/mocks';
import { createClonedClient } from './connect-mongo-client';
import { runCommand } from './run-command';
import { mochaTestServer } from '@mongodb-js/compass-test-server';
import type { SearchIndex } from './search-index-detail-helper';
import { range } from 'lodash';

const { expect } = chai;
chai.use(chaiAsPromised);

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
    this.slow(10_000);
    this.timeout(20_000);

    const cluster = mochaTestServer();

    let dataService: DataServiceImpl;
    let mongoClient: MongoClient;
    let sandbox: sinon.SinonSandbox;
    let connectionOptions: ConnectionOptions;
    let testCollectionName: string;
    let testDatabaseName: string;
    let testNamespace: string;

    before(async function () {
      testDatabaseName = `compass-data-service-tests`;
      connectionOptions = {
        connectionString: cluster().connectionString,
      };

      mongoClient = new MongoClient(connectionOptions.connectionString);
      await mongoClient.connect();

      dataService = new DataServiceImpl(connectionOptions);
      await dataService.connect();
    });

    after(async function () {
      // eslint-disable-next-line no-console
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
        const logger = {
          debug: sinon.spy(),
          info: sinon.spy(),
          warn: sinon.spy(),
          error: sinon.spy(),
          fatal: sinon.spy(),
        };
        const dataService: any = new DataServiceImpl(null as any, logger);
        const client: Pick<MongoClient, 'on' | 'emit'> =
          new EventEmitter() as any;
        dataService['_setupListeners'](client as MongoClient);
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
        const logEntries = [
          // Picking the attrs part of the log
          ...logger.debug.args.map((args) => args[4]),
          ...logger.warn.args.map((args) => args[4]),
        ];
        expect(logEntries).to.deep.equal([
          { connectionId, duration: 100 },
          { connectionId, duration: 400 },
          { connectionId, duration: 400, failure: 'fail' },
          { connectionId, duration: 800, failure: 'fail' },
        ]);
      });
    });

    describe('#deleteOne', function () {
      it('deletes the document from the collection', async function () {
        await dataService.insertOne(testNamespace, { a: 500 });
        await dataService.deleteOne(testNamespace, { a: 500 });
        const docs = await dataService.find(testNamespace, { a: 500 });
        expect(docs.length).to.equal(0);
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

      it('drops a collection', async function () {
        await dataService.dropCollection(`${testDatabaseName}.bar`);
        const items = await dataService.listCollections(testDatabaseName);
        expect(items).to.not.include({ name: 'bar', options: {} });
      });

      it('drops a collection with fle2 options', async function () {
        const buildInfo = await runCommand(
          dataService['_database']('admin', 'META'),
          { buildInfo: 1 }
        );
        if (
          (buildInfo.versionArray?.[0] ?? 0) <= 5 ||
          dataService.getCurrentTopologyType() === 'Single'
        ) {
          return this.skip(); // FLE2 requires 6.0+ replset
        }

        await mongoClient.db(testDatabaseName).createCollection('fle2', {
          encryptedFields: {
            escCollection: 'enxcol_.fle2.esc',
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
        expect(items).to.include('enxcol_.fle2.ecoc');

        await dataService.dropCollection(`${testDatabaseName}.fle2`);

        items = (
          await mongoClient
            .db(testDatabaseName)
            .listCollections({}, { nameOnly: true })
            .toArray()
        ).map(({ name }) => name);

        expect(items).to.not.include('fle2');
        expect(items).to.not.include('enxcol_.fle2.esc');
        expect(items).to.not.include('enxcol_.fle2.ecoc');
      });
    });

    describe('#dropDatabase', function () {
      let dbName: string;
      beforeEach(async function () {
        dbName = uuid();
        await mongoClient.db(dbName).createCollection('testing');
      });

      it('drops a database', async function () {
        await dataService.dropDatabase(dbName);
        const dbs = await dataService.listDatabases();
        expect(dbs).to.not.have.property('name', 'mangoDB');
      });
    });

    describe('#dropIndex', function () {
      beforeEach(async function () {
        await mongoClient
          .db(testDatabaseName)
          .collection(testCollectionName)
          .createIndex(
            {
              a: 1,
            },
            {}
          );
      });

      it('removes an index from a collection', async function () {
        const namespace = testNamespace;
        await dataService.dropIndex(namespace, 'a_1');
        const indexes = await dataService.indexes(namespace);
        const deletedIndex = indexes.find((index) => index.name === 'a_1');
        expect(deletedIndex).to.be.undefined;
      });
    });

    describe('#updateMany', function () {
      it('update documents in the collection', async function () {
        await dataService.insertOne(testNamespace, { a: 500 });
        await dataService.updateMany(
          testNamespace,
          { a: 500 },
          { $set: { foo: 'bar' } }
        );
        const docs = await dataService.find(testNamespace, { a: 500 });
        expect(docs.length).to.equal(1);
        expect(docs[0].foo).to.equal('bar');
      });
    });

    describe('#deleteMany', function () {
      it('deletes the document from the collection', async function () {
        await dataService.insertOne(testNamespace, { a: 500 });
        await dataService.deleteMany(testNamespace, { a: 500 });
        const docs = await dataService.find(testNamespace, { a: 500 });
        expect(docs.length).to.equal(0);
      });
    });

    describe('#aggregateCursor', function () {
      it('returns a cursor for the documents', async function () {
        let count = 0;
        await dataService
          .aggregateCursor(
            testNamespace,
            [{ $match: {} }, { $group: { _id: '$a', total: { $sum: '$a' } } }],
            { cursor: { batchSize: 10000 } }
          )
          .forEach(function () {
            count++;
          });
        expect(count).to.equal(2);
      });
    });

    describe('#aggregate', function () {
      it('returns a list of aggregated documents', async function () {
        const data = await dataService.aggregate(testNamespace, [
          { $match: {} },
          { $group: { _id: '$a', total: { $sum: '$a' } } },
          { $sort: { _id: 1 } },
        ]);
        expect(data).to.deep.equal([
          { _id: 1, total: 1 },
          { _id: 2, total: 2 },
        ]);
      });

      it('cancels the long running aggregation', async function () {
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

        const promise = dataService
          .aggregate(
            testNamespace,
            pipeline,
            {},
            { abortSignal: abortSignal as unknown as AbortSignal }
          )
          .catch((err) => err);
        // cancel the operation
        abortController.abort();
        const error = await promise;

        expect(error).to.be.instanceOf(Error);
      });
    });

    describe('#find', function () {
      it('returns a list of documents', async function () {
        const docs = await dataService.find(
          testNamespace,
          {},
          {
            skip: 1,
          }
        );
        expect(docs.length).to.equal(1);
      });

      it('returns a list of documents when filter is provided', async function () {
        const docs = await dataService.find(testNamespace, { a: 1 }, {});
        expect(docs.length).to.equal(1);
      });

      it('returns a list of documents when no filter is provided', async function () {
        const docs = await dataService.find(testNamespace, {}, {});
        expect(docs.length).to.equal(2);
      });

      it('returns a list of documents when options are provided', async function () {
        const docs = await dataService.find(
          testNamespace,
          {},
          {
            skip: 1,
          }
        );
        expect(docs.length).to.equal(1);
      });

      it('returns a list of documents with correct sort order when array sort is provided', async function () {
        const sort: Sort = [
          ['2', -1],
          ['1', -1],
        ];
        const docs = await dataService.find(testNamespace, {}, { sort });
        expect(docs.length).to.equal(2);
        expect(docs[0]).to.have.nested.property('2', 'a');
        expect(docs[1]).to.have.nested.property('1', 'a');
      });

      it('cancels the long running find operation', async function () {
        const abortController = new AbortController();
        const abortSignal = abortController.signal;
        const filter = {
          query: {
            $where: `function () {
              sleep(100);
              return true;
            }`,
          },
        };

        const promise = dataService
          .find(
            testNamespace,
            filter,
            {},
            { abortSignal: abortSignal as unknown as AbortSignal }
          )
          .catch((err) => err);
        // cancel the operation
        abortController.abort();
        const error = await promise;

        expect(dataService.isCancelError(error)).to.be.true;
      });
    });

    describe('#findCursor', function () {
      it('returns a cursor for the documents', async function () {
        const cursor = dataService.findCursor(testNamespace, {}, { skip: 1 });
        const docs = await cursor.toArray();
        expect(docs.length).to.equal(1);
      });

      it('returns a cursor for the matching documents when a filter is provided', async function () {
        const cursor = dataService.findCursor(testNamespace, { a: 1 }, {});
        const docs = await cursor.toArray();
        expect(docs.length).to.equal(1);
      });

      it('returns a cursor for all documents when no filter is provided', async function () {
        const cursor = dataService.findCursor(testNamespace, {}, {});
        const docs = await cursor.toArray();
        expect(docs.length).to.equal(2);
      });

      it('returns a cursor for the documents when options are provided', async function () {
        const cursor = dataService.findCursor(testNamespace, {}, { skip: 1 });
        const docs = await cursor.toArray();
        expect(docs.length).to.equal(1);
      });
    });

    describe('#findOneAndReplace', function () {
      const id = new ObjectId();

      it('returns the updated document', async function () {
        await dataService.insertOne(testNamespace, {
          _id: id,
          a: 500,
        });
        const result = await dataService.findOneAndReplace(
          testNamespace,
          { _id: id },
          { b: 5 },
          { returnDocument: 'after' }
        );
        expect(result?._id.toString()).to.deep.equal(id.toString());
        expect(result?.b).to.equal(5);
        expect(result).to.not.haveOwnProperty('a');
      });
    });

    describe('#findOneAndUpdate', function () {
      const id = new ObjectId();

      it('returns the updated document', async function () {
        await dataService.insertOne(testNamespace, { _id: id, a: 500 });
        const result = await dataService.findOneAndUpdate(
          testNamespace,
          { _id: id },
          { $set: { b: 5 } },
          { returnDocument: 'after' }
        );
        expect(result?._id.toString()).to.deep.equal(id.toString());
        expect(result?.b).to.equal(5);
        expect(result).to.haveOwnProperty('a');
      });
    });

    describe('#collectionStats', function () {
      context('when the collection is not a system collection', function () {
        it('returns an object with the collection stats', async function () {
          const stats = await dataService.collectionStats(
            testDatabaseName,
            testCollectionName
          );
          expect(stats.name).to.equal(testCollectionName);
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
      it('returns the update result', async function () {
        const result = await dataService.updateCollection(testNamespace);
        expect(result.ok).to.equal(1);
      });
    });

    describe('#renameCollection', function () {
      beforeEach(async function () {
        for (const collectionName of [
          'initialCollection',
          'renamedCollection',
        ]) {
          await dataService
            .dropCollection(`${testDatabaseName}.${collectionName}`)
            .catch(() => null);
        }
        await dataService.createCollection(
          `${testDatabaseName}.initialCollection`,
          {}
        );
      });
      it('renames the collection', async function () {
        await dataService.renameCollection(
          `${testDatabaseName}.initialCollection`,
          'renamedCollection'
        );

        const [collection] = await dataService.listCollections(
          testDatabaseName,
          { name: 'renamedCollection' }
        );
        expect(collection).to.exist;
      });

      it('returns the collection object', async function () {
        const result = await dataService.renameCollection(
          `${testDatabaseName}.initialCollection`,
          'renamedCollection'
        );
        expect(result).to.be.instanceOf(Collection);
      });
    });

    describe('#estimatedCount', function () {
      it('returns a 0 for an empty collection', async function () {
        const count = await dataService.estimatedCount(
          `${testDatabaseName}.empty`,
          {}
        );
        expect(count).to.equal(0);
      });

      it('returns the estimated count', async function () {
        const count = await dataService.estimatedCount(testNamespace, {});
        expect(count).to.equal(2);
      });

      it('cancels the long running estimated count', async function () {
        const abortController = new AbortController();
        const abortSignal = abortController.signal;

        const promise = dataService
          .estimatedCount(
            testNamespace,
            {},
            { abortSignal: abortSignal as unknown as AbortSignal }
          )
          .catch((err) => err);
        // cancel the operation
        abortController.abort();
        const error = await promise;
        expect(dataService.isCancelError(error)).to.be.true;
      });
    });

    describe('#count', function () {
      it('returns 0 for an empty collection', async function () {
        const count = await dataService.count(
          `${testDatabaseName}.empty`,
          {
            a: 1,
          },
          {}
        );
        expect(count).to.equal(0);
      });

      it('returns a count for the matching documents', async function () {
        const count = await dataService.count(
          testNamespace,
          {
            a: 1,
          },
          {}
        );
        expect(count).to.equal(1);
      });

      it('throws the error when count times out', async function () {
        const error = await dataService
          .count(
            testNamespace,
            {
              $where: 'function() { sleep(5500); return true; }',
            },
            { maxTimeMS: 500 }
          )
          .catch((e) => e);
        expect(error).to.not.equal(null);
      });

      it('cancels the long running count', async function () {
        const abortController = new AbortController();
        const abortSignal = abortController.signal;
        const filter = {
          query: {
            $where: `function () {
              sleep(100);
              return true;
            }`,
          },
        };

        const promise = dataService
          .count(
            testNamespace,
            filter,
            {},
            { abortSignal: abortSignal as unknown as AbortSignal }
          )
          .catch((err) => err);
        // cancel the operation
        abortController.abort();
        const error = await promise;

        expect(dataService.isCancelError(error)).to.be.true;
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
      afterEach(async function () {
        await mongoClient.db(testDatabaseName).dropCollection('foo');
      });

      it('creates a new collection', async function () {
        const options = {};
        await dataService.createCollection(`${testDatabaseName}.foo`, options);
        const collInfo = await dataService.collectionInfo(
          testDatabaseName,
          'foo'
        );
        expect(collInfo).to.have.property('name', 'foo');
        expect(collInfo).to.have.property('type', 'collection');
      });
    });

    describe('#createIndex', function () {
      context('when options are provided', function () {
        it('creates a new index with the provided options', async function () {
          const namespace = testNamespace;
          const spec = { a: 1 };
          const options = { unique: true };
          await dataService.createIndex(namespace, spec, options);
          const indexes = await dataService.indexes(namespace, {});
          expect(indexes.length).to.equal(2);
        });
      });

      context('when no options are provided', function () {
        it('creates a new single index', async function () {
          const namespace = testNamespace;
          const spec = { b: 1 };
          const options = {};
          await dataService.createIndex(namespace, spec, options);
          const indexes = await dataService.indexes(namespace, {});
          expect(indexes.length).to.equal(2);
        });

        it('creates a new compound index', async function () {
          const namespace = testNamespace;
          const spec = { a: -1, b: 1 };
          const options = {};
          await dataService.createIndex(namespace, spec, options);
          const indexes = await dataService.indexes(namespace, {});
          expect(indexes.length).to.equal(2);
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
      it('returns the indexes', async function () {
        const indexes = await dataService.indexes(testNamespace);
        expect(indexes[0].name).to.equal('_id_');
        expect(indexes[0].size).to.be.a('number');
      });
    });

    describe('#insertOne', function () {
      it('inserts the document into the collection', async function () {
        await dataService.insertOne(testNamespace, { a: 500 });
        const docs = await dataService.find(testNamespace, { a: 500 });
        expect(docs.length).to.equal(1);
      });
    });

    describe('#insertMany', function () {
      it('inserts the documents into the collection', async function () {
        await dataService.insertMany(testNamespace, [{ a: 500 }, { a: 500 }]);
        const docs = await dataService.find(testNamespace, { a: 500 });
        expect(docs.length).to.equal(2);
      });
    });

    describe('#sample', function () {
      it('returns a list of sampled documents', async function () {
        const docs = await dataService.sample(testNamespace);
        expect(docs.length).to.equal(2);
      });

      it('allows to pass a query', async function () {
        const docs = await dataService.sample(testNamespace, {
          query: { a: 1 },
        });
        expect(docs.length).to.equal(1);
        expect(docs[0]).to.haveOwnProperty('_id');
        expect(docs[0].a).to.equal(1);
      });

      it('allows to pass a projection', async function () {
        const docs = await dataService.sample(testNamespace, {
          fields: {
            a: 1,
            _id: 0,
          },
        });

        expect(docs).to.deep.include.members([{ a: 1 }, { a: 2 }]);
      });

      it('allows to set a sample size', async function () {
        const docs = await dataService.sample(testNamespace, {
          size: 1,
        });

        expect(docs.length).to.equal(1);
      });

      it('always sets default sample size and allowDiskUse: true', function () {
        sandbox.spy(dataService, 'aggregate');
        void dataService.sample('db.coll');

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(dataService.aggregate).to.have.been.calledWith(
          'db.coll',
          [{ $sample: { size: 1000 } }],
          { allowDiskUse: true }
        );
      });

      it('allows to pass down aggregation options to the driver', function () {
        sandbox.spy(dataService, 'aggregate');
        void dataService.sample(
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
        void dataService.sample(
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

      it('creates a new view', async function () {
        await dataService.createView(
          'myView',
          `${testDatabaseName}.testViewSourceColl`,
          [{ $project: { a: 0 } }]
        );
      });

      it('returns documents from the view', async function () {
        const docs = await dataService.find(
          `${testDatabaseName}.myView`,
          {},
          {}
        );

        assert.equal(docs.length, 2);
        assert.strictEqual(docs[0].a, undefined);
        assert.strictEqual(docs[1].a, undefined);
      });
    });

    describe('#currentOp', function () {
      it('returns an object with the currentOp', async function () {
        const result = await dataService.currentOp();
        expect(result.inprog).to.not.equal(undefined); // TODO: are these tests enough?
      });
    });

    describe('#serverStatus', function () {
      it('returns an object with the serverstats', async function () {
        const result = await dataService.serverStatus();
        expect(result.ok).to.equal(1);
      });
    });

    describe('#top', function () {
      it('returns an object with the results from top', async function () {
        if (dataService.isMongos()) {
          await expect(() => dataService.top()).to.be.rejectedWith(/top/);
        } else {
          expect(await dataService.top()).to.have.property('ok', 1);
        }
      });
    });

    describe('#explain', function () {
      context('when a filter is provided', function () {
        it('returns an explain object for the provided filter', async function () {
          const explanation = await dataService.explainFind(testNamespace, {
            a: 1,
          });
          expect(explanation).to.be.an('object');
        });
      });
    });

    describe('#startSession', function () {
      it('returns a new client session', function () {
        const session = dataService['_startSession']('CRUD');
        expect(session.constructor.name).to.equal('ClientSession');

        // used by killSessions, must be a bson UUID in order to work
        expect(session.id!.id._bsontype).to.equal('Binary');
        expect(session.id!.id.sub_type).to.equal(4);
      });
    });

    describe('#killSessions', function () {
      it('does not throw if kill a non existing session', async function () {
        const session = dataService['_startSession']('CRUD');
        await dataService['_killSessions'](session);
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

        const session = dataService['_startSession']('CRUD');
        await dataService['_killSessions'](session);

        expect(commandSpy.args[0][0]).to.deep.equal({
          killSessions: [session.id],
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
        expect(dataService['_csfleLogInformation'](fleOptions)).to.deep.equal({
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
        // eslint-disable-next-line no-console
        await csfleDataService?.disconnect().catch(console.log);
      });

      it('can create data keys', async function () {
        const uuid = await csfleDataService.createDataKey('local');
        const keyDoc = await csfleDataService
          .findCursor(`${testDatabaseName}.keyvault`, {}, {})
          .next();
        expect(uuid).to.deep.equal(keyDoc._id);
      });
    });

    describe('#explainAggregate', function () {
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

        expect(dataService.isCancelError(error)).to.be.true;
      });
    });

    describe('#explainFind', function () {
      it('returns an explain object', async function () {
        const explain = await dataService.explainFind(testNamespace, {
          query: {
            a: 1,
          },
        });
        expect(explain).to.be.an('object');
      });
      it('returns an explain object - cancellable', async function () {
        const abortController = new AbortController();
        const abortSignal = abortController.signal;
        const filter = {
          query: {
            a: 1,
          },
        };
        const executionOptions = {
          abortSignal,
        };

        // cancellable explain
        const promise = dataService
          .explainFind(testNamespace, filter, {}, executionOptions as any)
          .catch((err) => err);
        // cancel the operation
        abortController.abort();
        const error = await promise;

        expect(dataService.isCancelError(error)).to.be.true;
      });
    });

    describe('#cancellableOperation', function () {
      it('does not call stop when signal is not set', async function () {
        const stop = sinon.spy();
        const response = await dataService['_cancellableOperation'](
          () => Promise.resolve(10),
          () => stop()
        );
        expect(response).to.equal(10);
        expect(stop.callCount).to.equal(0);
      });
      it('does not call stop when signal is set and operation succeeds', async function () {
        const abortSignal = new AbortController().signal;
        const stop = sinon.spy();
        const response = await dataService['_cancellableOperation'](
          () => Promise.resolve(10),
          () => stop(),
          abortSignal as unknown as AbortSignal
        );
        expect(response).to.equal(10);
        expect(stop.callCount).to.equal(0);
      });
      it('calls stop when operation fails', async function () {
        const abortController = new AbortController();
        const abortSignal = abortController.signal;

        const stop = sinon.stub().resolves();
        const promise = dataService['_cancellableOperation'](
          () => new Promise(() => {}),
          () => stop(),
          abortSignal as unknown as AbortSignal
        ).catch((error) => error);

        abortController.abort();
        await promise;

        expect(stop.callCount).to.equal(1);
      });
    });

    describe('#isListSearchIndexesSupported', function () {
      it('returns false', async function () {
        expect(
          await dataService.isListSearchIndexesSupported(testNamespace)
        ).to.be.false;
      });
    });

    describe('#getSearchIndexes', function () {
      it('throws an error', async function () {
        await expect(
          dataService.getSearchIndexes(testNamespace)
        ).to.be.rejectedWith(
          MongoServerError,
          /Unrecognized pipeline stage name: '\$listSearchIndexes'"|\$listSearchIndexes stage is only allowed on MongoDB Atlas/
        );
      });
    });

    describe('#createSearchIndex', function () {
      it('throws an error', async function () {
        await expect(
          dataService.createSearchIndex(testNamespace, 'my-index', {})
        ).to.be.rejectedWith(
          MongoServerError,
          "no such command: 'createSearchIndexes'"
        );
      });
    });

    describe('#updateSearchIndex', function () {
      it('throws an error', async function () {
        await expect(
          dataService.updateSearchIndex(testNamespace, 'my-index', {})
        ).to.be.rejectedWith(
          MongoServerError,
          "no such command: 'updateSearchIndex'"
        );
      });
    });

    describe('#dropSearchIndex', function () {
      it('throws an error', async function () {
        await expect(
          dataService.dropSearchIndex(testNamespace, 'my-index')
        ).to.be.rejectedWith(
          MongoServerError,
          "no such command: 'dropSearchIndex'"
        );
      });
    });

    describe('#previewUpdate', function () {
      const namespace = 'test.previewUpdate';
      const sampleDocument = { _id: new ObjectId(), foo: 'bar' };
      const replsetCluster = mochaTestServer({
        topology: 'replset',
        secondaries: 0,
      });
      let replDataService: DataService;

      before(async function () {
        const replSetOptions = {
          connectionString: replsetCluster().connectionString,
        };

        replDataService = new DataServiceImpl(replSetOptions);
        await replDataService.connect();
        await replDataService.createIndex(
          namespace,
          { foo: 1 },
          { unique: true }
        );
        await replDataService.insertOne(namespace, sampleDocument);

        const dummyDocs = range(1, 100).map((idx) => ({
          _id: { 'foo.bar': idx },
          foo: `bar${idx}`,
        }));
        await replDataService.insertMany(namespace, dummyDocs);
      });

      after(async function () {
        // eslint-disable-next-line no-console
        await replDataService.disconnect().catch(console.log);
      });

      it('should return the preview of a changed document', async function () {
        if (replDataService.getCurrentTopologyType() === 'Single') {
          return this.skip(); // Transactions only work in replicasets or sharded clusters
        }

        const changeset = await replDataService.previewUpdate(
          namespace,
          {
            foo: 'bar',
          },
          {
            $set: {
              foo: 'baz',
            },
          }
        );

        expect(changeset.changes).to.have.length(1);
        expect(changeset.changes[0].before).to.deep.equal(sampleDocument);
        expect(changeset.changes[0].after).to.deep.equal({
          ...sampleDocument,
          foo: 'baz',
        });
      });

      it('supports expressive updates', async function () {
        if (replDataService.getCurrentTopologyType() === 'Single') {
          return this.skip(); // Transactions only work in replicasets or sharded clusters
        }

        const changeset = await replDataService.previewUpdate(
          namespace,
          {
            foo: 'bar',
          },
          [
            {
              $set: {
                counter: 1,
              },
            },
            {
              $unset: ['foo'],
            },
          ]
        );

        expect(changeset.changes).to.have.length(1);
        expect(changeset.changes[0].before).to.deep.equal(sampleDocument);
        expect(changeset.changes[0].after).to.deep.equal({
          _id: sampleDocument._id,
          counter: 1,
        });
      });

      it('should not modify the underlying document', async function () {
        if (replDataService.getCurrentTopologyType() === 'Single') {
          return this.skip(); // Transactions only work in replicasets or sharded clusters
        }

        await replDataService.previewUpdate(
          namespace,
          {
            foo: 'bar',
          },
          {
            $set: {
              foo: 'baz',
            },
          }
        );

        const [document] = await replDataService.find(namespace, {
          _id: sampleDocument._id,
        });
        expect(document).to.deep.equal(sampleDocument);
      });

      it('should fail when aborted by the controller', async function () {
        if (replDataService.getCurrentTopologyType() === 'Single') {
          return this.skip(); // Transactions only work in replicasets or sharded clusters
        }

        const controller = new AbortController();
        controller.abort();

        await expect(
          replDataService.previewUpdate(
            namespace,
            {
              foo: 'bar',
            },
            {
              $set: {
                foo: 'baz',
              },
            },
            {
              abortSignal: controller.signal as unknown as AbortSignal,
              sample: 10,
              timeout: 1000,
            }
          )
        ).to.eventually.be.rejectedWith(/This operation was aborted/);
      });

      it('should be limited to 10 documents even if more documents match', async function () {
        if (replDataService.getCurrentTopologyType() === 'Single') {
          return this.skip(); // Transactions only work in replicasets or sharded clusters
        }

        const changeset = await replDataService.previewUpdate(
          namespace,
          {}, // update all documents
          {
            $set: {
              count: 1,
            },
          }
        );

        expect(changeset.changes.length).to.equal(10);
      });

      it('should fail when the update breaks a unique index constraint', async function () {
        if (replDataService.getCurrentTopologyType() === 'Single') {
          return this.skip(); // Transactions only work in replicasets or sharded clusters
        }

        await expect(
          replDataService.previewUpdate(
            namespace,
            {}, // update all documents
            {
              $set: {
                foo: 'baz', // to have the same value on a unique indexed field
              },
            }
          )
        ).to.be.eventually.rejectedWith(/E11000 duplicate key error/);
      });

      it('should not insert any new document', async function () {
        if (replDataService.getCurrentTopologyType() === 'Single') {
          return this.skip(); // Transactions only work in replicasets or sharded clusters
        }

        await replDataService.previewUpdate(
          namespace,
          {
            foo: 'bar',
          },
          {
            $set: {
              foo: 'baz',
            },
          }
        );

        const count = await replDataService.count(namespace, {});
        expect(count).to.equal(100); // 99 dummy documents + 1 testing doc
      });

      it('should not insert any new document if there is no match', async function () {
        if (replDataService.getCurrentTopologyType() === 'Single') {
          return this.skip(); // Transactions only work in replicasets or sharded clusters
        }

        await replDataService.previewUpdate(
          namespace,
          {
            foo: 'whatever',
          },
          {
            $set: {
              foo: 'baz',
            },
          }
        );

        const count = await replDataService.count(namespace, {});
        expect(count).to.equal(100);
      });
    });
  });

  context('with mocked client', function () {
    function createDataServiceWithMockedClient(
      clientConfig: Partial<ClientMockOptions>
    ) {
      const dataService = new DataServiceImpl({
        connectionString: 'mongodb://localhost:27020',
      });
      const { client } = createMongoClientMock(clientConfig);
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

    describe('CSFLE split clients', function () {
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

      it('resets clients after updateCollection', async function () {
        const mockConfig = {
          commands: {
            collMod: { ok: 1 },
          },
          clientOptions: {
            autoEncryption: {
              kmsProviders: {
                local: { key: 'A'.repeat(128) },
              },
            },
          },
        };
        const dataService = createDataServiceWithMockedClient(mockConfig);
        // Ensure that _crudClient and _metadataClient differ
        const fakeCrudClient =
          createDataServiceWithMockedClient(mockConfig)['_crudClient'];

        dataService['_crudClient'] = fakeCrudClient;

        const fakeClonedClient =
          createDataServiceWithMockedClient(mockConfig)['_crudClient'];

        if (fakeCrudClient) {
          fakeCrudClient[createClonedClient] = sinon
            .stub()
            .resolves(fakeClonedClient);
        }

        await dataService.updateCollection('test.test', {
          validator: { $jsonSchema: {} },
        });
        expect(dataService['_crudClient']).to.equal(fakeClonedClient);
      });
    });

    describe('#isListSearchIndexesSupported', function () {
      it('resolves to true if listSearchIndexes succeeds', async function () {
        const searchIndexes: SearchIndex[] = [
          {
            id: '1',
            name: 'a',
            status: 'READY',
            queryable: true,
            latestDefinition: {},
          },
          {
            id: '2',
            name: 'b',
            status: 'READY',
            queryable: true,
            latestDefinition: {},
          },
        ];

        const dataService: any = createDataServiceWithMockedClient({
          searchIndexes: {
            test: {
              test: searchIndexes,
            },
          },
        });
        expect(
          await dataService.isListSearchIndexesSupported('test.test')
        ).to.be.true;
      });

      it('resolves to false if listSearchIndexes fails', async function () {
        const dataService: any = createDataServiceWithMockedClient({
          searchIndexes: {
            test: {
              test: new Error('fake error'),
            },
          },
        });
        expect(
          await dataService.isListSearchIndexesSupported('test.test')
        ).to.be.false;
      });
    });

    describe('#getSearchIndexes', function () {
      it('returns the search indexes', async function () {
        const searchIndexes: SearchIndex[] = [
          {
            id: '1',
            name: 'a',
            status: 'READY',
            queryable: true,
            latestDefinition: {},
          },
          {
            id: '2',
            name: 'b',
            status: 'READY',
            queryable: true,
            latestDefinition: {},
          },
        ];

        const dataService: any = createDataServiceWithMockedClient({
          searchIndexes: {
            test: {
              test: searchIndexes,
            },
          },
        });
        expect(await dataService.getSearchIndexes('test.test')).to.deep.equal(
          searchIndexes
        );
      });
    });

    describe('#createSearchIndex', function () {
      it('creates a search index', async function () {
        const dataService: any = createDataServiceWithMockedClient({});
        expect(
          await dataService.createSearchIndex('test.test', 'my-index', {
            mappings: { dynamic: true },
          })
        ).to.deep.equal('my-index');
      });
    });

    describe('#updateSearchIndex', function () {
      it('updates a search index', async function () {
        const dataService: any = createDataServiceWithMockedClient({});
        expect(
          await dataService.updateSearchIndex('test.test', 'my-index', {
            mappings: { dynamic: true },
          })
        ).to.be.undefined;
      });
    });

    describe('#dropSearchIndex', function () {
      it('drops a search index', async function () {
        const dataService: any = createDataServiceWithMockedClient({});
        expect(
          await dataService.dropSearchIndex('test.test', 'my-index')
        ).to.be.undefined;
      });
    });
  });
});
