const Reflux = require('reflux');
const NamespaceActions = require('../actions/namespace-actions');
const StateMixin = require('reflux-state-mixin');

// Currently a placeholder
// Replace hadron-reflux-store.NamespaceStore with this
const NamespaceStore = Reflux.createStore({

  mixins: [StateMixin.store],

  listenables: NamespaceActions,

  init() {},

  getInitialState() {
    return {
      ns: null
    };
  },

  setNamespace(ns) {
    this.setState({ ns });
  }
});

module.exports = NamespaceStore;
