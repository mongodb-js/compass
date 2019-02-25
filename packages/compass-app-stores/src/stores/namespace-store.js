const Reflux = require('reflux');
const app = require('hadron-app');
const toNS = require('mongodb-ns');
const debug = require('debug')('mongodb-compass:namespace-store');

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

  onActivated(appRegistry) {
    appRegistry.on('data-service-disconnected', this.onDisconnected.bind(this));
  },

  onDisconnected() {
    this.init();
  },

  /**
   * Gets the current namespace being worked with in the application.
   */
  get ns() {
    debug('getting ns:', this._ns);
    return this._ns;
  },

  /**
   * Set the current namespace being worked on in the application.
   *
   * @param {String} ns - The current ns.
   */
  set ns(ns) {
    debug('setting ns: from', this._ns, 'to', ns);
    const registry = app.appRegistry;
    if (registry) {
      const oldNs = toNS(this._ns);
      const newNs = toNS(ns);

      if (oldNs.database !== newNs.database) {
        registry.emit('database-changed', ns);
      }
      if (oldNs.database !== newNs.database || oldNs.collection !== newNs.collection) {
        registry.emit('collection-changed', ns);
      }
    } else {
      debug('Error: AppRegistry not available');
    }
    // TODO: still trigger if appRegistry is not available?
    this._ns = ns;
    this.trigger(this._ns);
  }
});

module.exports = NamespaceStore;
