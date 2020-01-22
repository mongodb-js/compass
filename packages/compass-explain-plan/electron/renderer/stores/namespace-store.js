const Reflux = require('reflux');
const app = require('hadron-app');
const { includes } = require('lodash');
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

  /**
   * Formats the namespace.
   *
   * @param {String} ns - The namespace.
   *
   * @return {Array} The formated namespace.
   */
  __nsHelper: (ns) => {
    if (!ns) {
      return ['', ''];
    }

    if (includes(ns, '.')) {
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
        registry.emit('database-changed', ns);
      }

      if (oldNns[1] !== newNs[1]) {
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
