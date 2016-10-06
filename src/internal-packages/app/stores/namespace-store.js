const Reflux = require('reflux');
const NamespaceActions = require('../actions/namespace-actions');
const StateMixin = require('reflux-state-mixin');

// Currently a placeholder
// Replace hadron-reflux-store.NamespaceStore with this
const NamespaceStore = Reflux.createStore({

  /**
  * adds a state to the store, similar to React.Component's state
  * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
  */
  mixins: [StateMixin.store],

  /**
  * listen to all actions defined in ../actions/index.jsx
  */
  listenables: NamespaceActions,

  /**
  * Initialize everything that is not part of the store's state.
  */
  init() {},

  /**
  * Initialize the Compass Sidebar store state.
  *
  * @return {Object} initial store state.
  */
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
