var assert = require('assert'),
  helpers = require('./helpers');

describe('Instance', function(){
  before(helpers.before);
  after(helpers.after);
  it('should return details', function(done){
    helpers.client.instance(function(err, res){
      assert.ifError(err);
      assert(Array.isArray(res.database_names));
      done();
    });
  });
  it('should return a full fetch of top', function(done){
    helpers.client.top(function(err, res){
      assert.ifError(err);
      assert(Array.isArray(res.namespaces));
      done();
    });
  });
  it('should return some logs', function(done){
    helpers.client.log(function(err, res){
      assert.ifError(err);

      assert(Array.isArray(res));
      done();
    });
  });
  it('should have the instance in the deployment list', function(done){
    helpers.client.deployments(function(err, res){
      assert.ifError(err);
      assert(res.length > 0);
      done();
    });
  });
});
