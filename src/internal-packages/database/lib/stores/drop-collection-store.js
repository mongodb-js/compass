const Reflux = require('reflux');
const app = require('ampersand-app');
const Actions = require('../actions/collections-actions');

/**
 * The reflux store for dropping collections.
 */
const DropCollectionStore = Reflux.createStore({

  /**
   * Initialize the store.
   */
  init: function() {
    this.refreshInstance = app.appRegistry.getAction('App.InstanceActions').refreshInstance;
    this.listenTo(Actions.dropCollection, this.dropCollection);
  },

  /**
   * Drop the collection.
   *
   * @param {String} dbName - The dbName.
   * @param {String} collection - The collection name.
   */
  dropCollection(dbName, collection) {
    try {
      app.dataService.dropCollection(`${dbName}.${collection}`, this.handleResult.bind(this));
    } catch (e) {
      this.handleResult(e, null);
    }
  },

  /**
   * Handle the drop collection result.
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

module.exports = DropCollectionStore;
