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
   * @param {Integer} skip - The number of documents to skip.
   */
  loadMoreDocuments: function(skip) {
    const filter = app.queryOptions.query.serialize();
    const options = { skip: skip, limit: 20, sort: [[ '_id', 1 ]] };
    app.dataService.find(NamespaceStore.ns, filter, options, (error, documents) => {
      if (!error) {
        this.trigger(documents);
      }
    });
  }
});

module.exports = LoadMoreDocumentsStore;
