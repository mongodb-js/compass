'use strict';
var assert = require('assert');
var Database = require('../');

describe('mongodb-database-model', function () {
  it('should work', function () {
    assert(Database);
  });

  describe('DatabaseCollection#fetch', function () {
    function createFakeInstance({ showHiddenNamespaces }) {
      return {
        modelType: 'Instance',
        shouldFetchNamespacesFromPrivileges() {
          return false;
        },
        shouldShowHiddenNamespaces() {
          return showHiddenNamespaces;
        },
        auth: { privileges: null, roles: null },
        emit: function () {},
      };
    }

    function createDataService() {
      return {
        listDatabases: async function () {
          return [
            { _id: 'admin' },
            { _id: 'test' },
            { _id: 'config' },
            { _id: 'local' },
            { _id: '__mdb_internal_search' },
            { _id: '__mdb_internal_atlas' },
          ];
        },
      };
    }

    it('hides internal (__mdb_internal_) databases by default', async function () {
      var databases = new Database.Collection([], {
        parent: createFakeInstance({ showHiddenNamespaces: false }),
      });

      await databases.fetch({ dataService: createDataService() });

      assert.deepStrictEqual(
        databases.map(({ _id }) => _id),
        ['admin', 'config', 'local', 'test']
      );
    });

    it('keeps internal (__mdb_internal_) databases when showHiddenNamespaces is enabled', async function () {
      var databases = new Database.Collection([], {
        parent: createFakeInstance({ showHiddenNamespaces: true }),
      });

      await databases.fetch({ dataService: createDataService() });

      assert.deepStrictEqual(
        databases.map(({ _id }) => _id),
        [
          '__mdb_internal_atlas',
          '__mdb_internal_search',
          'admin',
          'config',
          'local',
          'test',
        ]
      );
    });
  });
});
