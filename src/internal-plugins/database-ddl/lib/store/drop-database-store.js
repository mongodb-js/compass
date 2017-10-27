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
    this.listenTo(Actions.dropDatabase, this.dropDatabase);
  },

  onActivated(appRegistry) {
    appRegistry.on('data-service-connected', (err, dataService) => {
      if (!err) {
        this.dataService = dataService;
      }
    });
  },

  /**
   * Drop the database.
   *
   * @param {String} dbName - The database name.
   */
  dropDatabase(dbName) {
    try {
      this.dataService.dropDatabase(dbName, this.handleResult.bind(this));
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
      app.appRegistry.getAction('App.InstanceActions').refreshInstance();
      this.trigger(error, result);
    }
  }
});

module.exports = DropDatabaseStore;
