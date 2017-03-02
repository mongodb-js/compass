const ipc = require('hadron-ipc');
const Reflux = require('reflux');
const ObjectId = require('bson').ObjectId;
const Actions = require('../actions');
const HadronDocument = require('hadron-document');

// const debug = require('debug')('mongodb-compass:crud:store:open-insert-doc');

/**
 * The reflux store for opening the insert document dialog.
 */
const OpenInsertDocumentDialogStore = Reflux.createStore({

  /**
   * Initialize the reset document list store.
   */
  init: function() {
    this.listenTo(Actions.openInsertDocumentDialog, this.openInsertDocumentDialog.bind(this));
    ipc.on('window:menu-open-insert-document-dialog', () => {
      this.openInsertDocumentDialog({ _id: new ObjectId(), '': '' }, false);
    });
  },

  /**
   * Open the insert document dialog.
   *
   * @param {Object} doc - The document to open the dialog with.
   * @param {Boolean} clone - If the operation is a clone.
   */
  openInsertDocumentDialog: function(doc, clone) {
    const hadronDoc = new HadronDocument(doc, true);
    if (clone) {
      // We need to remove the _id or we will get an duplicate key error on
      // insert, and we currently do not allow editing of the _id field.
      for (const element of hadronDoc.elements) {
        if (element.currentKey === '_id') {
          hadronDoc.elements.remove(element);
          break;
        }
      }
    }
    this.trigger(hadronDoc);
  }
});

module.exports = OpenInsertDocumentDialogStore;
