'use strict';

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
 * The default options.
 */
const OPTIONS = { readPreference: READ };

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
    if (NamespaceStore.ns) {
      app.dataService.count(NamespaceStore.ns, filter, OPTIONS, (err, count) => {
        if (!err) {
          const options = { limit: 20, sort: [[ '_id', 1 ]], readPreference: READ };
          app.dataService.find(NamespaceStore.ns, filter, options, (error, documents) => {
            if (!error) {
              this.trigger(documents, count);
            }
          });
        }
      });
    }
  },
});

module.exports = ResetDocumentListStore;
