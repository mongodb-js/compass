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
    this.listenTo(Action.createIndex, this.createIndex);
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
  },

  /**
   * Create index and add it to the store.
   *
   * @param {String} ns - The namespace of the index.
   * @param {Object} spec - The field specification for the index.
   * @param {Object} options - The optional index options.
   */
  createIndex: function(ns, spec, options) {
    app.dataService.createIndex(ns, spec, options, (createErr) => {
      if (!createErr) {
        // reload indexes
        app.dataService.indexes(ns, {}, (indexesErr, indexes) => {
          if (!indexesErr) {
            Action.updateStatus('complete');
            this.indexes = LoadIndexesStore._convertToModels(indexes);
            this.trigger(this.indexes);
          } else {
            Action.updateStatus('error', indexesErr.errmsg);
          }
        });
      } else {
        Action.updateStatus('error', createErr.errmsg);
      }
    });
  }
});

module.exports = UpdateIndexesStore;
