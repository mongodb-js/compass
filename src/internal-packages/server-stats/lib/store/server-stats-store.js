'use strict';

const app = require('ampersand-app');
const Reflux = require('reflux');
const Actions = require('../action');

const ServerStatsStore = Reflux.createStore({

  init: function() {
    this.listenTo(Actions.pollServerStats, this.serverStats);
  },

  serverStats: function() {
    app.dataService.serverstats((error, doc) => {
      this.trigger(error, doc);
    });
  }
});

module.exports = ServerStatsStore;
