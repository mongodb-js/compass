const Reflux = require('reflux');
const app = require('hadron-app');
const _ = require('lodash');

/**
 * The store holds the source of truth for the namespace being worked on.
 */
const NamespaceStore = Reflux.createStore({
  /**
   * Gets the current namespace being worked with in the application.
   */
  get ns() {
    return this._ns;
  },

  nsHelper: function(ns) {
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
    const oldNns = this.nsHelper(this._ns);
    const newNs = this.nsHelper(ns);

    if (oldNns[0] !== newNs[0]) {
      app.appRegistry.callOnStores(function(store) {
        if (store.onDatabaseChanged) {
          store.onDatabaseChanged(this);
        }
      });
    }
    if (oldNns[1] !== newNs[1]) {
      app.appRegistry.callOnStores(function(store) {
        if (store.onCollectionChanged) {
          store.onCollectionChanged(this);
        }
      });
    }
    this._ns = ns;
    this.trigger(this._ns);
  }
});

module.exports = NamespaceStore;
