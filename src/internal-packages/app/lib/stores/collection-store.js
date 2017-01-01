const app = require('ampersand-app');
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
    this.collection = {};
    this.activeTabIndex = 0;
  },

  /**
   * Set the collection information.
   *
   * @param {Object} collection - The collection info.
   */
  setCollection(collection) {
    this.collection = collection;
    if (collection._id) {
      NamespaceStore.ns = collection._id;
    }
  },

  /**
   * Get the collection ns.
   *
   * @returns {String} The collection ns.
   */
  ns() {
    return this.collection._id;
  },

  /**
   * Is the collection readonly?
   *
   * @returns {Boolean} If the collection is readonly.
   */
  isReadonly() {
    return this.collection.readonly;
  },

  /**
   * Is the collection writable?
   *
   * @returns {Boolean} If the collection is writable.
   */
  isWritable() {
    return !this.isReadonly() && app.dataService.isWritable();
  }
});

module.exports = CollectionStore;
