'use strict';

const Reflux = require('reflux');
const app = require('ampersand-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const Actions = require('../actions');

const DocumentUpdateStore = Reflux.createStore({

  /**
   * Initialize the document update store.
   */
  init: function() {
    this.listenTo(Actions.updateDocument, this._updateDocument);
  },

  /**
   * Update the document.
   *
   * @param {Object} object - The updated object.
   */
  _updateDocument: function(object) {
    var ns = NamespaceStore.ns;
    var filter = { _id: object._id };
    app.dataService.updateOne(ns, filter, object, {}, (error, result) => {
      if (error) {
        this.trigger(object._id, false, error.message);
      } else {
        this.trigger(object._id, true);
      }
    });
  }
});

module.exports = DocumentUpdateStore;
