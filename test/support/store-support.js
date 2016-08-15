'use strict';

const DataService = require('mongodb-data-service');
const store = require('mongodb-reflux-store');
const ApplicationStore = store.ApplicationStore;
const NamespaceStore = store.NamespaceStore;

/**
 * Setup the application store with all its child stores.
 *
 * @param {String} database - The database.
 * @param {String} collection - The collection.
 * @param {Object} connection - The connection details.
 * @param {Function} done - The callback.
 */
function setup(database, collection, connection, done) {
  var dataService = new DataService(connection);
  dataService.connect(function() {
    ApplicationStore.dataService = dataService;
    NamespaceStore.ns = `${database}.${collection}`;
    done();
  });
};

/**
 * Teardown the application store.
 *
 * @param {Function} done - The callback.
 */
function teardown(done) {
  ApplicationStore.dataService = null;
  NamespaceStore.ns = null;
  done();
}

module.exports.setup = setup;
module.exports.teardown = teardown;
