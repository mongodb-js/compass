var assert = require('assert');
var security = require('../');
var pluck = require('lodash.pluck');
var user = require('../res/user.json');
var admin = require('../res/admin.json');

describe('mongodb-security', function() {
  it('should work', function() {
    assert(security);
  });

  it('should have roles', function() {
    assert(security.roles);
  });

  it('should have actions', function() {
    assert(security.actions);
  });

  describe('getResourcesWithActions', function() {
    it('should filter the right resources', function() {
      var resources = security.getResourcesWithActions(user, ['update']);
      assert.deepEqual(resources, [
        {
          db: 'accounts',
          collection: ''
        },
        {
          db: 'accounts',
          collection: 'system.js'
        }
      ]);
    });

    it('should not find non-special collections with `find` for user', function() {
      var resources = security.getResourcesWithActions(user, ['find'], 'collection');
      assert.equal(resources.length, 0);
    });

    it('should find the cluster resource with `listDatabases` for admin', function() {
      var resources = security.getResourcesWithActions(admin, ['listDatabases']);
      assert.equal(resources.length, 1);
      assert.deepEqual(resources[0], {
        cluster: true
      });
    });

    it('should only return databases with `listCollections` for user', function() {
      var resources = security.getResourcesWithActions(user,
        ['listCollections'], 'database');

      assert.deepEqual(pluck(resources, 'db'),
        ['reporting', 'products', 'sales', 'accounts']);
    });
  });
});
