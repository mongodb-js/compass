var helper = require('./helper');

var assert = helper.assert;
var expect = helper.expect;
var eventStream = helper.eventStream;
var Connection = require('mongodb-connection-model');
var ObjectId = require('bson').ObjectId;

var NativeClient = require('../lib/native-client');

describe('NativeClient', function() {
  var client = new NativeClient(helper.connection);

  before(require('mongodb-runner/mocha/before')({
    port: 27018
  }));

  after(require('mongodb-runner/mocha/after')({
    port: 27018
  }));

  before(function(done) {
    client.connect(done);
  });

  describe('#connect', function() {
    context('when an invalid connection was provided', function() {
      var badConnection =
        new Connection({ hostname: '127.0.0.1', port: 27050, ns: 'data-service' });
      var badClient = new NativeClient(badConnection);
      var message = 'MongoDB not running on the provided host and port';
      it('maps the error message', function(done) {
        badClient.connect(function(error) {
          expect(error.message).to.equal(message);
          done();
        });
      });
    });
  });

  describe('#new', function() {
    it('sets the model on the instance', function() {
      expect(client.model).to.equal(helper.connection);
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
        client.find('data-service.test', { a: 1 }, {}, function(error, docs) {
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
        client.find('data-service.test', {}, { skip: 1 }, function(error, docs) {
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
    it('returns the collections', function(done) {
      client.collections('data-service', function(err, collections) {
        assert.equal(null, err);
        expect(collections[0].name).to.not.equal(undefined);
        done();
      });
    });
  });

  describe('#collectionStats', function() {
    it('returns an object with the collection stats', function(done) {
      client.collectionStats('data-service', 'test', function(err, stats) {
        assert.equal(null, err);
        expect(stats.name).to.equal('test');
        done();
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

  describe('#count', function() {
    context('when a filter is provided', function() {
      it('returns a count for the matching documents', function(done) {
        client.count('data-service.test', { a: 1 }, {}, function(error, count) {
          assert.equal(null, error);
          expect(count).to.equal(0);
          done();
        });
      });
    });
  });

  describe('#explain', function() {
    context('when a filter is provided', function() {
      it('returns an explain object for the provided filter', function(done) {
        client.explain('data-service.test', { a: 1 }, {}, function(error, explanation) {
          assert.equal(null, error);
          expect(explanation).to.be.an('object');
          done();
        });
      });
    });
  });

  describe('#deleteOne', function() {
    it('deletes the document from the collection', function(done) {
      client.insertOne('data-service.test', { a: 500 }, {}, function(err) {
        assert.equal(null, err);
        client.deleteOne('data-service.test', { a: 500 }, {}, function(er) {
          assert.equal(null, er);
          client.find('data-service.test', { a: 500 }, {}, function(error, docs) {
            assert.equal(null, error);
            expect(docs.length).to.equal(0);
            done();
          });
        });
      });
    });
  });

  describe('#deleteMany', function() {
    it('deletes the documents from the collection', function(done) {
      client.insertMany('data-service.test', [{ a: 500 }, { a: 500 }], {}, function(err) {
        assert.equal(null, err);
        client.deleteMany('data-service.test', { a: 500 }, {}, function(er) {
          assert.equal(null, er);
          client.find('data-service.test', { a: 500 }, {}, function(error, docs) {
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
        client.insertOne('data-service.test', { _id: id, a: 500 }, {}, function(err) {
          assert.equal(null, err);
          client.findOneAndReplace(
            'data-service.test',
            { _id: id },
            { b: 5 },
            { returnOriginal: false },
            function(error, result) {
              expect(error).to.equal(null);
              expect(result._id).to.deep.equal(id);
              expect(result.b).to.equal(5);
              expect(result.hasOwnProperty('a')).to.equal(false);
              done();
            }
          );
        });
      });
    });

    context('when an error occurs', function() {
      var id = new ObjectId();

      it('returns the updated document', function(done) {
        client.insertOne('data-service.test', { _id: id, a: 500 }, {}, function(err) {
          assert.equal(null, err);
          client.findOneAndReplace(
            'data-service.test',
            { _id: id },
            { '$b': 5 },
            { returnOriginal: false },
            function(error) {
              expect(error.message).to.not.equal(null);
              done();
            }
          );
        });
      });
    });
  });

  describe('#disconnect', function() {
    after(function(done) {
      client.connect(done);
    });

    it('disconnects the database', function(done) {
      client.disconnect();
      client.count('data-service.test', {}, {}, function(error) {
        expect(error.message).to.equal('topology was destroyed');
        done();
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
        expect(instance._id).to.not.equal(undefined);
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
      client.insertOne('data-service.test', { a: 500 }, {}, function(err) {
        assert.equal(null, err);
        client.find('data-service.test', { a: 500 }, {}, function(error, docs) {
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
      client.insertMany('data-service.test', [{ a: 500 }, { a: 500 }], {}, function(err) {
        assert.equal(null, err);
        client.find('data-service.test', { a: 500 }, {}, function(error, docs) {
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
      client.insertOne('data-service.test', { a: 500 }, {}, function(err) {
        assert.equal(null, err);
        client.updateOne('data-service.test', { a: 500 }, { '$set': { a: 600 }}, {}, function(er) {
          assert.equal(null, er);
          client.find('data-service.test', { a: 600 }, {}, function(error, docs) {
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
      client.insertMany('data-service.test', [{ a: 500 }, { a: 500 }], {}, function(err) {
        assert.equal(null, err);
        client.updateMany('data-service.test', { a: 500 }, { '$set': { a: 600 }}, {}, function(er) {
          assert.equal(null, er);
          client.find('data-service.test', { a: 600 }, {}, function(error, docs) {
            assert.equal(null, error);
            expect(docs.length).to.equal(2);
            done();
          });
        });
      });
    });
  });
});
