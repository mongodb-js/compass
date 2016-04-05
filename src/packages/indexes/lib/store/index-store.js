'use strict';

const _ = require('lodash');
const Reflux = require('reflux');
const store = require('mongodb-reflux-store');
const ApplicationStore = store.ApplicationStore;
const NamespaceStore = store.NamespaceStore;

/**
 * The store that backs the indexes component.
 */
const IndexStore = Reflux.createStore({

  /**
   * Gets all the indexes for the current collection.
   */
  indexes: function(done) {
    ApplicationStore.dataService.indexes(NamespaceStore.ns, {}, done);
  }
});

module.exports = IndexStore;
