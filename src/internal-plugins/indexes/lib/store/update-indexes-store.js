const Reflux = require('reflux');
const app = require('hadron-app');
const LoadIndexesStore = require('./load-indexes-store');
const Action = require('../action/index-actions');

// const debug = require('debug')('mongodb-compass:stores:ddl');

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
    this.NamespaceStore = app.appRegistry.getStore('App.NamespaceStore');
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
    app.dataService.dropIndex(this.NamespaceStore.ns, indexName, (err) => {
      if (!err) {
        this.indexes = this.indexes.filter(index => index.name !== indexName);
        this.trigger(this.indexes);
        Action.updateStatus('complete');
      } else {
        Action.updateStatus('error', this._parseErrorMsg(err));
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
            Action.updateStatus('error', this._parseErrorMsg(indexesErr));
          }
        });
      } else {
        Action.updateStatus('error', this._parseErrorMsg(createErr));
      }
    });
  },

  /**
   * Data Service attaches string message property for some errors, but not all
   * that can happen during index creation/dropping. Check first for data service
   * custom error, then node driver errmsg, lastly use default error message.
   *
   * @param {Object} error - The error to parse a message from
   *
   * @returns {string} - The found error message, or the default message.
   */
  _parseErrorMsg: function(error) {
    if (typeof error.message === 'string') {
      return error.message;
    } else if (typeof error.errmsg === 'string') {
      return error.errmsg;
    }
    return 'Unknown error';
  }
});

module.exports = UpdateIndexesStore;
