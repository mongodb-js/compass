var helper = require('./helper');

var expect = helper.expect;

var Actions = require('../lib/actions');
require('../lib/data-service-store');

describe('DataServiceStore', function() {
  before(require('mongodb-runner/mocha/before')({
    port: 27018
  }));
  after(require('mongodb-runner/mocha/after')());

  before(function(done) {
    var unsubscribe = Actions.connectComplete.listen(function() {
      unsubscribe();
      done();
    });
    Actions.connect(helper.connection);
  });

  describe('#aggregate', function() {
    it('fires an aggregate complete action', function(done) {
      var unsubscribe = Actions.aggregateComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.deep.equal([]);
        unsubscribe();
        done();
      });
      Actions.aggregate('data-service.test', [], {});
    });
  });

  describe('#count', function() {
    it('fires a count complete action', function(done) {
      var unsubscribe = Actions.countComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.equal(0);
        unsubscribe();
        done();
      });
      Actions.count('data-service.test', {}, {});
    });
  });

  describe('#createCollection', function() {
    it('fires a create collection complete action', function(done) {
      var unsubscribe = Actions.createCollectionComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.not.equal(null);
        unsubscribe();
        done();
      });
      Actions.createCollection('data-service.test', {});
    });
  });

  describe('#createIndex', function() {
    it('fires a create index complete action', function(done) {
      var unsubscribe = Actions.createIndexComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.not.equal(null);
        unsubscribe();
        done();
      });
      Actions.createIndex('data-service.test', { d: 1 });
    });
  });

  describe('#currentOp', function() {
    it('fires a current op complete action', function(done) {
      var unsubscribe = Actions.currentOpComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result.inprog).to.not.equal(null);
        unsubscribe();
        done();
      });
      Actions.currentOp(true);
    });
  });

  describe('#deleteMany', function() {
    it('fires a delete many complete action', function(done) {
      var unsubscribe = Actions.deleteManyComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.not.equal(null);
        unsubscribe();
        done();
      });
      Actions.deleteMany('data-service.test', {}, {});
    });
  });

  describe('#deleteOne', function() {
    it('fires a delete one complete action', function(done) {
      var unsubscribe = Actions.deleteOneComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.not.equal(null);
        unsubscribe();
        done();
      });
      Actions.deleteOne('data-service.test', {}, {});
    });
  });

  describe('#dropCollection', function() {
    it('fires a drop collection complete action', function(done) {
      var unsubscribe = Actions.dropCollectionComplete.listen(function(error, result) {
        expect(error).to.not.equal(null);
        expect(result).to.equal(undefined);
        unsubscribe();
        done();
      });
      Actions.dropCollection('data-service.testing');
    });
  });

  describe('#dropDatabase', function() {
    it('fires a drop database complete action', function(done) {
      var unsubscribe = Actions.dropDatabaseComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.equal(true);
        unsubscribe();
        done();
      });
      Actions.dropDatabase('data-services-none');
    });
  });

  describe('#dropIndex', function() {
    it('fires a drop index complete action', function(done) {
      var unsubscribe = Actions.dropIndexComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result.ok).to.equal(1);
        unsubscribe();
        done();
      });
      Actions.dropIndex('data-service.test', 'd_1');
    });
  });

  describe('#explain', function() {
    it('fires an explain complete action', function(done) {
      var unsubscribe = Actions.explainComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result.ok).to.equal(1);
        unsubscribe();
        done();
      });
      Actions.explain('data-service.test', {}, {});
    });
  });

  describe('#find', function() {
    it('fires a find complete action', function(done) {
      var unsubscribe = Actions.findComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.deep.equal([]);
        unsubscribe();
        done();
      });
      Actions.find('data-service.test', {}, {});
    });
  });

  describe('#findOneAndReplace', function() {
    it('fires a find one and replace complete action', function(done) {
      var unsubscribe = Actions.findOneAndReplaceComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.deep.equal(null);
        unsubscribe();
        done();
      });
      Actions.findOneAndReplace('data-service.test', {}, {}, {});
    });
  });

  describe('#getCollection', function() {
    it('fires a get collection complete action', function(done) {
      var unsubscribe = Actions.getCollectionComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result._id).to.equal('data-service.test');
        unsubscribe();
        done();
      });
      Actions.getCollection('data-service.test');
    });
  });

  describe('#getDatabase', function() {
    it('fires a get database complete action', function(done) {
      var unsubscribe = Actions.getDatabaseComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result._id).to.equal('data-service');
        unsubscribe();
        done();
      });
      Actions.getDatabase('data-service');
    });
  });

  describe('#getInstance', function() {
    it('fires a get instance complete action', function(done) {
      var unsubscribe = Actions.getInstanceComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.not.equal({});
        unsubscribe();
        done();
      });
      Actions.getInstance();
    });
  });

  describe('#insertMany', function() {
    it('fires a insert many complete action', function(done) {
      var unsubscribe = Actions.insertManyComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.not.deep.equal({});
        Actions.deleteMany('data-service.test', {}, {});
        unsubscribe();
        done();
      });
      Actions.insertMany('data-service.test', [{ a: 1 }], {});
    });
  });

  describe('#insertOne', function() {
    it('fires a insert many complete action', function(done) {
      var unsubscribe = Actions.insertOneComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.not.deep.equal({});
        Actions.deleteMany('data-service.test', {}, {});
        unsubscribe();
        done();
      });
      Actions.insertOne('data-service.test', { a: 1 }, {});
    });
  });

  describe('#listCollections', function() {
    it('fires a list collections complete action', function(done) {
      var unsubscribe = Actions.listCollectionsComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result.length).to.equal(1);
        unsubscribe();
        done();
      });
      Actions.listCollections('data-service', {});
    });
  });

  describe('#listIndexes', function() {
    it('fires a list indexes complete action', function(done) {
      var unsubscribe = Actions.listIndexesComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result.length).to.equal(1);
        unsubscribe();
        done();
      });
      Actions.listIndexes('data-service.test', {});
    });
  });

  describe('#serverStats', function() {
    it('fires a server stats complete action', function(done) {
      var unsubscribe = Actions.serverStatsComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.not.equal(null);
        unsubscribe();
        done();
      });
      Actions.serverStats();
    });
  });

  describe('#top', function() {
    it('fires a top complete action', function(done) {
      var unsubscribe = Actions.topComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.not.equal(null);
        unsubscribe();
        done();
      });
      Actions.top();
    });
  });

  describe('#updateCollection', function() {
    it('fires a update collection complete action', function(done) {
      var unsubscribe = Actions.updateCollectionComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.not.equal(null);
        unsubscribe();
        done();
      });
      Actions.updateCollection('data-service.test', {});
    });
  });

  describe('#updateMany', function() {
    it('fires a update many complete action', function(done) {
      var unsubscribe = Actions.updateManyComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.not.equal(null);
        unsubscribe();
        done();
      });
      Actions.updateMany('data-service.test', {}, { '$set': { name: 'test' }}, {});
    });
  });

  describe('#updateOne', function() {
    it('fires a update one complete action', function(done) {
      var unsubscribe = Actions.updateOneComplete.listen(function(error, result) {
        expect(error).to.equal(null);
        expect(result).to.not.equal(null);
        unsubscribe();
        done();
      });
      Actions.updateOne('data-service.test', {}, { '$set': { name: 'test' }}, {});
    });
  });
});
