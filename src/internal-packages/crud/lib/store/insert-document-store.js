const Reflux = require('reflux');
const app = require('hadron-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const Actions = require('../actions');
const _ = require('lodash');

/**
 * The reflux store for inserting documents.
 */
const InsertDocumentStore = Reflux.createStore({

  /**
   * Initialize the insert document list store.
   */
  init: function() {
    this.filter = {};
    this.listenToExternalStore('Query.ChangedStore', this.onQueryChanged.bind(this));
    this.listenTo(Actions.insertDocument, this.insertDocument);
  },

  /**
   * Insert the document.
   *
   * @param {Document} doc - The document to insert.
   */
  insertDocument: function(doc) {
    app.dataService.insertOne(NamespaceStore.ns, doc, {}, (error) => {
      if (error) {
        this.trigger(false, error);
      }
      // check if the newly inserted document matches the current filter, by
      // running the same filter but targeted only to the doc's _id.
      const filter = _.assign({}, this.filter, { _id: doc._id });
      app.dataService.count(NamespaceStore.ns, filter, {}, (err, count) => {
        if (err) {
          return this.trigger(false, err);
        }
        // count is either 0 or 1, if 1 then the new doc matches the filter
        if (count > 0) {
          return this.trigger(true, doc);
        }
        Actions.closeInsertDocumentDialog();
      });
    });
  },

  /**
   * Fires when the query is changed.
   *
   * @param {Object} state - The query state.
   */
  onQueryChanged: function(state) {
    if (state.filter) {
      this.filter = state.filter;
    }
  }
});

module.exports = InsertDocumentStore;
