const Reflux = require('reflux');
const app = require('ampersand-app');
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
    this.listenTo(Actions.insertDocument, this.insertDocument);
  },

  /**
   * Insert the document.
   *
   * @param {Document} doc - The document to insert.
   */
  insertDocument: function(doc) {
    app.dataService.insertOne(NamespaceStore.ns, doc, {}, this.handleResult.bind(this));
  },

  /**
   * Handle the result from the driver.
   *
   * @param {Error} error - The error.
   * @param {Object} doc - The document.
   *
   * @returns {Object} The trigger event.
   */
  handleResult: function(error, doc) {
    return (error) ? this.trigger(false, error) : this.trigger(true, doc);
  }
});

module.exports = InsertDocumentStore;
