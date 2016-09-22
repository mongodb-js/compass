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
   * @param {Booelan} clone - If the operation is a clone.
   */
  openInsertDocumentDialog: function(doc, clone) {
    const hadronDoc = new HadronDocument(doc, true);
    if (clone) {
      const firstElement = hadronDoc.elements.firstElement;
      // We need to remove the _id or we will get an duplicate key error on
      // insert, and we currently do not allow editing of the _id field.
      if (firstElement.currentKey === '_id') {
        hadronDoc.elements.remove(firstElement);
      }
    }
    this.trigger(hadronDoc);
  }
});

module.exports = OpenInsertDocumentDialogStore;
