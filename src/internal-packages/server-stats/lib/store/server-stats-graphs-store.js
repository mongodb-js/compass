const Reflux = require('reflux');
const Actions = require('../action');
const { DataServiceActions } = require('mongodb-data-service');

const ServerStatsStore = Reflux.createStore({

  init: function() {
    this.restart();
    this.listenTo(DataServiceActions.serverStatsComplete, this.serverStats);
    this.listenTo(Actions.restart, this.restart);
    this.listenTo(Actions.pause, this.pause);
  },

  restart: function() {
    this.isPaused = false;
  },

  serverStats: function(error, doc) {
    if (error === null && this.error !== null) { // Trigger error removal
      Actions.dbError({'op': 'serverStatus', 'error': null });
    } else if (error !== null) {
      Actions.dbError({'op': 'serverStatus', 'error': error });
    }
    this.trigger(error, doc, this.isPaused);
  },

  pause: function() {
    this.isPaused = !this.isPaused;
  }
});

module.exports = ServerStatsStore;
