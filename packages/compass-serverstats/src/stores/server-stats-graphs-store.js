const app = require('ampersand-app');
const Reflux = require('reflux');
const Actions = require('../actions');
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
    // app.dataService.serverstats((error, doc) => {
    //   this.trigger(error, doc, this.isPaused);
    //   if (error) {
    //     Actions.dbError({ 'op': 'serverStatus', 'error': error });
    //   }
    // });
  },

  pause: function() {
    this.isPaused = !this.isPaused;
  }
});

module.exports = ServerStatsStore;
