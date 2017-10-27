const Reflux = require('reflux');
const app = require('hadron-app');
const Actions = require('../actions/collections-actions');

/**
 * The reflux store for dropping collections.
 */
const DropCollectionStore = Reflux.createStore({

  /**
   * Initialize the store.
   */
  init: function() {
    this.listenTo(Actions.dropCollection, this.dropCollection);
  },

  onActivated(appRegistry) {
    appRegistry.on('data-service-connected', (err, dataService) => {
      if (!err) {
        this.dataService = dataService;
      }
    });
  },

  /**
   * Drop the collection.
   *
   * @param {String} dbName - The dbName.
   * @param {String} collection - The collection name.
   */
  dropCollection(dbName, collection) {
    try {
      this.dataService.dropCollection(`${dbName}.${collection}`, this.handleResult.bind(this));
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
      app.appRegistry.getAction('App.InstanceActions').refreshInstance();
      this.trigger(error, result);
    }
  }
});

module.exports = DropCollectionStore;
