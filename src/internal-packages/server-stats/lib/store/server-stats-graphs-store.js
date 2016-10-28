const app = require('ampersand-app');
const Reflux = require('reflux');
const Actions = require('../action');
// const debug = require('debug')('mongodb-compass:server-stats:server-stats-graphs-store');

const ServerStatsStore = Reflux.createStore({

  init: function() {
    this.restart();
    this.listenTo(Actions.pollServerStats, this.serverStats);
    this.listenTo(Actions.restart, this.restart);
    this.listenTo(Actions.pause, this.pause);
  },

  restart: function() {
    this.isPaused = false;
  },

  serverStats: function() {
    this.trigger(null, null, this.isPaused);
  },

  pause: function() {
    this.isPaused = !this.isPaused;
  }
});

module.exports = ServerStatsStore;
