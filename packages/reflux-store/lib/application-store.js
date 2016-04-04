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
    this.trigger(this);
  },

  /**
   * Gets the current namespace being worked with in the application.
   */
  get ns() {
    return this._ns;
  },

  /**
   * Set the current namespace being worked on in the applicaiton.
   *
   * @param {String} ns - The current ns.
   */
  set ns(ns) {
    this._ns = ns;
    this.trigger(this);
  }
});

module.exports = ApplicationStore;
