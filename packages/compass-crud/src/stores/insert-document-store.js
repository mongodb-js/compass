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
    this.listenTo(Actions.insertDocument, this.insertDocument);
  },

  onActivated(appRegistry) {
    appRegistry.getStore('Query.ChangedStore').listen(this.onQueryChanged.bind(this));
    this.NamespaceStore = appRegistry.getStore('App.NamespaceStore');
  },

  /**
   * Insert the document.
   *
   * @param {Document} doc - The document to insert.
   */
  insertDocument: function(doc) {
    global.hadronApp.dataService.insertOne(this.NamespaceStore.ns, doc, {}, (error) => {
      if (error) {
        return this.trigger(false, error);
      }
      // check if the newly inserted document matches the current filter, by
      // running the same filter but targeted only to the doc's _id.
      const filter = Object.assign({}, this.filter, { _id: doc._id });
      global.hadronApp.dataService.count(this.NamespaceStore.ns, filter, {}, (err, count) => {
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
    if (state.ns && toNS(state.ns).collection && state.filter) {
      this.filter = state.filter;
    }
  }
});

module.exports = InsertDocumentStore;
