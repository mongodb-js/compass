const Reflux = require('reflux');
const toNS = require('mongodb-ns');
const Actions = require('../actions');
const _ = require('lodash');

const NUM_PAGE_DOCS = 20;

/**
 * The reflux store for loading more documents.
 */
const PageChangedStore = Reflux.createStore({

  /**
   * Initialize the reset document list store.
   *
   * this.counter is the number of documents that have been loaded by this store.
   */
  init: function() {
    this.reset();
    this.listenTo(Actions.getNextPage, this.getNextPage.bind(this));
    this.listenTo(Actions.getPrevPage, this.getPrevPage.bind(this));
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

  reset: function() {
    this.ns = undefined;
    this.filter = {};
    this.sort = [[ '_id', 1 ]];
    this.limit = 0;
    this.skip = 0;
    this.project = null;
    this.counter = 0;
  },

  /**
   * When the next page button is clicked, need to load the next 20 documents.
   * @param {Number} page - The page that is being shown.
   */
  getNextPage(page) {
    const skip = page * NUM_PAGE_DOCS;

    const documentsLoaded = this.counter + NUM_PAGE_DOCS;
    let nextPageCount = 20;
    if (this.limit > 0) {
      nextPageCount = Math.min(Math.max(0, this.limit - documentsLoaded), NUM_PAGE_DOCS);
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
      this.counter += NUM_PAGE_DOCS;
      const length = error ? 0 : documents.length;
      this.trigger(error, documents, skip + 1, skip + length, page);
    });
  },

  /**
   *
   * @param {Number} page - The page that is being shown.
   */
  getPrevPage(page) {
    const skip = page * NUM_PAGE_DOCS;
    const nextPageCount = 20;
    const options = {
      skip: skip + this.skip,
      limit: nextPageCount,
      sort: this.sort,
      fields: this.project,
      promoteValues: false
    };
    global.hadronApp.dataService.find(this.ns, this.filter, options, (error, documents) => {
      this.counter -= NUM_PAGE_DOCS;
      const length = error ? 0 : documents.length;
      this.trigger(error, documents, skip + 1, skip + length, page);
    });
  }

});

module.exports = PageChangedStore;
