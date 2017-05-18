const Reflux = require('reflux');
const InstanceActions = require('../actions/instance-actions');
const StateMixin = require('reflux-state-mixin');

const debug = require('debug')('mongodb-compass:app:instance-store');

const { LOADING_STATE } = require('../constants');

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
        databases: LOADING_STATE,
        collections: LOADING_STATE,
        build: {},
        hostname: 'Retrieving host information',
        port: ''
      }
    };
  },

  setInstance(instance) {
    this.setState({ instance });
  },

  refreshInstance() {
    if (this.state.instance.fetch) {
      this.state.instance.fetch({
        success: (instance) => {
          debug('Setting refetched instance', instance);
          this.setInstance(instance);
        },
        error: (instance, response) => {
          debug('Failed to refetch instance', response);
        }
      });
      // Only reset to initial state if fetched successfully at least once
      this.setState(this.getInitialState());
    }
  }
});

module.exports = InstanceStore;
