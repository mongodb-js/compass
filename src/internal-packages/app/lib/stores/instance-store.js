const app = require('hadron-app');
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
  * Initialize the Compass Sidebar store state.
  *
  * @return {Object} initial store state.
  */
  getInitialState() {
    return {
      errorMessage: '',
      instance: {
        databases: LOADING_STATE,
        collections: LOADING_STATE,
        build: {},
        hostname: 'Retrieving host information',
        port: ''
      }
    };
  },

  fetchFirstInstance() {
    // TODO: COMPASS-562, de-ampersand instance-model
    debug('fetching instance model...');
    app.instance.fetch({
      error: this.handleError.bind(this),
      success: this.onFirstFetch.bind(this)
    });
  },

  /**
   * Handles any errors from fetching an instance.
   */
  handleError(model, resp, options) {
    // Handle the curious output of wrap-error.js
    const err = options.error.arguments[2];

    if (err) {
      this.setState({
        errorMessage: err
      });
    }

    const StatusActions = app.appRegistry.getAction('Status.Actions');
    StatusActions.hide();
  },

  /**
   * Run just once after the first set of instance data is fetched.
   */
  onFirstFetch() {
    const StatusActions = app.appRegistry.getAction('Status.Actions');
    StatusActions.hide();

    const instance = app.instance;
    debug('instance fetched', instance.serialize());
    this.setState({ instance });

    const metrics = require('mongodb-js-metrics')();
    metrics.track('Deployment', 'detected', {
      'databases count': instance.databases.length,
      'namespaces count': instance.collections.length,
      'mongodb version': instance.build.version,
      'enterprise module': instance.build.enterprise_module,
      'longest database name length': Math.max(...instance.databases.map(function(db) {
        return db._id.length;
      })),
      'longest collection name length': Math.max(...instance.collections.map(function(col) {
        return col._id.split('.')[1].length;
      })),
      'server architecture': instance.host.arch,
      'server cpu cores': instance.host.cpu_cores,
      'server cpu frequency (mhz)': instance.host.cpu_frequency / 1000 / 1000,
      'server memory size (gb)': instance.host.memory_bits / 1024 / 1024 / 1024
    });
  },

  refreshInstance() {
    if (this.state.instance.fetch) {
      const StatusActions = app.appRegistry.getAction('Status.Actions');
      StatusActions.configure({
        animation: true,
        message: 'Loading databases',
        visible: true
      });
      this.state.instance.fetch({
        error: this.handleError.bind(this),
        success: (instance) => {
          debug('Setting refetched instance', instance);
          this.setState({ instance });
          StatusActions.hide();
        }
      });
      // Only reset to initial state if fetched successfully at least once
      this.setState(this.getInitialState());
    }
  }
});

module.exports = InstanceStore;
