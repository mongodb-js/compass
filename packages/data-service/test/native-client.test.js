var helper = require('./helper');

var assert = helper.assert;
var expect = helper.expect;

var NativeClient = require('../lib/native-client');

describe('NativeClient', function() {
  var client = new NativeClient(helper.connection);

  before(require('mongodb-runner/mocha/before')({ port: 27018 }));
  after(require('mongodb-runner/mocha/after')());

  before(function(done) {
    client.connect(done);
  });

  describe('#new', function() {
    it('sets the model on the instance', function() {
      expect(client.model).to.equal(helper.connection);
    });
  });

  describe('#find', function() {
    before(function() {
      helper.insertTestDocuments(client);
    });

    after(function() {
      helper.deleteTestDocuments(client);
    });

    context('when a filter is provided', function() {
      it('returns a cursor for the matching documents', function(done) {
        client.find('data-service.test', { a: 1 }).toArray(function(error, docs) {
          assert.equal(null, error);
          expect(docs.length).to.equal(1);
          done();
        });
      });
    });

    context('when no filter is provided', function() {
      it('returns a cursor for all documents', function(done) {
        client.find('data-service.test').toArray(function(error, docs) {
          assert.equal(null, error);
          expect(docs.length).to.equal(2);
          done();
        });
      });
    });

    context('when options are provided', function() {
      it('returns a cursor for the documents', function(done) {
        client.find('data-service.test', {}, { skip: 1 }).toArray(function(error, docs) {
          assert.equal(null, error);
          expect(docs.length).to.equal(1);
          done();
        });
      });
    });
  });

  describe('#collectionNames', function() {
    it('returns the collection names', function(done) {
      client.collectionNames('data-service', function(err, names) {
        assert.equal(null, err);
        expect(names[0]).to.equal('test');
        done();
      });
    });
  });

  describe('#collections', function() {
    it('returns the collections', function(done) {
      client.collections('data-service', function(err, collections) {
        assert.equal(null, err);
        expect(collections[0].name).to.equal('test');
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

  describe('#databaseDetail', function() {
    it('returns the database details', function(done) {
      client.databaseDetail('data-service', function(err, database) {
        assert.equal(null, err);
        expect(database._id).to.equal('data-service');
        expect(database.stats.document_count).to.equal(0);
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
});
