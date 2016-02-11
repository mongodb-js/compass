var helper = require('./helper');

var assert = helper.assert;
var expect = helper.expect;

var NativeClient = require('../lib/native-client');

describe('DataService', function() {
  var client = null;

  before(require('mongodb-runner/mocha/before')({ port: 27018 }));
  after(require('mongodb-runner/mocha/after')());

  before(function() {
    client = new NativeClient(helper.connection);
  });

  describe('#new', function() {
    it('sets the connection on the instance', function() {
      expect(client.connection).to.equal(helper.connection);
    });
  });

  describe('#databases', function() {
    it('returns a list of the available databases', function(done) {
      client.databases().then(function(dbs) {
        var databases = dbs.databases;
        expect(databases[0].name).to.equal('local');
        done();
      });
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

  describe('#count', function() {
    context('when a filter is provided', function() {
      it('returns a count for the matching documents', function(done) {
        client.count('data-service.test', { a: 1 }, function(error, count) {
          assert.equal(null, error);
          expect(count).to.equal(0);
          done();
        });
      });
    });
  });
});
