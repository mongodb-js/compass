'use strict';

const Reflux = require('reflux');
const app = require('ampersand-app');
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
    this.listenTo(Action.filterChanged, this._resetDocuments);
    this.listenTo(Action.fetchNextDocuments, this._fetchNextDocuments);
  },

  /**
   * This function is called when the collection filter changes.
   *
   * @param {Object} filter - The query filter.
   */
  _resetDocuments: function(filter) {
    var ns = NamespaceStore.ns;
    if (ns) {
      var dataService = ApplicationStore.dataService;
      dataService.find(ns, filter, { limit: 20, sort: { _id: 1 }}, (error, documents) => {
        this.trigger(documents, true);
      });
    }
  },

  /**
   * Fetch the next page of documents.
   *
   * @param {Integer} page - The current page.
   */
  _fetchNextDocuments: function(page) {
    var ns = NamespaceStore.ns;
    if (ns) {
      var dataService = ApplicationStore.dataService;
      var filter = app.queryOptions.query.serialize();
      dataService.find(ns, filter, { skip: (page * 20), limit: 20, sort: { _id: 1 }}, (error, documents) => {
        this.trigger(documents, false);
      });
    }
  }
});

module.exports = DocumentListStore;
