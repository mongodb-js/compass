const Reflux = require('reflux');
const app = require('hadron-app');
const _ = require('lodash');
const debug = require('debug')('mongodb-compass:namespace-store');

/**
 * The store holds the source of truth for the namespace being worked on.
 */
const NamespaceStore = Reflux.createStore({
  /**
   * Gets the current namespace being worked with in the application.
   */
  get ns() {
    debug('getting ns:', this._ns);
    return this._ns;
  },

  __nsHelper: function(ns) {
    if (!ns) {
      return ['', ''];
    }
    if (_.includes(ns, '.')) {
      return ns.split('.');
    }

    return [ns, ''];
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
      const oldNns = this.__nsHelper(this._ns);
      const newNs = this.__nsHelper(ns);

      if (oldNns[0] !== newNs[0]) {
        registry.callOnStores(function(store) {
          if (store.onDatabaseChanged) {
            store.onDatabaseChanged(ns);
          }
        });
      }
      if (oldNns[1] !== newNs[1]) {
        registry.callOnStores(function(store) {
          if (store.onCollectionChanged) {
            store.onCollectionChanged(ns);
          }
        });
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
