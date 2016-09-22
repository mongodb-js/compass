const Reflux = require('reflux');
const app = require('ampersand-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const Action = require('hadron-action');

/**
 * The reflux store for resetting the document list.
 */
const ResetDocumentListStore = Reflux.createStore({

  /**
   * Initialize the reset document list store.
   */
  init: function() {
    this.listenTo(Action.filterChanged, this.reset);
  },

  /**
   * This function is called when the collection filter changes.
   *
   * @param {Object} filter - The query filter.
   */
  reset: function(filter) {
    if (NamespaceStore.ns) {
      app.dataService.count(NamespaceStore.ns, filter, {}, (err, count) => {
        if (!err) {
          const options = { limit: 20, sort: [[ '_id', 1 ]] };
          app.dataService.find(NamespaceStore.ns, filter, options, (error, documents) => {
            if (!error) {
              this.trigger(documents, count);
            }
          });
        }
      });
    }
  }
});

module.exports = ResetDocumentListStore;
