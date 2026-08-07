'use strict';
var assert = require('assert');
var Collection = require('../');
var CollectionCollection = require('../').Collection;

describe('mongodb-collection-model', function () {
  it('should work', function () {
    assert(Collection);
  });
  it('should work for .Collection', function () {
    assert(CollectionCollection);
  });

  describe('CollectionCollection#fetch', function () {
    function createFakeDatabase() {
      var instance = {
        modelType: 'Instance',
        shouldFetchNamespacesFromPrivileges() {
          return false;
        },
        shouldFetchDbAndCollStats() {
          return false;
        },
        auth: { privileges: null, roles: null },
        emit: function () {},
      };
      return {
        modelType: 'Database',
        parent: instance,
        getId: function () {
          return 'test';
        },
        emit: function () {},
      };
    }

    it('hides system collections but keeps system.profile', async function () {
      var collections = new CollectionCollection([], {
        parent: createFakeDatabase(),
      });

      var dataService = {
        listCollections: async function () {
          return [
            { _id: 'test.foo' },
            { _id: 'test.bar' },
            { _id: 'test.system.views' },
            { _id: 'test.system.profile' },
          ];
        },
      };

      await collections.fetch({ dataService: dataService });

      assert.deepStrictEqual(
        collections.map(function (coll) {
          return coll._id;
        }),
        ['test.bar', 'test.foo', 'test.system.profile']
      );
    });
  });
});
