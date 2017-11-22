const Reflux = require('reflux');
const { NamespaceStore } = require('mongodb-reflux-store');

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
   * Set the active tab idx for the current collection
   * @param {number} idx current tab idx
   */
  setActiveTab(idx) {
    this.activeTabIndex = idx;
  },

  /**
   * Get the active tab idx for the current collection
   * @returns {number} the current idx
   */
  getActiveTab() {
    return this.activeTabIndex;
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
  }
});

module.exports = CollectionStore;
