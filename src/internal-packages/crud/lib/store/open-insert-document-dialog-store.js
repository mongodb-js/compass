'use strict';

const Reflux = require('reflux');
const Actions = require('../actions');
const HadronDocument = require('hadron-document');

/**
 * The reflux store for opening the insert document dialog.
 */
const OpenInsertDocumentDialogStore = Reflux.createStore({

  /**
   * Initialize the reset document list store.
   */
  init: function() {
    this.listenTo(Actions.openInsertDocumentDialog, this.openInsertDocumentDialog);
  },

  /**
   * Open the insert document dialog.
   *
   * @param {Object} doc - The document to open the dialog with.
   */
  openInsertDocumentDialog: function(doc) {
    var hadronDoc = new HadronDocument(doc);
    // We need to remove the _id or we will get an duplicate key error on
    // insert, and we currently do not allow editing of the _id field.
    hadronDoc.elements.shift();
    this.trigger(hadronDoc);
  }
});

module.exports = OpenInsertDocumentDialogStore;
