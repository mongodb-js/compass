const Reflux = require('reflux');
const Actions = require('../actions');
const StateMixin = require('reflux-state-mixin');

const ConnectStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: Actions,

  changeUsername() {

  },

  getInitialState() {
    return {
      currentConnection: null,
      connections: []
    };
  }
});

module.exports = ConnectStore;
