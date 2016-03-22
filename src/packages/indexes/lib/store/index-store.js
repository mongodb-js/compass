'use strict';

const _ = require('lodash');
const Reflux = require('reflux');
const DataService = require('compass-core').DataService;
const ApplicationStore = require('compass-store').ApplicationStore;

/**
 * The store that backs the indexes component.
 */
const IndexStore = Reflux.createStore({

  /**
   * Gets all the indexes for the current collection.
   */
  indexes: function(done) {
    DataService.indexes(ApplicationStore.ns, {}, done);
  }
});

module.exports = IndexStore;
