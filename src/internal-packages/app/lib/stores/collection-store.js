const Reflux = require('reflux');
const { NamespaceStore } = require('hadron-reflux-store');

/**
 * Sets global collection information.
 */
const CollectionStore = Reflux.createStore({

  /**
   * Initialize the store.
   */
  init() {
    this.ns = null;
    this.readonly = null;
  },

  /**
   * Set the collection information.
   *
   * @param {Object} collection - The collection info.
   */
  setCollection(collection) {
    this.ns = collection._id;
    this.readonly = collection.readonly;
    if (collection._id) {
      NamespaceStore.ns = this.ns;
    }
  }
});

module.exports = CollectionStore;
