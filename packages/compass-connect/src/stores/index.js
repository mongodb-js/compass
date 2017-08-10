const Reflux = require('reflux');
const Actions = require('../actions');
const Connection = require('../models/connection');
const StateMixin = require('reflux-state-mixin');

const ConnectStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: Actions,

  onHostnameChanged(hostname) {
    this.state.currentConnection.hostname = hostname;
    this.trigger(this.state);
  },

  onPortChanged(port) {
    this.state.currentConnection.port = port;
    this.trigger(this.state);
  },

  getInitialState() {
    return {
      currentConnection: new Connection(),
      connections: []
    };
  }
});

module.exports = ConnectStore;
