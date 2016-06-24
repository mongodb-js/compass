'use strict';

const Reflux = require('reflux');
const app = require('ampersand-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
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
      app.dataService.count(ns, filter, {}, (err, count) => {
        var options = { limit: 20, sort: [[ '_id', 1 ]] };
        app.dataService.find(ns, filter, options, (error, documents) => {
          this.trigger(documents, true, count);
        });
      });
    }
  },

  /**
   * Fetch the next page of documents.
   *
   * @param {Integer} currentPage - The current page in the view.
   */
  _fetchNextDocuments: function(currentPage) {
    var ns = NamespaceStore.ns;
    if (ns) {
      var filter = app.queryOptions.query.serialize();
      var options = { skip: (currentPage * 20), limit: 20, sort: [[ '_id', 1 ]] };
      app.dataService.find(ns, filter, options, (error, documents) => {
        if (app.isFeatureEnabled('treasureHunt')) {
          if (documents.length === 1 && documents[0]._id === '') {
            metrics.track('Treasure Hunt', 'stage7');
          }
        }

          this.trigger(documents, false);
      });
    }
  }
});

module.exports = DocumentListStore;
