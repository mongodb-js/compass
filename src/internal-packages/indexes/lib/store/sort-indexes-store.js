'use strict';

const Reflux = require('reflux');
const Action = require('../action/index-actions');

/**
 * The reflux store for sorting indexes
 */
const SortIndexesStore = Reflux.createStore({

  /**
   * Initialize the sort indexes store.
   */
  init: function() {
    this.listenTo(Action.sortIndexes, this.sortIndexes);
  },

  /**
   * Sort the indexes
   *
   * @param {Array} indexes - The indexes to sort.
   */
  sortIndexes: function(indexes) {
    this.trigger(indexes);
  }
});

module.exports = SortIndexesStore;
