'use strict';

const Reflux = require('reflux');
const app = require('ampersand-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const Action = require('../action/index-actions');

/**
 * The reflux store for sorting indexes
 */
const LoadIndexesStore = Reflux.createStore({

  /**
   * Initialize the load indexes store.
   */
  init: function() {
    this.listenTo(Action.loadIndexes, this.loadIndexes);
  },

  /**
   * Load the indexes.
   */
  loadIndexes: function() {
    if (NamespaceStore.ns) {
      app.dataService.indexes(NamespaceStore.ns, {}, (err, indexes) => {
        this.trigger(indexes);
      });
    }
  }
});

module.exports = LoadIndexesStore;
