/* eslint indent:0 */
var helper = require('./helper');
var assert = helper.assert;
var expect = helper.expect;
var eventStream = helper.eventStream;
var ObjectId = require('bson').ObjectId;
var mock = require('mock-require');
const EventEmitter = require('events');

var NativeClient = require('../lib/native-client');

describe('NativeClient', function() {
  this.slow(10000);
  this.timeout(20000);
  var client = new NativeClient(helper.connection);

  before(function(done) {
    const callback = (err, result) => {
      const adminDb = client.database.admin();
      adminDb.addUser('dba-admin', 'password', { roles: ['root'] });
      done(err, result);
    };
    client.connect(callback);
  });
  after(function(done) {
    client.disconnect(done);
  });

  describe('#connect', function() {
    context('when mocking connection-model', function() {
      function mockedTopologyDescription(
        topologyType = 'Standalone',
        serverType = 'Single'
      ) {
        return {
          type: topologyType,
          servers: new Map([['127.0.0.1:27017', { type: serverType }]])
        };
      }

      /*
       * pretends to be a connection-model providing every function call
       * required in NativeClient#connect, but returns topology and connection
       * params of our choice
       */
      function mockedConnectionModel(topologyDescription, connectionOptions) {
        const _topologyDescription =
          topologyDescription || mockedTopologyDescription();

        const _connectionOptions = connectionOptions || {
          url: 'mongodb://127.0.0.1:27018/data-service?readPreference=primary&ssl=false',
          options: {
            connectWithNoPrimary: true,
            readPreference: 'primary',
            useNewUrlParser: true,
            useUnifiedTopology: true
          }
        };

        return {
          connect(_model, setupListeners, cb) {
            const mockedClient = new EventEmitter();
            mockedClient.db = () => {};
            setupListeners(mockedClient);
            mockedClient.emit('topologyDescriptionChanged', {
              newDescription: _topologyDescription
            });
            cb(null, mockedClient, _connectionOptions);
          }
        };
      }

      after(function() {
        mock.stop('mongodb-connection-model');
      });

      it('sets .connectionOptions after successful connection', function(done) {
        mock(
          'mongodb-connection-model',
          mockedConnectionModel()
        );

        var MockedNativeClient = mock.reRequire('../lib/native-client');
        var mockedClient = new MockedNativeClient(helper.connection);

        expect(mockedClient.connectionOptions).to.be.null;

        mockedClient.connect(function() {
          expect(mockedClient.connectionOptions).to.deep.equal({
            url: 'mongodb://127.0.0.1:27018/data-service?readPreference=primary&ssl=false',
            options: {
              connectWithNoPrimary: true,
              readPreference: 'primary',
              useNewUrlParser: true,
              useUnifiedTopology: true
            }
          });
          done();
        });
      });

      it('sets .isMongos to true when topology is sharded', function(done) {
        mock(
          'mongodb-connection-model',
          mockedConnectionModel(mockedTopologyDescription('Sharded'))
        );

        var MockedNativeClient = mock.reRequire('../lib/native-client');
        var mockedClient = new MockedNativeClient(helper.connection);

        mockedClient.connect(function() {
          expect(mockedClient.isMongos).to.be.true;
          done();
        });
      });

      it('sets .isMongos to false when topology is not sharded', function(done) {
        mock('mongodb-connection-model', mockedConnectionModel());

        var MockedNativeClient = mock.reRequire('../lib/native-client');
        var mockedClient = new MockedNativeClient(helper.connection);

        mockedClient.connect(function() {
          expect(mockedClient.isMongos).to.be.false;
          done();
        });
      });

      it('sets .isWritable to true when the node is a primary replset member', function(done) {
        mock(
          'mongodb-connection-model',
          mockedConnectionModel(
            mockedTopologyDescription('ReplicaSetWithPrimary')
          )
        );

        var MockedNativeClient = mock.reRequire('../lib/native-client');
        var mockedClient = new MockedNativeClient(helper.connection);

        mockedClient.connect(function() {
          expect(mockedClient.isWritable).to.be.true;
          done();
        });
      });

      it('sets .isWritable to false when the node is a secondary replset member', function(done) {
        mock(
          'mongodb-connection-model',
          mockedConnectionModel(
            mockedTopologyDescription('Single', 'RSSecondary')
          )
        );

        var MockedNativeClient = mock.reRequire('../lib/native-client');
        var mockedClient = new MockedNativeClient(helper.connection);

        mockedClient.connect(function() {
          expect(mockedClient.isWritable).to.be.false;
          done();
        });
      });

      it('sets .isWritable to true when the node is a mongos', function(done) {
        mock(
          'mongodb-connection-model',
          mockedConnectionModel(mockedTopologyDescription('Single', 'Mongos'))
        );

        var MockedNativeClient = mock.reRequire('../lib/native-client');
        var mockedClient = new MockedNativeClient(helper.connection);

        mockedClient.connect(function() {
          expect(mockedClient.isWritable).to.be.true;
          done();
        });
      });
    });
  });

  describe('#command', function() {
    it('executes the command', function(done) {
      client.command('data-service', { ping: 1 }, function(error, result) {
        assert.equal(null, error);
        expect(result.ok).to.equal(1);
        done();
      });
    });
  });

  describe('#aggregate', function() {
    before(function(done) {
      var collection = client.database.collection('test');
      collection.insertMany(
        [{title: 'this is my title', author: 'bob', posted: new Date(),
          pageViews: 5, tags: [ 'fun', 'good', 'fun' ], other: { foo: 5 },
          comments: [
            { author: 'joe', text: 'this is cool' }, { author: 'sam', text: 'this is bad' }
          ]},
          {x: 1, y: 2},
          {x: 3, y: 4}], done);
    });

    after(function(done) {
      helper.deleteTestDocuments(client, function() {
        done();
      });
    });

    context('with callback', function() {
      it('pipeline with $match', function(done) {
        client.aggregate('data-service.test',
          [{$match: {}}, {$group: {_id: '$x', total: {$sum: '$x'} } }],
          function(error, result) {
            assert.equal(null, error);
            result.toArray((err, r) => {
              assert.equal(null, err);
              expect(r.length).to.equal(3);
              done();
            });
          });
      });
      it('pipeline with $unwind, $group, $project', function(done) {
        client.aggregate('data-service.test',
          [
            {
              $project: {
                author: 1,
                tags: 1
              }
            },
            {
              $unwind: '$tags'
            },
            {
              $group: {
                _id: { tags: '$tags' },
                authors: { $addToSet: '$author' }
              }
            }
          ],
          {},
          function(error, result) {
            assert.equal(null, error);
            result.toArray((err) => {
              assert.equal(null, err);
              done();
            });
          });
      });
    });
    context('with cursor', function() {
      it('pipeline with $match', function(done) {
        var count = 0;
        client.aggregate('data-service.test',
          [{$match: {}}, {$group: {_id: '$x', total: {$sum: '$x'} } }],
          {'cursor': { batchSize: 10000 }}
        ).forEach(function() { count++; }, function(err) {
          assert.equal(null, err);
          expect(count).to.equal(3);
          done();
        });
      });
      it('pipeline with $unwind, $group, $project', function(done) {
        client.aggregate('data-service.test',
          [{$project: {
            author: 1,
            tags: 1
          }},
            { $unwind: '$tags' }, {$group: { _id: {tags: '$tags'}, authors: {$addToSet: '$author' }}}],
          {cursor: {batchSize: 100}}).toArray(function(error) {
            assert.equal(null, error);
            done();
          });
      });
      it('errors when given a bad option', function(done) {
        try {
          client.aggregate('data-service.test',
            [{$project: {
              author: 1,
              tags: 1
            }},
            { $unwind: '$tags'},
            { $group: {_id: {tags: '$tags'}, authors: {$addToSet: '$author'}}}
            ],
            { cursor: 1});
        } catch (err) {
          expect(err.message).to.equal('cursor options must be an object');
          done();
        }
      });
    });
  });

  describe('#find', function() {
    before(function(done) {
      helper.insertTestDocuments(client, function() {
        done();
      });
    });

    after(function(done) {
      helper.deleteTestDocuments(client, function() {
        done();
      });
    });

    context('when a filter is provided', function() {
      it('returns a cursor for the matching documents', function(done) {
        client.find('data-service.test', {
          a: 1
        }, {}, function(error, docs) {
          assert.equal(null, error);
          expect(docs.length).to.equal(1);
          done();
        });
      });
    });

    context('when no filter is provided', function() {
      it('returns a cursor for all documents', function(done) {
        client.find('data-service.test', {}, {}, function(error, docs) {
          assert.equal(null, error);
          expect(docs.length).to.equal(2);
          done();
        });
      });
    });

    context('when options are provided', function() {
      it('returns a cursor for the documents', function(done) {
        client.find('data-service.test', {}, {
          skip: 1
        }, function(error, docs) {
          assert.equal(null, error);
          expect(docs.length).to.equal(1);
          done();
        });
      });
    });
  });

  describe('#fetch', function() {
    before(function(done) {
      helper.insertTestDocuments(client, function() {
        done();
      });
    });

    after(function(done) {
      helper.deleteTestDocuments(client, function() {
        done();
      });
    });

    context('when a filter is provided', function() {
      it('returns a cursor for the matching documents', function(done) {
        const cursor = client.fetch('data-service.test', { a: 1 }, {});
        cursor.toArray(function(error, docs) {
          assert.equal(null, error);
          expect(docs.length).to.equal(1);
          done();
        });
      });
    });

    context('when no filter is provided', function() {
      it('returns a cursor for all documents', function(done) {
        const cursor = client.fetch('data-service.test', {}, {});
        cursor.toArray(function(error, docs) {
          assert.equal(null, error);
          expect(docs.length).to.equal(2);
          done();
        });
      });
    });

    context('when options are provided', function() {
      it('returns a cursor for the documents', function(done) {
        const cursor = client.fetch('data-service.test', {}, { skip: 1 });
        cursor.toArray(function(error, docs) {
          assert.equal(null, error);
          expect(docs.length).to.equal(1);
          done();
        });
      });
    });
  });

  describe('#collectionDetail', function() {
    it('returns the collection details', function(done) {
      client.collectionDetail('data-service.test', function(err, coll) {
        assert.equal(null, err);
        expect(coll.ns).to.equal('data-service.test');
        expect(coll.index_count).to.equal(1);
        done();
      });
    });
  });

  describe('#shardedCollectionDetail', function() {
    it('returns the collection details', function(done) {
      client.shardedCollectionDetail('data-service.test', function(err, coll) {
        assert.equal(null, err);
        expect(coll.ns).to.equal('data-service.test');
        expect(coll.index_count).to.equal(1);
        done();
      });
    });
  });

  describe('#updateCollection', function() {
    it('returns the update result', function(done) {
      client.updateCollection('data-service.test', {}, function(err, result) {
        assert.equal(null, err);
        expect(result.ok).to.equal(1.0);
        done();
      });
    });
  });

  describe('#collectionNames', function() {
    it('returns the collection names', function(done) {
      client.collectionNames('data-service', function(err, names) {
        assert.equal(null, err);
        expect(names[0]).to.not.equal(undefined);
        done();
      });
    });
  });

  describe('#collections', function() {
    context('when no readonly views exist', function() {
      it('returns the collections', function(done) {
        client.collections('data-service', function(err, collections) {
          assert.equal(null, err);
          expect(collections[0].name).to.not.equal(undefined);
          done();
        });
      });
    });

    context('when readonly views exist', function() {
      after(function(done) {
        client.dropCollection('data-service.readonlyfoo', function() {
          client.dropCollection('data-service.system.views', function() {
            done();
          });
        });
      });

      it('returns empty stats for the readonly views', function(done) {
        const pipeline = [{ '$match': { name: 'test' }}];
        const options = { viewOn: 'test', pipeline: pipeline };
        client.createCollection('data-service.readonlyfoo', options, function(error) {
          if (error) {
            assert.notEqual(null, error.message);
            done();
          } else {
            client.collections('data-service', function(err, collections) {
              assert.equal(null, err);
              expect(collections[0].name).to.not.equal(undefined);
              done();
            });
          }
        });
      });
    });
  });

  describe('#collectionStats', function() {
    context('when the collection is not a system collection', function() {
      it('returns an object with the collection stats', function(done) {
        client.collectionStats('data-service', 'test', function(err, stats) {
          assert.equal(null, err);
          expect(stats.name).to.equal('test');
          done();
        });
      });

      // collectionStats() used to provide a `readonly: <boolean>` key, but
      // since the underlying database command does not provide one, the value
      // was bogus. Make sure that we're not accidentally providing an incorrect
      // value.
      it('does not provide a readonly key', function(done) {
        client.collectionStats('data-service', 'test', function(err, stats) {
          assert.equal(null, err);
          expect(stats.name).to.equal('test');
          expect(Object.keys(stats)).to.not.include('readonly');
          done();
        });
      });
    });
  });

  describe('#currentOp', function() {
    it('returns an object with the currentOp', function(done) {
      client.currentOp(true, function(err, result) {
        assert.equal(null, err);
        expect(result.inprog).to.not.equal(undefined); // TODO: are these tests enough?
        done();
      });
    });
  });

  describe('#serverStats', function() {
    it('returns an object with the serverStats', function(done) {
      client.serverStats(function(err, result) {
        assert.equal(null, err);
        expect(result.ok).to.equal(1);
        done();
      });
    });
  });

  describe('#top', function() {
    it('returns an object with the results from top', function(done) {
      client.top(function(err, result) {
        if (client.isMongos) {
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

  describe('#databaseDetail', function() {
    it('returns the database details', function(done) {
      client.databaseDetail('data-service', function(err, database) {
        assert.equal(null, err);
        expect(database._id).to.equal('data-service');
        expect(database.stats.document_count).to.not.equal(undefined);
        done();
      });
    });
  });

  describe('#databaseStats', function() {
    context('when the user is authorized', function() {
      it('returns an object with the db stats', function(done) {
        client.databaseStats('native-service', function(err, stats) {
          assert.equal(null, err);
          expect(stats.document_count).to.equal(0);
          done();
        });
      });
    });

    context('when the user is not authorized', function() {
      it('passes an error to the callback');
    });
  });

  describe('#estimatedCount', function() {
    it('returns a count for the collection', function(done) {
      client.estimatedCount('data-service.test', {}, function(error, count) {
        assert.equal(null, error);
        expect(count).to.equal(0);
        done();
      });
    });
  });

  describe('#count', function() {
    context('when a filter is provided', function() {
      it('returns a count for the matching documents', function(done) {
        client.count('data-service.test', {
          a: 1
        }, {}, function(error, count) {
          assert.equal(null, error);
          expect(count).to.equal(0);
          done();
        });
      });
    });

    context('when max timeout is provided', function() {
      context('when the count times out', function() {
        before(function(done) {
          client.insertOne('data-service.test', { a: 500 }, {}, done);
        });

        after(function(done) {
          client.deleteMany('data-service.test', {}, {}, done);
        });

        it('does not throw the error', function(done) {
          client.count('data-service.test', {
            '$where': 'function() { sleep(5500); return true; }'
          }, { maxTimeMS: 5000 }, function(error) {
            expect(error).to.not.equal(null);
            done();
          });
        });
      });
    });
  });

  describe('#createCollection', function() {
    after(function(done) {
      client.database.dropCollection('foo', {}, function(error) {
        assert.equal(null, error);
        done();
      });
    });

    it('creates a new collection', function(done) {
      const dbName = 'data-service';
      var options = {};
      client.createCollection(`${dbName}.foo`, options, function(error) {
        assert.equal(null, error);
        client.listCollections(dbName, {}, function(err, items) {
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
            assert(false, 'Collection returned from listCollections has incorrect name');
          }
          done();
        });
      });
    });
  });

  describe('#createIndex', function() {
    after(function(done) {
      var testCollection = client.database.collection('test');
      testCollection.dropIndex('a_1', {}, function() {
        testCollection.dropIndex('b_1', {}, function() {
          testCollection.dropIndex('a_-1_b_1', {}, function() {
            done();
          });
        });
      });
    });

    context('when options are provided', function() {
      it('creates a new index with the provided options', function(done) {
        const namespace = 'data-service.test';
        var spec = {a: 1};
        var options = {unique: true};
        client.createIndex(namespace, spec, options, function(error) {
          assert.equal(null, error);
          client.indexes(namespace, function(err, indexes) {
            assert.equal(null, err);
            expect(indexes.length).to.equal(2);
            done();
          });
        });
      });
    });

    context('when no options are provided', function() {
      it('creates a new single index', function(done) {
        const namespace = 'data-service.test';
        var spec = {b: 1};
        var options = {};
        client.createIndex(namespace, spec, options, function(error) {
          assert.equal(null, error);
          client.indexes(namespace, function(err, indexes) {
            assert.equal(null, err);
            expect(indexes.length).to.equal(3);
            done();
          });
        });
      });

      it('creates a new compound index', function(done) {
        const namespace = 'data-service.test';
        var spec = {a: -1, b: 1};
        var options = {};
        client.createIndex(namespace, spec, options, function(error) {
          assert.equal(null, error);
          client.indexes(namespace, function(err, indexes) {
            assert.equal(null, err);
            expect(indexes.length).to.equal(4);
            done();
          });
        });
      });
    });
  });

  describe('#explain', function() {
    context('when a filter is provided', function() {
      it('returns an explain object for the provided filter', function(done) {
        client.explain('data-service.test', {
          a: 1
        }, {}, function(error, explanation) {
          assert.equal(null, error);
          expect(explanation).to.be.an('object');
          done();
        });
      });
    });
  });

  describe('#deleteOne', function() {
    it('deletes the document from the collection', function(done) {
      client.insertOne('data-service.test', {
        a: 500
      }, {}, function(err) {
        assert.equal(null, err);
        client.deleteOne('data-service.test', {
          a: 500
        }, {}, function(er) {
          assert.equal(null, er);
          client.find('data-service.test', {
            a: 500
          }, {}, function(error, docs) {
            assert.equal(null, error);
            expect(docs.length).to.equal(0);
            done();
          });
        });
      });
    });
  });

  describe('#dropCollection', function() {
    before(function(done) {
      client.database.createCollection('bar', {}, function(error) {
        assert.equal(null, error);
        done();
      });
    });

    it('drops a collection', function(done) {
      const dbName = 'data-service';
      client.dropCollection(`${dbName}.bar`, function(error) {
        assert.equal(null, error);
        client.listCollections(dbName, {}, function(err, items) {
          assert.equal(null, err);
          expect(items).to.not.include({name: 'bar', options: {}});
          done();
        });
      });
    });
  });

  describe('#dropDatabase', function() {
    before(function(done) {
      client.client.db('mangoDB').createCollection('testing',
      {}, function(error) {
        assert.equal(null, error);
        done();
      });
    });

    it('drops a database', function(done) {
      client.dropDatabase('mangoDB', function(error) {
        assert.equal(null, error);
        client.listDatabases(function(err, dbs) {
          assert.equal(null, err);
          expect(dbs).to.not.have.property('name', 'mangoDB');
          done();
        });
      });
    });
  });

  describe('#dropIndex', function() {
    before(function(done) {
      client.database.collection('test').createIndex({
        a: 1
      }, {}, function(error) {
        assert.equal(null, error);
        done();
      });
    });

    it('removes an index from a collection', function(done) {
      const namespace = 'data-service.test';
      client.dropIndex(namespace, 'a_1', function(error) {
        assert.equal(null, error);
        client.indexes(namespace, function(err, indexes) {
          assert.equal(null, err);
          expect(indexes).to.not.have.property('name', 'a_1');
          done();
        });
      });
    });
  });

  describe('#deleteMany', function() {
    it('deletes the documents from the collection', function(done) {
      client.insertMany('data-service.test', [{
        a: 500
      }, {
        a: 500
      }], {}, function(err) {
        assert.equal(null, err);
        client.deleteMany('data-service.test', {
          a: 500
        }, {}, function(er) {
          assert.equal(null, er);
          client.find('data-service.test', {
            a: 500
          }, {}, function(error, docs) {
            assert.equal(null, error);
            expect(docs.length).to.equal(0);
            done();
          });
        });
      });
    });
  });

  describe('#findOneAndReplace', function() {
    after(function(done) {
      helper.deleteTestDocuments(client, function() {
        done();
      });
    });

    context('when no error occurs', function() {
      var id = new ObjectId();

      it('returns the updated document', function(done) {
        client.insertOne('data-service.test', {
          _id: id,
          a: 500
        }, {}, function(err) {
          assert.equal(null, err);
          client.findOneAndReplace(
            'data-service.test',
            {
              _id: id
            },
            {
              b: 5
            },
            {
              returnOriginal: false
            }, function(error, result) {
              expect(error).to.equal(null);
              expect(result._id.toString()).to.deep.equal(id.toString());
              expect(result.b).to.equal(5);
              expect(result.hasOwnProperty('a')).to.equal(false);
              done();
            }
          );
        });
      });
    });
  });

  describe('#indexes', function() {
    it('returns the indexes', function(done) {
      client.indexes('data-service.test', function(err, indexes) {
        assert.equal(null, err);
        expect(indexes[0].name).to.equal('_id_');
        done();
      });
    });
  });

  describe('#instance', function() {
    it('returns the instance', function(done) {
      client.instance(function(err, instance) {
        assert.equal(null, err);
        expect(instance.hostname).to.not.equal(undefined);
        expect(instance.port).to.equal(27018);
        expect(instance.databases[0]._id).to.not.equal(undefined);
        done();
      });
    });
  });

  describe('#insertOne', function() {
    after(function(done) {
      helper.deleteTestDocuments(client, function() {
        done();
      });
    });

    it('inserts the document into the collection', function(done) {
      client.insertOne('data-service.test', {
        a: 500
      }, {}, function(err) {
        assert.equal(null, err);
        client.find('data-service.test', {
          a: 500
        }, {}, function(error, docs) {
          assert.equal(null, error);
          expect(docs.length).to.equal(1);
          done();
        });
      });
    });
  });

  describe('#insertMany', function() {
    after(function(done) {
      helper.deleteTestDocuments(client, function() {
        done();
      });
    });

    it('inserts the documents into the collection', function(done) {
      client.insertMany('data-service.test', [{
        a: 500
      }, {
        a: 500
      }], {}, function(err) {
        assert.equal(null, err);
        client.find('data-service.test', {
          a: 500
        }, {}, function(error, docs) {
          assert.equal(null, error);
          expect(docs.length).to.equal(2);
          done();
        });
      });
    });
  });

  describe('#sample', function() {
    before(function(done) {
      helper.insertTestDocuments(client, function() {
        done();
      });
    });

    after(function(done) {
      helper.deleteTestDocuments(client, function() {
        done();
      });
    });

    context('when no filter is provided', function() {
      it('returns a stream of sampled documents', function(done) {
        var seen = 0;
        client.sample('data-service.test')
          .pipe(eventStream.through(function(doc) {
            seen++;
            this.emit('data', doc);
          }, function() {
            this.emit('end');
            expect(seen).to.equal(2);
            done();
          }));
      });
    });
  });

  /**
   * @see https://jira.mongodb.org/browse/INT-1294
   */
  describe('INT-1294: Collection name with `.`', () => {
    var ns = 'mydb.events.periodic';
    it('should return the correct databaseName', () => {
      expect(client._databaseName(ns)).to.equal('mydb');
    });

    it('should return the correct collectionName', () => {
      expect(client._collectionName(ns)).to.equal('events.periodic');
    });
  });

  describe('#updateOne', function() {
    after(function(done) {
      helper.deleteTestDocuments(client, function() {
        done();
      });
    });

    it('updates the document', function(done) {
      client.insertOne('data-service.test', {
        a: 500
      }, {}, function(err) {
        assert.equal(null, err);
        client.updateOne('data-service.test', {
          a: 500
        }, {
          $set: {
            a: 600
          }
        }, {}, function(er) {
          assert.equal(null, er);
          client.find('data-service.test', {
            a: 600
          }, {}, function(error, docs) {
            assert.equal(null, error);
            expect(docs.length).to.equal(1);
            done();
          });
        });
      });
    });
  });

  describe('#updateMany', function() {
    after(function(done) {
      helper.deleteTestDocuments(client, function() {
        done();
      });
    });

    it('updates the documents', function(done) {
      client.insertMany('data-service.test', [{
        a: 500
      }, {
        a: 500
      }], {}, function(err) {
        assert.equal(null, err);
        client.updateMany('data-service.test', {
          a: 500
        }, {
          $set: {
            a: 600
          }
        }, {}, function(er) {
          assert.equal(null, er);
          client.find('data-service.test', {
            a: 600
          }, {}, function(error, docs) {
            assert.equal(null, error);
            expect(docs.length).to.equal(2);
            done();
          });
        });
      });
    });
  });
});
