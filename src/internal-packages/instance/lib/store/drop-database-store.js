const Reflux = require('reflux');
const app = require('hadron-app');
const Actions = require('../action');

/**
 * The reflux store for dropping databases.
 */
const DropDatabaseStore = Reflux.createStore({

  /**
   * Initialize the store.
   */
  init: function() {
    this.refreshInstance = app.appRegistry.getAction('App.InstanceActions').refreshInstance;
    this.listenTo(Actions.dropDatabase, this.dropDatabase);
  },

  /**
   * Drop the database.
   *
   * @param {String} dbName - The database name.
   */
  dropDatabase(dbName) {
    try {
      app.dataService.dropDatabase(dbName, this.handleResult.bind(this));
    } catch (e) {
      this.handleResult(e, null);
    }
  },

  /**
   * Handle the drop database result.
   *
   * @param {Error} error - The error.
   * @param {Object} result - The result.
   */
  handleResult(error, result) {
    if (error) {
      this.trigger(error, result);
    } else {
      this.refreshInstance();
      this.trigger(error, result);
    }
  }
});

module.exports = DropDatabaseStore;
