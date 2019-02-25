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

  onActivated(appRegistry) {
    appRegistry.on('data-service-connected', this.onConnected.bind(this));
    appRegistry.on('data-service-disconnected', this.onDisconnected.bind(this));
    appRegistry.on('agg-pipeline-out-executed', this.refreshInstance.bind(this));
  },

  onConnected(err, dataService) {
    if (!err) {
      this.dataService = dataService;
    }
  },

  onDisconnected() {
    const MongoDBInstance = require('../../../../app/models/mongodb-instance');
    app.state.instance = new MongoDBInstance();
    this.setState(this.getInitialState());
  },

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
      success: this.onFirstFetch.bind(this),
      dataService: this.dataService
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

    const StatusAction = app.appRegistry.getAction('Status.Actions');
    StatusAction.hide();
  },

  /**
   * Run just once after the first set of instance data is fetched.
   */
  onFirstFetch() {
    debug('First fetch complete.');
    const StatusAction = app.appRegistry.getAction('Status.Actions');
    StatusAction.hide();

    this.state.instance = app.instance;
    this.trigger(this.state);
  },

  refreshInstance() {
    if (this.state.instance.fetch) {
      const StatusAction = app.appRegistry.getAction('Status.Actions');
      StatusAction.configure({
        animation: true,
        message: 'Loading databases',
        visible: true
      });
      this.state.instance.fetch({
        error: this.handleError.bind(this),
        success: (instance) => {
          debug('Setting refetched instance', instance);
          this.state.instance = instance;
          this.trigger(this.state);
          app.appRegistry.emit('instance-refreshed');
          StatusAction.hide();
        },
        dataService: this.dataService
      });
    }
  }
});

module.exports = InstanceStore;
