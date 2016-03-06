var helper = require('./helper');

var assert = helper.assert;
var expect = helper.expect;
var eventStream = helper.eventStream;

var DataService = require('../lib/data-service');

describe('DataService', function() {
  var service = new DataService(helper.connection);

  before(require('mongodb-runner/mocha/before')({ port: 27018 }));
  after(require('mongodb-runner/mocha/after')());

  before(function(done) {
    service.connect(done);
  });

  describe('#find', function() {
    before(function() {
      helper.insertTestDocuments(service.client);
    });

    after(function() {
      helper.deleteTestDocuments(service.client);
    });

    it('returns a cursor for the documents', function(done) {
      service.find('data-service.test', {}, { skip: 1 }, function(error, docs) {
        assert.equal(null, error);
        expect(docs.length).to.equal(1);
        done();
      });
    });
  });

  describe('#collection', function() {
    it('returns the collection details', function(done) {
      service.collection('data-service.test', {}, function(err, coll) {
        assert.equal(null, err);
        expect(coll.ns).to.equal('data-service.test');
        expect(coll.index_count).to.equal(1);
        done();
      });
    });
  });

  describe('#count', function() {
    context('when a filter is provided', function() {
      it('returns a count for the matching documents', function(done) {
        service.count('data-service.test', { a: 1 }, {}, function(error, count) {
          assert.equal(null, error);
          expect(count).to.equal(0);
          done();
        });
      });
    });
  });

  describe('#database', function() {
    it('returns the database details', function(done) {
      service.database('data-service', {}, function(err, database) {
        assert.equal(null, err);
        expect(database._id).to.equal('data-service');
        expect(database.stats.document_count).to.not.equal(undefined);
        done();
      });
    });
  });

  describe('#get', function() {
    context('when the url is /instance', function() {
      context('when passing options', function() {
        it('returns the instance details', function(done) {
          service.get('/instance', {}, function(err, instance) {
            assert.equal(null, err);
            expect(instance.host).to.not.equal(null);
            done();
          });
        });
      });

      context('when passing no options', function() {
        it('returns the instance details', function(done) {
          service.get('/instance', function(err, instance) {
            assert.equal(null, err);
            expect(instance.host).to.not.equal(null);
            done();
          });
        });
      });
    });

    context('when the url is /databases/:database', function() {
      context('when passing options', function() {
        it('returns the database details', function(done) {
          service.get('/databases/data-service', {}, function(err, database) {
            assert.equal(null, err);
            expect(database._id).to.equal('data-service');
            expect(database.stats.document_count).to.not.equal(undefined);
            done();
          });
        });
      });

      context('when passing no options', function() {
        it('returns the database details', function(done) {
          service.get('/databases/data-service', function(err, database) {
            assert.equal(null, err);
            expect(database._id).to.equal('data-service');
            expect(database.stats.document_count).to.not.equal(undefined);
            done();
          });
        });
      });
    });
  });

  describe('#instance', function() {
    it('returns the instance', function(done) {
      service.instance({}, function(err, instance) {
        assert.equal(null, err);
        expect(instance._id).to.not.equal(undefined);
        expect(instance.databases[0]._id).to.not.equal(undefined);
        done();
      });
    });
  });

  describe('#sample', function() {
    before(function() {
      helper.insertTestDocuments(service.client);
    });

    after(function() {
      helper.deleteTestDocuments(service.client);
    });

    context('when no filter is provided', function() {
      it('returns a stream of sampled documents', function(done) {
        var seen = 0;
        service.sample('data-service.test', {})
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
});
