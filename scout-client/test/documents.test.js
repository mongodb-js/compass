var assert = require('assert'),
  helpers = require('./helpers');

describe('Documents', function(){
  before(helpers.before);
  after(function(done){
    helpers.client.collection('test.scopes').destroy(function(err){
      if(err) return done(err);
      helpers.after(done);
    });
  });

  var doc = {
    _id: Date.now(),
    name: 'Document Create',
    project: 'mongoscope-client'
  };

  it('should make us create the collection', function(done){
    helpers.client.document('test.scopes', doc).create(function(err, res, raw){
      assert.equal(raw.status, 404);
      done();
    });
  });
  it('should allow us to make the collection', function(done){
    helpers.client.collection('test.scopes').create(function(err, res, raw){
      assert.equal(raw.status, 201);
      done();
    });
  });
  it('should create a new one', function(done){
    helpers.client.document('test.scopes', doc._id).create(doc, function(err, res, raw){
      assert.ifError(err);
      assert.equal(raw.status, 201);
      done();
    });
  });

  it('should return details for one', function(done){
    helpers.client.document('test.scopes', doc._id).read(function(err, res){
      assert.ifError(err);
      assert.deepEqual(res, doc);
      done();
    });
  });

  it('should update one', function(done){
    helpers.client.document('test.scopes', doc._id).update({$inc: {updates: 1}}, function(err, res, raw){
      assert.ifError(err);
      assert.equal(200, raw.status);
      done();
    });
  });

  it('should destroy one', function(done){
    helpers.client.document('test.scopes', doc._id).destroy(function(err, res, raw){
      assert.ifError(err);
      assert.equal(raw.status, 200);
      done();
    });
  });
  it('should return a 404 for the old document', function(done){
    helpers.client.document('test.scopes', doc._id).read(function(err){
      assert.equal(err.status, 404);
      done();
    });
  });
});
