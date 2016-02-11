var chai = require('chai');
var assert = require('assert');
var expect = chai.expect;

var NativeClient = require('../lib/native-client');
var Connection = require('mongodb-connection-model');

describe('DataService', function() {
  before(require('mongodb-runner/mocha/before')({ port: 27018 }));
  after(require('mongodb-runner/mocha/after')());

  var connection = new Connection({ hostname: '127.0.0.1', port: 27018, ns: 'data-service' });
  var client = new NativeClient(connection);

  describe('#new', function() {
    it('sets the connection on the instance', function() {
      expect(client.connection).to.equal(connection);
    });
  });

  describe('#find', function() {
    before(function() {
      var collection = client.database.collection('test');
      collection.insertMany([{ a: 1 }, { a: 2 }]);
    });

    after(function() {
      var collection = client.database.collection('test');
      collection.deleteMany();
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
});
