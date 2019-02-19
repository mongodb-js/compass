const app = require('hadron-app');
const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');

const InstanceStore = Reflux.createStore({

  /**
  * adds a state to the store, similar to React.Component's state
  * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
  */
  mixins: [StateMixin.store],

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
    const MongoDBInstance = require('mongodb-instance-model');
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
        databases: null,
        collections: null,
        build: {},
        hostname: 'Retrieving host information',
        port: ''
      }
    };
  },

  fetchFirstInstance() {
    console.log("HERE!");
    // TODO: COMPASS-562, de-ampersand instance-model
    global.hadronApp.instance.fetch({
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
  },

  /**
   * Run just once after the first set of instance data is fetched.
   */
  onFirstFetch() {
    this.state.instance = app.instance;
    this.trigger(this.state);
  },

  refreshInstance() {
    if (this.state.instance.fetch) {
      this.state.instance.fetch({
        error: this.handleError.bind(this),
        success: (instance) => {
          this.state.instance = instance;
          this.trigger(this.state);
          // app.appRegistry.emit('instance-refreshed');
        },
        dataService: this.dataService
      });
    }
  }
});

module.exports = InstanceStore;
