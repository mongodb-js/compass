'use strict';

const Reflux = require('reflux');
const app = require('ampersand-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const Action = require('hadron-action');
const metrics = require('mongodb-js-metrics')();

/**
 * The reflux store for resetting the document list.
 */
const ResetDocumentListStore = Reflux.createStore({

  /**
   * Initialize the reset document list store.
   */
  init: function() {
    this.listenTo(Action.filterChanged, this.reset);
  },

  /**
   * This function is called when the collection filter changes.
   *
   * @param {Object} filter - The query filter.
   */
  reset: function(filter) {
    app.dataService.count(NamespaceStore.ns, filter, {}, (err, count) => {
      var options = { limit: 20, sort: [[ '_id', 1 ]] };
      app.dataService.find(NamespaceStore.ns, filter, options, (error, documents) => {
        if (app.isFeatureEnabled('treasureHunt')) {
          if (documents && documents.length === 1 &&
            documents[0]._id.toHexString() === '576cd312d141109b51ae6b86') {
            metrics.track('Treasure Hunt', 'stage7');
          }
        }
        this.trigger(documents, count);
      });
    });
  },
});

module.exports = ResetDocumentListStore;
