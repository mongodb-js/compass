var MongoClient = require('mongodb').MongoClient;
var fetch = require('../lib/fetch');
var IndexCollection = require('../').Collection;
var assert = require('assert');
var _ = require('lodash');

// var debug = require('debug')('mongodb-index-model:text:fetch');

describe('fetch()', function() {
  before(require('mongodb-runner/mocha/before')());
  after(require('mongodb-runner/mocha/after')());

  context('local', function() {
    this.slow(2000);
    this.timeout(10000);

    var db;
    var collection;

    // connect and create collection with index
    before(function(done) {
      MongoClient.connect('mongodb://localhost:27017/test', function(err, _db) {
        assert.ifError(err);
        db = _db;
        collection = db.collection('_test_index_fetch');
        collection.ensureIndex({loc: '2d'}, {w: 1}, function(err2) {
          assert.ifError(err2);
          done();
        });
      });
    });

    // drop collection and close db
    after(function(done) {
      collection.drop(done);
    });

    it('should connect to `localhost:27017` and get indexes', function(done) {
      fetch(db, 'test._test_index_fetch', function(err, res) {
        assert.ifError(err);
        assert.equal(res[0].name, '_id_');
        assert.ok(_.isNumber(res[0].size));
        assert.equal(res[1].name, 'loc_2d');
        assert.ok(_.isNumber(res[1].size));
        done();
      });
    });

    it('should populate an index collection', function(done) {
      fetch(db, 'test._test_index_fetch', function(err2, res) {
        assert.ifError(err2);
        var indexes = new IndexCollection(res, {parse: true});
        assert.equal(indexes.length, 2);
        done();
      });
    });

    it('should work with fetchIndexes() method', function(done) {
      var coll = new IndexCollection().fetchIndexes(db, 'test._test_index_fetch');
      coll.on('sync', function() {
        assert.equal(coll.length, 2);
        done();
      });
    });
  });
});
