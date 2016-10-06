const Reflux = require('reflux');
const InstanceActions = require('../actions/instance-actions');
const StateMixin = require('reflux-state-mixin');

const debug = require('debug', 'mongodb-compass:app:instance-store');

const InstanceStore = Reflux.createStore({

  /**
  * adds a state to the store, similar to React.Component's state
  * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
  */
  mixins: [StateMixin.store],

  /**
  * listen to all actions defined in ../actions/index.jsx
  */
  listenables: InstanceActions,

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
      instance: {
        databases: [],
        collections: [],
        build: {},
        hostname: '',
        port: null
      },
      fetching: false
    };
  },

  setInstance(instance) {
    this.setState({ instance });
  },

  refreshInstance() {
    this.setState({ fetching: true });
    this.state.instance.fetch({
      success: () => {
        // TODO: Remove setInstance inside HomeView.onInstanceFetched and set here
        this.setState({ fetching: false });
      },
      error: (instance, response) => {
        debug('Failed to refetch instance', response);
        this.setState({ fetching: false});
      }
    });
  }
});

module.exports = InstanceStore;
