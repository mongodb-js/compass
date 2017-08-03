const Reflux = require('reflux');
const toNS = require('mongodb-ns');
const Actions = require('../actions');
const _ = require('lodash');

const NUM_PAGE_DOCS = 20;

/**
 * The reflux store for loading more documents.
 */
const LoadMoreDocumentsStore = Reflux.createStore({

  /**
   * Initialize the reset document list store.
   */
  init: function() {
    this.reset();
    this.listenTo(Actions.fetchNextDocuments, this.fetchNextDocuments.bind(this));
  },

  /**
   * Listen to query changes on activation.
   *
   * @param {AppRegistry} appRegistry - The app registry.
   */
  onActivated(appRegistry) {
    appRegistry.getStore('Query.ChangedStore').listen(this.onQueryChanged.bind(this));
  },

  /**
   * Change the ns when the collection changes.
   *
   * @param {String} ns - The namespace.
   */
  onCollectionChanged: function(ns) {
    this.ns = ns;
  },

  /**
   * Fires when the query is changed. Need to copy the latest query details
   * and reset the counter.
   *
   * @param {Object} state - The query state.
   */
  onQueryChanged: function(state) {
    if (state.ns && toNS(state.ns).collection) {
      this.filter = state.filter || {};
      this.sort = _.toPairs(state.sort);
      this.limit = state.limit;
      this.skip = state.skip;
      this.project = state.project;
      this.counter = 0;
    }
  },

  /**
   * Fetch the next page of documents. Increase the counter by the page size
   * (20 documents) until we reach the user-specified limit. Also take into
   * account user-specified skip.
   *
   * @param {Integer} skip - The number of documents to skip.
   */
  fetchNextDocuments: function(skip) {
    this.counter += NUM_PAGE_DOCS;
    let nextPageCount = 20;
    if (this.limit > 0) {
      nextPageCount = Math.min(Math.max(0, this.limit - this.counter), NUM_PAGE_DOCS);
      if (nextPageCount === 0) {
        return;
      }
    }
    const options = {
      skip: skip + this.skip,
      limit: nextPageCount,
      sort: this.sort,
      fields: this.project,
      promoteValues: false
    };
    global.hadronApp.dataService.find(this.ns, this.filter, options, (error, documents) => {
      this.trigger(error, documents);
    });
  },

  reset: function() {
    this.ns = undefined;
    this.filter = {};
    this.sort = [[ '_id', 1 ]];
    this.limit = 0;
    this.skip = 0;
    this.project = null;
    this.counter = 0;
  }

});

module.exports = LoadMoreDocumentsStore;
