const app = require('ampersand-app');
const Reflux = require('reflux');
const Actions = require('../action');

const ServerStatsStore = Reflux.createStore({

  init: function() {
    this.listenTo(Actions.pollServerStats, this.serverStats);
    this.listenTo(Actions.pause, this.pause);
    this.isPaused = false;
  },

  serverStats: function() {
    app.dataService.serverstats((error, doc) => {
      this.trigger(error, doc, this.isPaused);
    });
  },

  pause: function() {
    this.isPaused = !this.isPaused;
  }
});

module.exports = ServerStatsStore;
