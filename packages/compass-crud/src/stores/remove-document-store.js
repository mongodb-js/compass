const Reflux = require('reflux');
const Actions = require('../actions');

/**
 * The reflux store for removing a document from the list.
 */
const RemoveDocumentStore = Reflux.createStore({

  /**
   * Initialize the reset document list store.
   */
  init: function() {
    this.listenTo(Actions.documentRemoved, this.remove);
  },

  /**
   * This function is called when when a document is deleted.
   *
   * @param {Object} id - The document id.
   */
  remove: function(id) {
    this.trigger(id);
  }
});

module.exports = RemoveDocumentStore;
