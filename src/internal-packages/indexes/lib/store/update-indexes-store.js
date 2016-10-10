const Reflux = require('reflux');
const app = require('ampersand-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const LoadIndexesStore = require('./load-indexes-store');
const Action = require('../action/index-actions');

/**
 * The reflux store for updating indexes.
 */
const UpdateIndexesStore = Reflux.createStore({

  /**
   * Initialize the updating indexes store.
   */
  init: function() {
    this.listenTo(LoadIndexesStore, this.loadIndexes);
    this.listenTo(Action.dropIndex, this.dropIndex);
  },

  /**
   * Load the indexes into the store.
   *
   * @param {Array} indexes - The indexes.
   */
  loadIndexes: function(indexes) {
    this.indexes = indexes;
  },

  /**
   * Drop index and remove from the store.
   *
   * @param {String} indexName - The name of the index to be dropped.
   */
  dropIndex: function(indexName) {
    app.dataService.dropIndex(NamespaceStore.ns, indexName, (err) => {
      if (!err) {
        this.indexes = this.indexes.filter(index => index.name !== indexName);
        this.trigger(this.indexes);
      }
    });
  }
});

module.exports = UpdateIndexesStore;
