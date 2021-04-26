'use strict';

const Reflux = require('reflux');

/**
 * The store holds the source of truth for the namespace being worked on.
 */
const NamespaceStore = Reflux.createStore({
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
    this.trigger(this._ns);
  }
});

module.exports = NamespaceStore;
