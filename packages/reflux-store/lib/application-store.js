'use strict';

const Reflux = require('reflux');

/**
 * The store that backs the core compass application and is the source
 * of truth for its current state.
 */
const ApplicationStore = Reflux.createStore({

  /**
   * Get the data service for the application.
   *
   * @returns {DataService} The data service.
   */
  get dataService() {
    return this._dataService;
  },

  /**
   * Set the data service for the application.
   *
   * @param {DataService} dataService - The data service.
   */
  set dataService(dataService) {
    this._dataService = dataService;
  }
});

module.exports = ApplicationStore;
