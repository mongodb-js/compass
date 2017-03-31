const Reflux = require('reflux');
const app = require('hadron-app');
const Actions = require('../actions/collections-actions');

/**
 * The reflux store for creating collections.
 */
const CreateCollectionStore = Reflux.createStore({

  /**
   * Initialize the store.
   */
  init: function() {
    this.listenTo(Actions.createCollection, this.createCollection);
  },

  /**
   * Create the database.
   *
   * @param {String} dbName - The database name.
   * @param {String} collection - The collection name.
   * @param {Boolean} capped - If the collection is capped.
   * @param {Number} size - The max size of the capped collection.
   */
  createCollection(dbName, collection, capped, size) {
    const options = capped ? { capped: true, size: parseInt(size, 10) } : {};
    try {
      app.dataService.createCollection(`${dbName}.${collection}`, options, this.handleResult.bind(this));
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

module.exports = CreateCollectionStore;
