const app = require('hadron-app');
const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const electronApp = require('electron').remote.app;
const { UI_STATES } = require('../constants');

const debug = require('debug')('mongodb-compass:stores:home');

const HomeStore = Reflux.createStore({

  mixins: [StateMixin.store],

  onActivated(appRegistry) {
    // set up listeners on external stores
    appRegistry.getStore('App.InstanceStore').listen(this.onInstanceChange.bind(this));
  },

  onCollectionChanged(namespace) {
    this.onNamespaceChange(namespace);
  },

  onDatabaseChanged(namespace) {
    this.onNamespaceChange(namespace);
  },

  getInitialState() {
    return {
      errorMessage: '',
      namespace: '',
      uiStatus: UI_STATES.INITIAL
    };
  },

  onConnected() {
    const StatusAction = app.appRegistry.getAction('Status.Actions');
    StatusAction.configure({
      animation: true,
      message: 'Loading navigation',
      visible: true
    });

    this.setState({
      uiStatus: UI_STATES.LOADING
    });
  },

  onInstanceChange(state) {
    if (state.errorMessage) {
      this.setState({
        errorMessage: state.errorMessage,
        uiStatus: UI_STATES.ERROR
      });
      return;
    }
    this.setState({
      uiStatus: UI_STATES.COMPLETE
    });
    this.updateTitle();
  },

  /**
   * change content based on namespace
   * @param {object} namespace - current namespace context
   */
  onNamespaceChange(namespace) {
    this.setState({namespace: namespace});
    this.updateTitle(namespace);
  },

  updateTitle: function(namespace) {
    let title = `${electronApp.getName()} - ${app.connection.instance_id}`;
    if (namespace) {
      title += '/' + namespace;
    }
    document.title = title;
  },

  /**
  * log changes to the store as debug messages.
  * @param  {Object} prevState   previous state.
  */
  storeDidUpdate(prevState) {
    debug('Sidebar store changed from', prevState, 'to', this.state);
  }
});

module.exports = HomeStore;
