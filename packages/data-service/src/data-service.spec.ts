import assert from 'assert';
import { ObjectId } from 'bson';
import { expect } from 'chai';
import { EventEmitter } from 'events';
import { MongoClient, Sort } from 'mongodb';
import sinon from 'sinon';
import * as helper from '../test/helper';
import connect from './connect';
import DataService from './data-service';
import { Callback } from './types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mock = require('mock-require');

function mockedTopologyDescription(
  topologyType = 'Standalone',
  serverType = 'Single'
) {
  return {
    type: topologyType,
    servers: new Map([['127.0.0.1:27017', { type: serverType }]]),
  };
}

/*
 * pretends to be a connection-model providing every function call
 * required in NativeClient#connect, but returns topology and connection
 * params of our choice
 */
function mockedConnectionModel(
  topologyDescription?: any,
  connectionOptions?: any
) {
  const _topologyDescription =
    topologyDescription || mockedTopologyDescription();

  const _connectionOptions = connectionOptions || {
    url: 'mongodb://127.0.0.1:27018/data-service?readPreference=primary&ssl=false',
    options: {
      readPreference: 'primary',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  };

  const mockedTunnel = {
    close() {
      return Promise.resolve();
    },
  };

  return function (_model: any, setupListeners: any, cb: any) {
    const mockedClient = new EventEmitter() as any;
    mockedClient.db = () => {
      // pass
    };
    mockedClient.close = (_force: any, closeCb: Callback<void>) => {
      closeCb(null);
    };
    setupListeners(mockedClient);
    mockedClient.emit('topologyDescriptionChanged', {
      newDescription: _topologyDescription,
    });
    cb(null, mockedClient, mockedTunnel, _connectionOptions);
  };
}

describe('DataService', function () {
  this.slow(10000);
  this.timeout(20000);

  let service: DataService;
  let mongoClient: MongoClient;
  let sandbox: sinon.SinonSandbox;

  before(async function () {
    sandbox = sinon.createSandbox();
    service = await connect(helper.connectionOptions);
    const opts = service.getMongoClientConnectionOptions();
    mongoClient = await MongoClient.connect(opts!.url, opts!.options);
  });
  after(function (done) {
    service.disconnect(() => {
      mongoClient.close(done);
    });
  });
  afterEach(function () {
    sandbox.restore();
  });

  // Each test gets its own service so that we can connect/disconnect it freely
  describe('#isConnected', function () {
    let _service: DataService;

    it('returns false when not connected initially', function () {
      _service = new DataService(helper.connection);
      expect(_service.isConnected()).to.equal(false);
    });

    it('returns true if client is connected', function (done) {
      _service = new DataService(helper.connection);
      _service.connect(() => {
        expect(_service.isConnected()).to.equal(true);
        done();
      });
    });

    it('returns false if client is disconnected', function (done) {
      _service = new DataService(helper.connection);
      _service.connect(() => {
        _service.disconnect(() => {
          expect(_service.isConnected()).to.equal(false);
          done();
        });
      });
    });

    afterEach(function (done) {
      if (_service) {
        _service.disconnect(done);
      }
    });
  });

  describe('#deleteOne', function () {
    it('deletes the document from the collection', function (done) {
      service.insertOne(
        'data-service.test',
        {
          a: 500,
        },
        {},
        function (err) {
          assert.equal(null, err);
          service.deleteOne(
            'data-service.test',
            {
              a: 500,
            },
            {},
            function (er) {
              assert.equal(null, er);
              service.find(
                'data-service.test',
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
      service.command('data-service', { ping: 1 }, function (error, result) {
        assert.equal(null, error);
        expect(result.ok).to.equal(1);
        done();
      });
    });
  });

  describe('#dropCollection', function () {
    before(function (done) {
      mongoClient.db().createCollection('bar', {}, function (error) {
        assert.equal(null, error);
        done();
      });
    });

    it('drops a collection', function (done) {
      const dbName = 'data-service';
      service.dropCollection(`${dbName}.bar`, function (error) {
        assert.equal(null, error);
        service.listCollections(dbName, {}, function (err, items) {
          assert.equal(null, err);
          expect(items).to.not.include({ name: 'bar', options: {} });
          done();
        });
      });
    });
  });

  describe('#dropDatabase', function () {
    before(function (done) {
      mongoClient
        .db('mangoDB')
        .createCollection('testing', {}, function (error) {
          assert.equal(null, error);
          done();
        });
    });

    it('drops a database', function (done) {
      service.dropDatabase('mangoDB', function (error) {
        assert.equal(null, error);
        service.listDatabases(function (err, dbs) {
          assert.equal(null, err);
          expect(dbs).to.not.have.property('name', 'mangoDB');
          done();
        });
      });
    });
  });

  describe('#dropIndex', function () {
    before(function (done) {
      mongoClient
        .db()
        .collection('test')
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
      const namespace = 'data-service.test';
      service.dropIndex(namespace, 'a_1', function (error) {
        assert.equal(null, error);
        service.indexes(namespace, {}, function (err, indexes) {
          assert.equal(null, err);
          expect(indexes).to.not.have.property('name', 'a_1');
          done();
        });
      });
    });
  });

  describe('#deleteMany', function () {
    it('deletes the document from the collection', function (done) {
      service.insertOne(
        'data-service.test',
        {
          a: 500,
        },
        {},
        function (err) {
          assert.equal(null, err);
          service.deleteMany(
            'data-service.test',
            {
              a: 500,
            },
            {},
            function (er) {
              assert.equal(null, er);
              service.find(
                'data-service.test',
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
    before(function (done) {
      helper.insertTestDocuments(mongoClient, function () {
        done();
      });
    });

    after(function (done) {
      helper.deleteTestDocuments(mongoClient, function () {
        done();
      });
    });

    it('returns a cursor for the documents', function (done) {
      let count = 0;
      service
        .aggregate(
          'data-service.test',
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
      service.aggregate(
        'data-service.test',
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
    before(function (done) {
      helper.insertTestDocuments(mongoClient, function () {
        done();
      });
    });

    after(function (done) {
      helper.deleteTestDocuments(mongoClient, function () {
        done();
      });
    });

    it('returns a cursor for the documents', function (done) {
      service.find(
        'data-service.test',
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
        service.find(
          'data-service.test',
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
        service.find('data-service.test', {}, {}, function (error, docs) {
          assert.equal(null, error);
          expect(docs.length).to.equal(2);
          done();
        });
      });
    });

    context('when options are provided', function () {
      it('returns a cursor for the documents', function (done) {
        service.find(
          'data-service.test',
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
        service.find('data-service.test', {}, { sort }, function (error, docs) {
          assert.strictEqual(null, error);
          expect(docs[0]).to.have.nested.property('2', 'a');
          expect(docs[1]).to.have.nested.property('1', 'a');
          done();
        });
      });
    });
  });

  describe('#fetch', function () {
    before(function (done) {
      helper.insertTestDocuments(mongoClient, function () {
        done();
      });
    });

    after(function (done) {
      helper.deleteTestDocuments(mongoClient, function () {
        done();
      });
    });

    it('returns a cursor for the documents', function (done) {
      const cursor = service.fetch('data-service.test', {}, { skip: 1 });
      cursor.toArray(function (error, docs) {
        assert.equal(null, error);
        expect(docs!.length).to.equal(1);
        done();
      });
    });

    context('when a filter is provided', function () {
      it('returns a cursor for the matching documents', function (done) {
        const cursor = service.fetch('data-service.test', { a: 1 }, {});
        cursor.toArray(function (error, docs) {
          assert.equal(null, error);
          expect(docs!.length).to.equal(1);
          done();
        });
      });
    });

    context('when no filter is provided', function () {
      it('returns a cursor for all documents', function (done) {
        const cursor = service.fetch('data-service.test', {}, {});
        cursor.toArray(function (error, docs) {
          assert.equal(null, error);
          expect(docs!.length).to.equal(2);
          done();
        });
      });
    });

    context('when options are provided', function () {
      it('returns a cursor for the documents', function (done) {
        const cursor = service.fetch('data-service.test', {}, { skip: 1 });
        cursor.toArray(function (error, docs) {
          assert.equal(null, error);
          expect(docs!.length).to.equal(1);
          done();
        });
      });
    });
  });

  describe('#findOneAndReplace', function () {
    after(function (done) {
      helper.deleteTestDocuments(mongoClient, function () {
        done();
      });
    });

    const id = new ObjectId();

    it('returns the updated document', function (done) {
      service.insertOne(
        'data-service.test',
        {
          _id: id,
          a: 500,
        },
        {},
        function (err) {
          assert.equal(null, err);
          service.findOneAndReplace(
            'data-service.test',
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
    after(function (done) {
      helper.deleteTestDocuments(mongoClient, function () {
        done();
      });
    });

    const id = new ObjectId();

    it('returns the updated document', function (done) {
      service.insertOne(
        'data-service.test',
        {
          _id: id,
          a: 500,
        },
        {},
        function (err) {
          assert.equal(null, err);
          service.findOneAndUpdate(
            'data-service.test',
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
      service.collection('data-service.test', {}, function (err, coll) {
        assert.equal(null, err);
        expect(coll.ns).to.equal('data-service.test');
        expect(coll.index_count).to.equal(1);
        done();
      });
    });
  });

  describe('#collectionStats', function () {
    context('when the collection is not a system collection', function () {
      it('returns an object with the collection stats', function (done) {
        service.collectionStats('data-service', 'test', function (err, stats) {
          assert.equal(null, err);
          expect(stats.name).to.equal('test');
          done();
        });
      });
    });
  });

  describe('#listCollections', function () {
    it('returns the collections', function (done) {
      service.listCollections('data-service', {}, function (err, collections) {
        assert.equal(null, err);
        // For <3.2 system.indexes is returned with listCollections
        expect(collections.length).to.equal(1);
        expect(collections[0]).to.include.keys(['name', 'options']);
        expect(collections[0].name).to.equal('test');
        expect(collections[0].options).to.deep.equal({});
        done();
      });
    });
  });

  describe('#updateCollection', function () {
    it('returns the update result', function (done) {
      service.updateCollection('data-service.test', {}, function (err, result) {
        assert.equal(null, err);
        expect(result.ok).to.equal(1.0);
        done();
      });
    });
  });

  describe('#estimatedCount', function () {
    it('returns a count for the matching documents', function (done) {
      service.estimatedCount('data-service.test', {}, function (error, count) {
        assert.equal(null, error);
        expect(count).to.equal(0);
        done();
      });
    });
  });

  describe('#count', function () {
    context('when a filter is provided', function () {
      it('returns a count for the matching documents', function (done) {
        service.count(
          'data-service.test',
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
    });

    context('when max timeout is provided', function () {
      context('when the count times out', function () {
        before(function (done) {
          service.insertOne('data-service.test', { a: 500 }, {}, done);
        });

        after(function (done) {
          service.deleteMany('data-service.test', {}, {}, done);
        });

        it('does not throw the error', function (done) {
          service.count(
            'data-service.test',
            {
              $where: 'function() { sleep(5500); return true; }',
            },
            { maxTimeMS: 5000 },
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
      service.database('data-service', {}, function (err, database) {
        assert.equal(null, err);
        expect(database._id).to.equal('data-service');
        expect(database.stats.document_count).to.not.equal(undefined);
        done();
      });
    });
  });

  describe('#listDatabases', function () {
    it('returns the databases', function (done) {
      service.listDatabases(function (err, databases) {
        assert.equal(null, err);
        const databaseNames = databases.map((db: any) => db.name);
        if (service.isMongos()) {
          expect(databaseNames).to.not.contain('local');
        } else {
          expect(databaseNames).to.contain('local');
        }
        expect(databaseNames).to.contain('data-service');

        expect(databases[0]).to.include.keys(['name', 'sizeOnDisk', 'empty']);
        done();
      });
    });
  });

  describe('#createCollection', function () {
    after(function (done) {
      mongoClient.db().dropCollection('foo', {}, function (error) {
        assert.equal(null, error);
        done();
      });
    });

    it('creates a new collection', function (done) {
      const options = {};
      service.createCollection('data-service.foo', options, function (error) {
        assert.equal(null, error);
        service.listCollections('data-service', {}, function (err, items) {
          assert.equal(null, err);
          // For <3.2 system.indexes is returned with listCollections
          expect(items.length).to.equal(2);
          expect(items[0]).to.include.keys(['name', 'options']);
          expect(items[1]).to.include.keys(['name', 'options']);
          expect(items[0].options).to.deep.equal({});
          expect(items[1].options).to.deep.equal({});
          if (items[0].name === 'foo') {
            expect(items[1].name).to.equal('test');
          } else if (items[0].name === 'test') {
            expect(items[1].name).to.equal('foo');
          } else {
            assert(
              false,
              'Collection returned from listCollections has incorrect name'
            );
          }
          done();
        });
      });
    });
  });

  describe('#createIndex', function () {
    after(function (done) {
      const testCollection = mongoClient.db().collection('test');
      testCollection.dropIndex('a_1', {}, function () {
        testCollection.dropIndex('b_1', {}, function () {
          testCollection.dropIndex('a_-1_b_1', {}, function () {
            done();
          });
        });
      });
    });

    context('when options are provided', function () {
      it('creates a new index with the provided options', function (done) {
        const namespace = 'data-service.test';
        const spec = { a: 1 };
        const options = { unique: true };
        service.createIndex(namespace, spec, options, function (error) {
          assert.equal(null, error);
          service.indexes(namespace, {}, function (err, indexes) {
            assert.equal(null, err);
            expect(indexes.length).to.equal(2);
            done();
          });
        });
      });
    });

    context('when no options are provided', function () {
      it('creates a new single index', function (done) {
        const namespace = 'data-service.test';
        const spec = { b: 1 };
        const options = {};
        service.createIndex(namespace, spec, options, function (error) {
          assert.equal(null, error);
          service.indexes(namespace, {}, function (err, indexes) {
            assert.equal(null, err);
            expect(indexes.length).to.equal(3);
            done();
          });
        });
      });

      it('creates a new compound index', function (done) {
        const namespace = 'data-service.test';
        const spec = { a: -1, b: 1 };
        const options = {};
        service.createIndex(namespace, spec, options, function (error) {
          assert.equal(null, error);
          service.indexes(namespace, {}, function (err, indexes) {
            assert.equal(null, err);
            expect(indexes.length).to.equal(4);
            done();
          });
        });
      });
    });
  });

  describe('#instance', function () {
    it('returns the instance', function (done) {
      service.instance({}, function (err, instance) {
        assert.equal(null, err);
        expect(instance._id).to.not.equal(undefined);
        expect(instance.databases[0]._id).to.not.equal(undefined);
        expect(instance.genuineMongoDB).to.deep.equal({
          isGenuine: true,
          dbType: 'mongodb',
        });
        expect(instance.dataLake).to.deep.equal({
          isDataLake: false,
          version: null,
        });
        done();
      });
    });
  });

  describe('#indexes', function () {
    it('returns the indexes', function (done) {
      service.indexes('data-service.test', {}, function (err, indexes) {
        assert.equal(null, err);
        expect(indexes[0].name).to.equal('_id_');
        expect(indexes[0].size).to.be.a('number');
        done();
      });
    });
  });

  describe('#insertOne', function () {
    after(function (done) {
      helper.deleteTestDocuments(mongoClient, function () {
        done();
      });
    });

    it('inserts the document into the collection', function (done) {
      service.insertOne(
        'data-service.test',
        {
          a: 500,
        },
        {},
        function (err) {
          assert.equal(null, err);
          service.find(
            'data-service.test',
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
    after(function (done) {
      helper.deleteTestDocuments(mongoClient, function () {
        done();
      });
    });

    it('inserts the documents into the collection', function (done) {
      service.insertMany(
        'data-service.test',
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
          service.find(
            'data-service.test',
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
    before(function (done) {
      helper.insertTestDocuments(mongoClient, function () {
        done();
      });
    });

    after(function (done) {
      helper.deleteTestDocuments(mongoClient, function () {
        done();
      });
    });

    it('returns a cursor of sampled documents', async function () {
      const docs = await service.sample('data-service.test').toArray();
      expect(docs.length).to.equal(2);
    });

    it('allows to pass a query', async function () {
      const docs = await service
        .sample('data-service.test', {
          query: { a: 1 },
        })
        .toArray();
      expect(docs.length).to.equal(1);
      expect(docs[0]).to.haveOwnProperty('_id');
      expect(docs[0].a).to.equal(1);
    });

    it('allows to pass a projection', async function () {
      const docs = await service
        .sample('data-service.test', {
          fields: {
            a: 1,
            _id: 0,
          },
        })
        .toArray();

      expect(docs).to.deep.include.members([{ a: 1 }, { a: 2 }]);
    });

    it('allows to set a sample size', async function () {
      const docs = await service
        .sample('data-service.test', {
          size: 1,
        })
        .toArray();

      expect(docs.length).to.equal(1);
    });

    it('always sets default sample size and allowDiskUse: true', function () {
      sandbox.spy(service, 'aggregate');
      service.sample('db.coll');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.aggregate).to.have.been.calledWith(
        'db.coll',
        [{ $sample: { size: 1000 } }],
        { allowDiskUse: true }
      );
    });

    it('allows to pass down aggregation options to the driver', function () {
      sandbox.spy(service, 'aggregate');
      service.sample(
        'db.coll',
        {},
        {
          maxTimeMS: 123,
          session: undefined,
          raw: true,
        }
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.aggregate).to.have.been.calledWith(
        'db.coll',
        [{ $sample: { size: 1000 } }],
        { allowDiskUse: true, maxTimeMS: 123, session: undefined, raw: true }
      );
    });

    it('allows to override allowDiskUse', function () {
      sandbox.spy(service, 'aggregate');
      service.sample(
        'db.coll',
        {},
        {
          allowDiskUse: false,
        }
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.aggregate).to.have.been.calledWith(
        'db.coll',
        [{ $sample: { size: 1000 } }],
        { allowDiskUse: false }
      );
    });
  });

  describe('#updateOne', function () {
    after(function (done) {
      helper.deleteTestDocuments(mongoClient, function () {
        done();
      });
    });

    it('updates the document', function (done) {
      service.insertOne(
        'data-service.test',
        {
          a: 500,
        },
        {},
        function (err) {
          assert.equal(null, err);
          service.updateOne(
            'data-service.test',
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
              service.find(
                'data-service.test',
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
      const topology = service.getLastSeenTopology();

      expect(topology).to.not.be.null;
      expect(topology!.servers.has('127.0.0.1:27018')).to.equal(true);

      expect(topology).to.deep.include({
        compatible: true,
        heartbeatFrequencyMS: 10000,
        localThresholdMS: 15,
        logicalSessionTimeoutMinutes: 30,
        stale: false,
        type: 'Single',
      });
    });

    it("it returns null when a topology description event hasn't yet occured", function () {
      const testService = new DataService(helper.connection);
      expect(testService.getLastSeenTopology()).to.equal(null);
    });
  });

  describe('#updateMany', function () {
    after(function (done) {
      helper.deleteTestDocuments(mongoClient, function () {
        done();
      });
    });

    it('updates the documents', function (done) {
      service.insertMany(
        'data-service.test',
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
          service.updateMany(
            'data-service.test',
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
              service.find(
                'data-service.test',
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
    before(function (done) {
      helper.insertTestDocuments(mongoClient, function () {
        done();
      });
    });

    after(function (done) {
      helper.deleteTestDocuments(mongoClient, function () {
        done();
      });
    });

    it('creates a new view', function (done) {
      service.createView(
        'myView',
        'data-service.test',
        [{ $project: { a: 0 } }],
        {},
        function (err) {
          if (err) return done(err);
          done();
        }
      );
    });

    it('returns documents from the view', function (done) {
      service.find('data-service.myView', {}, {}, function (err, docs) {
        if (err) return done(err);

        assert.equal(docs.length, 2);
        assert.strictEqual(docs[0].a, undefined);
        assert.strictEqual(docs[1].a, undefined);
        done();
      });
    });

    it('updates the view', function (done) {
      service.updateView(
        'myView',
        'data-service.test',
        [{ $project: { a: 1 } }],
        {},
        function (err) {
          if (err) return done(err);
          done();
        }
      );
    });

    it('returns documents from the updated', function (done) {
      service.find('data-service.myView', {}, {}, function (err, docs) {
        if (err) return done(err);

        assert.equal(docs.length, 2);
        assert.strictEqual(docs[0].a, 1);
        assert.strictEqual(docs[1].a, 2);
        done();
      });
    });

    it('drops the view', function (done) {
      service.dropView('data-service.myView', done);
    });

    it('returns 0 documents because the view has been dropped', function (done) {
      service.count('data-service.myView', {}, {}, function (err, _count) {
        if (err) return done(err);

        assert.equal(_count, 0);
        done();
      });
    });
  });

  describe('#connect', function () {
    context('when mocking connection-model', function () {
      after(function () {
        mock.stop('mongodb-connection-model');
      });

      it('does not allow to connect twice without disonnecting first', function (done) {
        mock('./legacy-connect', mockedConnectionModel());

        const MockedDataService = mock.reRequire('./data-service');
        const mockedService: DataService = new MockedDataService(
          helper.connection
        );

        mockedService.connect(() => {
          // pass
        });
        mockedService.connect((err: any) => {
          expect(err).to.be.instanceOf(Error);
          expect(err)
            .to.have.property('message')
            .match(
              /Connect method has been called more than once without disconnecting/
            );

          done();
        });
      });

      it('sets .connectionOptions after successful connection', function (done) {
        mock('./legacy-connect', mockedConnectionModel());

        const MockedDataService = mock.reRequire('./data-service');
        const mockedService: DataService = new MockedDataService(
          helper.connection
        );

        expect(mockedService.getMongoClientConnectionOptions()).to.be.undefined;

        mockedService.connect(function () {
          expect(mockedService.getMongoClientConnectionOptions()).to.deep.equal(
            {
              url: 'mongodb://127.0.0.1:27018/data-service?readPreference=primary&ssl=false',
              options: {
                readPreference: 'primary',
                useNewUrlParser: true,
                useUnifiedTopology: true,
              },
            }
          );
          done();
        });
      });

      it('sets .isMongos to true when topology is sharded', function (done) {
        mock(
          './legacy-connect',
          mockedConnectionModel(mockedTopologyDescription('Sharded'))
        );

        const MockedDataService = mock.reRequire('./data-service');
        const mockedService: DataService = new MockedDataService(
          helper.connection
        );

        mockedService.connect(function () {
          expect(mockedService.isMongos()).to.be.true;
          done();
        });
      });

      it('sets .isMongos to false when topology is not sharded', function (done) {
        mock('./legacy-connect', mockedConnectionModel());

        const MockedDataService = mock.reRequire('./data-service');
        const mockedService: DataService = new MockedDataService(
          helper.connection
        );

        mockedService.connect(function () {
          expect(mockedService.isMongos()).to.be.false;
          done();
        });
      });
    });
  });

  describe('#disconnect', function () {
    context('when mocking connection-model', function () {
      after(function () {
        mock.stop('mongodb-connection-model');
      });

      it('should close tunnel before calling disconnect callback', function (done) {
        mock('./legacy-connect', mockedConnectionModel());

        const MockedDataService = mock.reRequire('./data-service');
        const mockedService: DataService = new MockedDataService(
          helper.connection
        );

        mockedService.connect(() => {
          const closeSpy = sandbox.spy((mockedService as any)._tunnel, 'close');

          const disconnectCallbackSpy = sandbox.spy(() => {
            try {
              expect(closeSpy).to.have.been.calledOnce;
              expect(closeSpy).to.have.been.calledBefore(disconnectCallbackSpy);
              done();
            } catch (err) {
              done(err);
            }
          });

          mockedService.disconnect(disconnectCallbackSpy);
        });
      });
    });
  });

  // describe('#collectionDetail', function () {
  //   it('returns the collection details', function (done) {
  //     service._collectionDetail('data-service.test', function (err, coll) {
  //       assert.equal(null, err);
  //       expect(coll.ns).to.equal('data-service.test');
  //       expect(coll.index_count).to.equal(1);
  //       done();
  //     });
  //   });
  // });

  // describe('#collectionNames', function () {
  //   it('returns the collection names', function (done) {
  //     service._collectionNames('data-service', function (err, names) {
  //       assert.equal(null, err);
  //       expect(names[0]).to.not.equal(undefined);
  //       done();
  //     });
  //   });
  // });

  describe('#collections', function () {
    context('when no readonly views exist', function () {
      it('returns the collections', function (done) {
        service.collections('data-service', function (err, collections) {
          assert.equal(null, err);
          expect(collections[0].name).to.not.equal(undefined);
          done();
        });
      });
    });

    context('when readonly views exist', function () {
      after(function (done) {
        service.dropCollection('data-service.readonlyfoo', function () {
          service.dropCollection('data-service.system.views', function () {
            done();
          });
        });
      });

      it('returns empty stats for the readonly views', function (done) {
        const pipeline = [{ $match: { name: 'test' } }];
        const options = { viewOn: 'test', pipeline: pipeline };
        service.createCollection(
          'data-service.readonlyfoo',
          options,
          function (error) {
            if (error) {
              assert.notEqual(null, error.message);
              done();
            } else {
              service.collections('data-service', function (err, collections) {
                assert.equal(null, err);
                expect(collections[0].name).to.not.equal(undefined);
                done();
              });
            }
          }
        );
      });
    });
  });

  describe('#currentOp', function () {
    it('returns an object with the currentOp', function (done) {
      service.currentOp(true, function (err, result) {
        assert.equal(null, err);
        expect(result.inprog).to.not.equal(undefined); // TODO: are these tests enough?
        done();
      });
    });
  });

  describe('#serverstats', function () {
    it('returns an object with the serverstats', function (done) {
      service.serverstats(function (err, result) {
        assert.equal(null, err);
        expect(result.ok).to.equal(1);
        done();
      });
    });
  });

  describe('#top', function () {
    it('returns an object with the results from top', function (done) {
      service.top(function (err, result) {
        if (service.isMongos()) {
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
  //     service.databaseDetail('data-service', function (err, database) {
  //       assert.equal(null, err);
  //       expect(database._id).to.equal('data-service');
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
        service.explain(
          'data-service.test',
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
      const session = service.startSession();
      expect(session.constructor.name).to.equal('ClientSession');

      // used by killSession, must be a bson UUID in order to work
      expect(session.id!.id._bsontype).to.equal('Binary');
      expect(session.id!.id.sub_type).to.equal(4);
    });
  });

  describe('#killSession', function () {
    it('does not throw if kill a non existing session', async function () {
      const session = service.startSession();
      await service.killSession(session);
    });

    it('kills a command with a session', async function () {
      const commandSpy = sinon.spy();
      sandbox.replace(
        (service as any)._client,
        'db',
        () =>
          ({
            command: commandSpy,
          } as any)
      );

      const session = service.startSession();
      await service.killSession(session);

      expect(commandSpy.args[0][0]).to.deep.equal({
        killSessions: [session.id],
      });
    });
  });
});
