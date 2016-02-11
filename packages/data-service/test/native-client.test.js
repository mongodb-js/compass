var chai = require('chai');
chai.should();

var NativeClient = require('../lib/native-client');
var Connection = require('mongodb-connection-model');

describe('DataService', function() {
  before(require('mongodb-runner/mocha/before')({ port: 27018 }));
  after(require('mongodb-runner/mocha/after')());

  var connection = new Connection({ hostname: '127.0.0.1', port: 27018 });
  var client = new NativeClient(connection);

  describe('#new', function() {
    it('sets the connection on the instance', function() {
      return client.connection.should.equal(connection);
    });
  });

  describe('#collections', function() {
    it('returns all the collections for the database', function() {
      // return service.collections('test').should.eventually.have.length(0);
    });
  });

  describe('#databases', function() {
    it('returns all the databases for the connection', function() {
      // return service.databases().should.eventually.have.property('databases');
    });
  });

  describe('#find', function() {
    context('when a filter is provided', function() {
      it('returns a cursor for the matching documents', function() {
        // return service.find('compass-test.test', { 'name' : 'test' }).then(function(result) {
          // return result.count().should.eventually.equal(0);
        // });
      });
    });

    context('when no filter is provided', function() {
      it('returns a cursor for all documents', function() {
        // return service.find('compass-test.test').then(function(result) {
          // return result.count().should.eventually.equal(0);
        // });
      });
    });

    context('when options are provided', function() {
      it('returns a cursor for the documents', function() {
        // return service.find('compass-test.test', {}, { 'skip' : 5 }).then(function(result) {
          // return result.count().should.eventually.equal(0);
        // });
      });
    });
  });
});
