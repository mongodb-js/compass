const Reflux = require('reflux');
const toNS = require('mongodb-ns');

/**
 * The default namespace when the Compass user connects to a MongoDB instance.
 */
const DEFAULT_NAMESPACE = '';

/**
 * The store holds the source of truth for the namespace being worked on.
 */
const NamespaceStore = Reflux.createStore({

  /**
   * Initializing the store should set up the default namespace.
   */
  init() {
    this._ns = DEFAULT_NAMESPACE;
  },

  /**
   * Gets the current namespace being worked with in the application.
   */
  get ns() {
    return this._ns;
  },

  /**
   * Set the current namespace being worked on in the application.
   *
   * @param {String} ns - The current ns.
   */
  set ns(ns) {
    const registry = global.hadronApp.appRegistry;
    if (registry) {
      const oldNs = toNS(this._ns);
      const newNs = toNS(ns);

      if (oldNs.database !== newNs.database) {
        registry.emit('database-changed', ns);
      }
      if (oldNs.database !== newNs.database || oldNs.collection !== newNs.collection) {
        registry.emit('collection-changed', ns);
      }
    }
    // TODO: still trigger if appRegistry is not available?
    this._ns = ns;
    this.trigger(this._ns);
  }
});

module.exports = NamespaceStore;
