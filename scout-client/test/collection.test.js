var assert = require('assert'),
  helpers = require('./helpers');

describe('Collection', function(){
  var scope;

  before(function(done){
    helpers.before(function(){
      scope = helpers.client;
      done();
    });
  });
  after(helpers.after);

  describe('CRUD', function(){
    before(function(done){
      scope.collection('test.original_name').destroy(function(){
        done();
      });
    });

    it('should not allow invalid collection names', function(){
      assert.throws(function(){
        scope.collection('test.awe $ome collection times!');
      }, TypeError);
    });

    it('should create a new one', function(done){
      scope.collection('test.original_name').create(function(err, res){
        assert.ifError(err);
        assert.equal(res.name, 'original_name');
        done();
      });
    });

    it('should conflict if trying to create again', function(done){
      scope.collection('test.original_name').create(function(err, res){
        assert(err, 'Should be an error: ' + res.text);
        assert.equal(err.status, 409);
        done();
      });
    });

    it('should rename it', function(done){
      scope.collection('test.original_name').update({name: 'renamed'}, function(err, res){
        assert.ifError(err);
        assert.equal(res.name, 'renamed');
        done();
      });
    });

    it('should now return a 404 for the original', function(done){
      scope.collection('test.original_name').read(function(err, res){
        assert(err, 'Should be an error: ' + res.text);
        assert.equal(err.status, 404, 'Got message: ' + err.message);
        done();
      });
    });

    it('should destroy one', function(done){
      scope.collection('test.renamed').destroy(function(err, res, raw){
        assert.ifError(err);
        assert.equal(raw.status, 204);
        done();
      });
    });

    it('should 404 for the renamed collection', function(done){
      scope.collection('test.renamed').read(function(err, res){
        assert(err, 'Should be an error: ' + res.text);
        assert.equal(err.status, 404);
        done();
      });
    });
  });

  describe('Query', function(){
    it('should support low-level find', function(done){
      scope.find('local.startup_log', function(err, res){
        assert.ifError(err);

        assert(Array.isArray(res));
        assert(res.length > 0);
        done();
      });
    });
    it('should support count', function(done){
      scope.count('local.startup_log', function(err, res){
        assert.ifError(err);

        assert(res.count > 0, 'count returned ' + JSON.stringify(res));
        done();
      });
    });
    it('should support aggregation', function(done){
      var pipeline = [{
        $group: {
          _id : {
            pid : "$pid"
          },
          count: {$sum: 1}
        }
      }, {
        $sort: {
          count: -1
        }
      }];

      scope.aggregate('local.startup_log', pipeline, function(err, res){
        assert.ifError(err);
        assert(res.length >= 1, 'No startup logs how? ' + JSON.stringify(res, null, 2));
        done();
      });
    });
  });
  describe('Capped', function(){
    var cappy;
    before(function(){
      cappy = scope.collection('test.cappy');
    });
    it('should not allow size AND max for capped collections', function(done){
      cappy.create({capped: true, max: 1024, size: 100}, function(err, res){
        assert(err, 'Should be an error: ' + res.text);
        assert.equal(err.status, 400);
        done();
      });
    });
    it('should create a capped collection', function(done){
      cappy.create({capped: true, max: 10}, function(err){
        assert.ifError(err);
        done();
      });
    });
    it('should be marked as capped by max 10', function(done){
      cappy.read(function(err, res){
        assert.ifError(err);
        assert(res.features.capped);
        assert.equal(res.features.max, 10);
        done();
      });
    });
    after(function(done){
      cappy.destroy(function(err){
        done(err);
      });
    });
  });
});
