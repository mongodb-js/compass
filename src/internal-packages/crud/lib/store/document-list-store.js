'use strict';

const Reflux = require('reflux');
const stores = require('hadron-reflux-store');
const ApplicationStore = stores.ApplicationStore;
const NamespaceStore = stores.NamespaceStore;
const Action = require('hadron-action');

/**
 * The reflux store for the list of documents.
 */
const DocumentListStore = Reflux.createStore({

  /**
   * Initialize the document list store.
   */
  init: function() {
    this.listenTo(Action.filterChanged, this.filterChanged);
  },

  /**
   * This function is called when the collection filter changes.
   *
   * @param {Object} filter - The query filter.
   */
  filterChanged: function(filter) {
    var ns = NamespaceStore.ns
    var dataService = ApplicationStore.dataService;
    dataService.find(ns, filter, { limit: 20 }, (error, documents) => {
      this.trigger(documents);
    });
  }
});

module.exports = DocumentListStore;
