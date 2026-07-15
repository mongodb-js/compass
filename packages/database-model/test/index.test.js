'use strict';
var assert = require('assert');
var Database = require('../');

describe('mongodb-database-model', function () {
  it('should work', function () {
    assert(Database);
  });

  describe('DatabaseCollection#fetch', function () {
    function createFakeInstance() {
      return {
        modelType: 'Instance',
        shouldFetchNamespacesFromPrivileges() {
          return false;
        },
        auth: { privileges: null, roles: null },
        emit: function () {},
      };
    }

    it('filters out internal (__mdb_internal_) databases from the list', async function () {
      var databases = new Database.Collection([], {
        parent: createFakeInstance(),
      });

      var dataService = {
        listDatabases: async function () {
          return [
            { _id: 'admin' },
            { _id: 'test' },
            { _id: '__mdb_internal_search' },
            { _id: 'local' },
          ];
        },
      };

      await databases.fetch({ dataService: dataService });

      assert.deepStrictEqual(
        databases.map(function (db) {
          return db._id;
        }),
        ['admin', 'local', 'test']
      );
    });
  });
});
