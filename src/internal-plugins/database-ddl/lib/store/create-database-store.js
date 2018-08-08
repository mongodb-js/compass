const Reflux = require('reflux');
const app = require('hadron-app');
const Actions = require('../action');

/**
 * The reflux store for creating databases.
 */
const CreateDatabaseStore = Reflux.createStore({

  /**
   * Initialize the store.
   */
  init: function() {
    this.listenTo(Actions.createDatabase, this.createDatabase);
  },

  onActivated(appRegistry) {
    appRegistry.on('data-service-connected', (err, dataService) => {
      if (!err) {
        this.dataService = dataService;
      }
    });
  },

  /**
   * Create the database.
   *
   * @param {String} dbName - The database name.
   * @param {String} collection - The collection name.
   * @param {Boolean} capped - If the collection is capped.
   * @param {Number} size - The max size of the capped collection.
   * @param {Boolean} isCustomCollation - If the collection is custom.
   * @param {Boolean} collation - Collation options.
   */
  createDatabase(dbName, collection, capped, size, isCustomCollation, collation) {
    if (dbName.includes('.')) {
      return this.handleResult(new Error('Database names may not contain a "."'), null);
    }
    let options = {};
    options = capped ? Object.assign(options, { capped: true, size: parseInt(size, 10) }) : options;
    options = isCustomCollation ? Object.assign(options, { collation }) : options;
    try {
      this.dataService.createCollection(`${dbName}.${collection}`, options, this.handleResult.bind(this));
    } catch (e) {
      this.handleResult(e, null);
    }
  },

  /**
   * Handle the create database result.
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

module.exports = CreateDatabaseStore;
