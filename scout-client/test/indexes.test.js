var assert = require('assert'),
  helpers = require('./helpers');

describe('Indexes', function() {
  before(helpers.before);
  after(helpers.after);
  it('should create a new index', function(done) {
    helpers.client.index('local.startup_log').create({
      hostname: 1
    }, function(err, res, raw) {
      assert.ifError(err);
      assert.equal(raw.status, 201);
      done();
    });
  });
  it('should update the name option', function(done) {
    helpers.client.index('local.startup_log', 'hostname_1').update({
      name: 'hostname'
    }, function(err, res, raw) {
      assert.ifError(err);
      assert.equal(raw.status, 200);
      assert.equal(res.name, 'hostname');
      done();
    });
  });
  it('should destroy one', function(done) {
    helpers.client.index('local.startup_log', 'hostname').destroy(function(err, res, raw) {
      assert.ifError(err);
      assert.equal(raw.status, 204);
      done();
    });
  });
  it('should now return a 404 for our old index', function(done) {
    helpers.client.index('local.startup_log', 'hostname').read(function(err) {
      assert.equal(err.status, 404);
      done();
    });
  });
});
