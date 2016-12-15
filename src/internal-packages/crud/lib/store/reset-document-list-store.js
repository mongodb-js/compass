const Reflux = require('reflux');
const app = require('ampersand-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const ReadPreference = require('mongodb').ReadPreference;
const toNS = require('mongodb-ns');
const Actions = require('../actions');

// const debug = require('debug')('mongodb-compass:crud');

// const debug = require('debug')('mongodb-compass:crud:store');

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
    this.filter = {};

    // listen for namespace changes
    NamespaceStore.listen((ns) => {
      if (ns && toNS(ns).collection) {
        this.reset();
      }
    });

    // listen for documents newly inserted
    this.listenToExternalStore('CRUD.InsertDocumentStore', this.onDocumentInserted.bind(this));

    // listen for query changes
    this.listenToExternalStore('Query.ChangedStore', this.onQueryChanged.bind(this));

    Actions.refreshDocuments.listen(this.reset.bind(this));
  },

  /**
   * Fires when a document is inserted,
   * so the newly inserted document is displayed to the user.
   */
  onDocumentInserted: function() {
    this.reset();
  },

  /**
   * Fires when the query is changed.
   *
   * @param {Object} state - The query state.
   */
  onQueryChanged: function(state) {
    if (state.query) {
      this.filter = state.query;
      this.reset();
    }
  },

  /**
   * This function is called when the collection filter changes.
   */
  reset: function() {
    if (NamespaceStore.ns) {
      app.dataService.count(NamespaceStore.ns, this.filter, OPTIONS, (err, count) => {
        if (!err) {
          const options = {
            limit: 20,
            sort: [[ '_id', 1 ]],
            readPreference: READ,
            promoteValues: false
          };
          app.dataService.find(NamespaceStore.ns, this.filter, options, (error, documents) => {
            this.trigger(error, documents, count);
          });
        } else {
          // If the count gets an error we need to display this to the user since
          // they have the wrong privs.
          this.trigger(err);
        }
      });
    }
  }
});

module.exports = ResetDocumentListStore;
