var assert = require('assert'),
  helpers = require('./helpers');

describe('Database', function(){
  before(function(done){
    helpers.before(function(err){
      if(err) return done(err);
      helpers.client.collection('test_db.nodbwithoutacollection').destroy(function(){
        done();
      });
    });
  });
  after(helpers.after);

  it('should return details for the local db', function(done){
    helpers.client.database('local').read(function(err, res){
      assert.ifError(err);

      assert(res.collection_names.length > 0);
      done();
    });
  });
  it('should create a new one', function(done){
    helpers.client.collection('test_db.nodbwithoutacollection').create(function(err){
      assert.ifError(err);
      done();
    });
  });
  it('should destroy one', function(done){
    helpers.client.database('test_db').destroy(function(err){
      assert.ifError(err);
      done();
    });
  });
});
