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
    function createFakeDatabase({ showHiddenNamespaces }) {
      var instance = {
        modelType: 'Instance',
        shouldFetchNamespacesFromPrivileges() {
          return false;
        },
        shouldFetchDbAndCollStats() {
          return false;
        },
        shouldShowHiddenNamespaces() {
          return showHiddenNamespaces;
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

    function createDataService() {
      return {
        listCollections: async function () {
          return [
            { _id: 'test.foo' },
            { _id: 'test.bar' },
            { _id: 'test.system.views' },
            { _id: 'test.system.profile' },
          ];
        },
      };
    }

    it('hides system collections by default, but keeps system.profile', async function () {
      var collections = new CollectionCollection([], {
        parent: createFakeDatabase({ showHiddenNamespaces: false }),
      });

      await collections.fetch({ dataService: createDataService() });

      assert.deepStrictEqual(
        collections.map(function (coll) {
          return coll._id;
        }),
        ['test.bar', 'test.foo', 'test.system.profile']
      );
    });

    it('keeps system collections when showHiddenNamespaces is enabled', async function () {
      var collections = new CollectionCollection([], {
        parent: createFakeDatabase({ showHiddenNamespaces: true }),
      });

      await collections.fetch({ dataService: createDataService() });

      assert.deepStrictEqual(
        collections.map(function (coll) {
          return coll._id;
        }),
        ['test.bar', 'test.foo', 'test.system.profile', 'test.system.views']
      );
    });
  });
});
