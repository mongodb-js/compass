const Reflux = require('reflux');
const InstanceActions = require('../actions/instance-actions');
const StateMixin = require('reflux-state-mixin');
const _ = require('lodash');

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

    let isWaitingForMinimumTimeout = true;
    let isFetching = true;
    // Set fetching back to false once 500ms has passed and the actual fetch comples
    // There's probably a more elegant way to do this with promises...
    _.delay(() => {
      isWaitingForMinimumTimeout = false;
      if (!isFetching) {
        debug('delayed fetch');
        this.setState({ fetching: false});
      }
    }, 500);

    function handleFetchCallback() {
      isFetching = false;
      if (!isWaitingForMinimumTimeout) {
        debug('not delayed fetch');
        this.setState({ fetching: false });
      }
    }

    if (this.state.instance.fetch) {
      this.state.instance.fetch({
        success: () => {
          // TODO: Remove setInstance inside HomeView.onInstanceFetched and set here
          handleFetchCallback.call(this);
        },
        error: (instance, response) => {
          debug('Failed to refetch instance', response);
          handleFetchCallback.call(this);
        }
      });
    }
  }
});

module.exports = InstanceStore;
