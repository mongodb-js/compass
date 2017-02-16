const Reflux = require('reflux');
const app = require('hadron-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const ReadPreference = require('mongodb').ReadPreference;
const toNS = require('mongodb-ns');
const Actions = require('../actions');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:crud:reset-store');

/**
 * The default read preference.
 */
const READ = ReadPreference.PRIMARY_PREFERRED;

/**
 * The reflux store for resetting the document list.
 */
const ResetDocumentListStore = Reflux.createStore({

  /**
   * Initialize the reset document list store.
   */
  init: function() {
    this.filter = {};
    this.sort = [[ '_id', 1 ]];
    this.limit = 0;
    this.skip = 0;
    this.project = null;

    // listen for namespace changes
    NamespaceStore.listen((ns) => {
      if (ns && toNS(ns).collection) {
        this.filter = {};
        this.sort = [[ '_id', 1 ]];
        this.limit = 0;
        this.skip = 0;
        this.project = null;

        this.reset();
      }
    });

    // listen for query changes
    this.listenToExternalStore('Query.ChangedStore', this.onQueryChanged.bind(this));

    Actions.refreshDocuments.listen(this.reset.bind(this));
  },

  /**
   * Fires when the query is changed.
   *
   * @param {Object} state - The query state.
   */
  onQueryChanged: function(state) {
    this.filter = state.filter || {};
    this.sort = _.pairs(state.sort);
    this.limit = state.limit;
    this.skip = state.skip;
    this.project = state.project;

    this.reset();
  },

  /**
   * This function is called when the collection filter changes.
   *
   * @param {Object} filter - The query filter.
   */
  reset: function() {
    if (NamespaceStore.ns) {
      const countOptions = {
        skip: this.skip,
        readPreference: READ
      };

      const findOptions = {
        sort: this.sort,
        fields: this.project,
        skip: this.skip,
        limit: 20,
        readPreference: READ,
        promoteValues: false
      };

      // only set limit if it's > 0, read-only views cannot handle 0 limit.
      if (this.limit > 0) {
        countOptions.limit = this.limit;
        findOptions.limit = Math.min(20, this.limit);
      }

      app.dataService.count(NamespaceStore.ns, this.filter, countOptions, (err, count) => {
        if (!err) {
          app.dataService.find(NamespaceStore.ns, this.filter, findOptions, (error, documents) => {
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
