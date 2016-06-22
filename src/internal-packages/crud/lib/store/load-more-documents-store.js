'use strict';

const Reflux = require('reflux');
const app = require('ampersand-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const Action = require('hadron-action');

/**
 * The reflux store for loading more documents.
 */
const LoadMoreDocumentsStore = Reflux.createStore({

  /**
   * Initialize the reset document list store.
   */
  init: function() {
    this.listenTo(Action.fetchNextDocuments, this.loadMoreDocuments);
  },

  /**
   * Fetch the next page of documents.
   *
   * @param {Integer} currentPage - The current page in the view.
   */
  loadMoreDocuments: function(currentPage) {
    var filter = app.queryOptions.query.serialize();
    var options = { skip: (currentPage * 20), limit: 20, sort: [[ '_id', 1 ]] };
    app.dataService.find(NamespaceStore.ns, filter, options, (error, documents) => {
      this.trigger(documents);
    });
  }
});

module.exports = LoadMoreDocumentsStore;
