const Reflux = require('reflux');
const app = require('hadron-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
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
    this.docCount = 0;
    this.listenToExternalStore('Query.ChangedStore', this.onQueryChanged.bind(this));
    this.listenToExternalStore('CRUD.ResetDocumentListStore', this.onDocRefresh.bind(this));
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
      app.dataService.count(NamespaceStore.ns, this.filter, {}, (err, count) => {
        if (err) {
          return this.trigger(false, err);
        }
        if (count > this.docCount) {
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
  },

  /**
   * Fires when the doc list has been refreshed
   * @param  {error} err   error object
   * @param  {collection} docs  returned docs
   * @param  {number} count number of docs returned
   */
  onDocRefresh: function(err, docs, count) {
    if (err) {
      return;
    }
    this.docCount = count;
  }
});

module.exports = InsertDocumentStore;
