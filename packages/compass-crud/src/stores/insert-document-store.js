const Reflux = require('reflux');
const toNS = require('mongodb-ns');
const Actions = require('../actions');

/**
 * The reflux store for inserting documents.
 */
const InsertDocumentStore = Reflux.createStore({

  /**
   * Initialize the insert document list store.
   */
  init: function() {
    this.filter = {};
    this.listenTo(Actions.insertDocument, this.insertDocument.bind(this));
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
   * Insert the document.
   *
   * @param {Document} doc - The document to insert.
   */
  insertDocument: function(doc) {
    global.hadronApp.dataService.insertOne(this.ns, doc, {}, (error) => {
      if (error) {
        return this.trigger(error);
      }
      // check if the newly inserted document matches the current filter, by
      // running the same filter but targeted only to the doc's _id.
      const filter = Object.assign({}, this.filter, { _id: doc._id });
      global.hadronApp.dataService.count(this.ns, filter, {}, (err, count) => {
        if (err) {
          return this.trigger(err);
        }
        // count is greater than 0, if 1 then the new doc matches the filter
        if (count > 0) {
          return this.trigger(null, doc);
        }
        Actions.closeInsertDocumentDialog();
      });
    });
  },

  /**
   * Trigger if a document has been inserted. Needed for when we use a different
   * insert document store when cloning.
   *
   * @param {Object} doc - The document inserted.
   */
  documentInserted(doc) {
    this.trigger(null, doc, true);
  },

  /**
   * Fires when the query is changed.
   *
   * @param {Object} state - The query state.
   */
  onQueryChanged: function(state) {
    if (state.ns && toNS(state.ns).collection && state.filter) {
      this.filter = state.filter;
    }
  }
});

module.exports = InsertDocumentStore;
