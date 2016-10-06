const Reflux = require('reflux');
const ApplicationActions = require('../actions/application-actions');
const StateMixin = require('reflux-state-mixin');

// Currently a placeholder
// Replace hadron-reflux-store.ApplicationStore with this
const ApplicationStore = Reflux.createStore({

  /**
  * adds a state to the store, similar to React.Component's state
  * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
  */
  mixins: [StateMixin.store],

  /**
  * listen to all actions defined in ../actions/index.jsx
  */
  listenables: ApplicationActions,

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
      instance: null
    };
  },

  setInstance(instance) {
    this.setState({ instance });
  },

  refreshInstance() {
    this.state.instance.fetch();
  }
});

module.exports = ApplicationStore;
