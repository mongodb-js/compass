const Reflux = require('reflux');
const Actions = require('../actions');
const Connection = require('../models/connection');
const StateMixin = require('reflux-state-mixin');

const ConnectStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: Actions,

  changeUsername() {

  },

  getInitialState() {
    return {
      currentConnection: new Connection(),
      connections: []
    };
  }
});

module.exports = ConnectStore;
