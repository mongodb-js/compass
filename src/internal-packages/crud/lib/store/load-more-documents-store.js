const Reflux = require('reflux');
const app = require('ampersand-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const Action = require('hadron-action');
const ReadPreference = require('mongodb').ReadPreference;

/**
 * The default read preference.
 */
const READ = ReadPreference.PRIMARY_PREFERRED;

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
    const filter = app.queryOptions.query;
    const options = {
      skip: skip,
      limit: 20,
      sort: [[ '_id', 1 ]],
      readPreference: READ,
      promoteValues: false
    };
    app.dataService.find(NamespaceStore.ns, filter, options, (error, documents) => {
      if (!error) {
        this.trigger(documents);
      }
    });
  }
});

module.exports = LoadMoreDocumentsStore;
