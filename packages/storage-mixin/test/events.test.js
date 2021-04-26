var storageMixin = require('../lib');
var assert = require('assert');
var helpers = require('./helpers');

var StorableUser = helpers.User.extend(storageMixin, {
  storage: 'disk'
});

describe('.fetched property', function() {
  var user;
  beforeEach(function() {
    user = new StorableUser({
      id: 'apollo',
      name: 'Lee Adama',
      email: 'apollo@galactica.com',
      password: 'cyl0nHunt3r'
    });
  });

  after(function(done) {
    helpers.clearNamespaces('disk', ['Users'], done);
  });

  it('should not be `fetched` before running .fetch()', function() {
    assert.equal(user.fetched, false);
  });

  it('should be `fetched` after `sync` event', function(done) {
    user.on('sync', function() {
      assert.ok(user.fetched);
      done();
    });
    user.fetch();
  });

  it('should set `fetched` to false during .save()', function(done) {
    user.fetched = true;
    var numChanged = 0;
    user.on('change:fetched', function() {
      numChanged ++;
    });
    user.save({
      email: 'commander@galactica.com'
    }, {
      success: function() {
        assert.equal(numChanged, 2);
        done();
      },
      error: done
    });
  });
});
