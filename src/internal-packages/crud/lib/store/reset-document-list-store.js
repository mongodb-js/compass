const Reflux = require('reflux');
const app = require('ampersand-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const ReadPreference = require('mongodb').ReadPreference;
const toNS = require('mongodb-ns');

const debug = require('debug')('mongodb-compass:crud');
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
    // listen for namespace changes
    NamespaceStore.listen((ns) => {
      if (ns && toNS(ns).collection) {
        this.reset();
      }
    });

    // listen for query changes
    this.listenToExternalStore('Query.ChangedStore', this.onQueryChanged.bind(this));
  },

  onQueryChanged: function(state) {
    this.reset(state.query);
  },

  /**
   * This function is called when the collection filter changes.
   *
   * @param {Object} filter - The query filter.
   */
  reset: function(filter) {
    // since reset is called twice when NS changes, exit early when filter is undefined
    if (filter === null) {
      return;
    }
    debug('reset is called....');
    if (NamespaceStore.ns) {
      app.dataService.count(NamespaceStore.ns, filter, OPTIONS, (err, count) => {
        if (!err) {
          const options = { limit: 20, sort: [[ '_id', 1 ]], readPreference: READ };
          app.dataService.find(NamespaceStore.ns, filter, options, (error, documents) => {
            if (!error) {
              debug('reset is called.... 2');
              this.trigger(documents, count);
            }
          });
        }
      });
    }
  }
});

module.exports = ResetDocumentListStore;
