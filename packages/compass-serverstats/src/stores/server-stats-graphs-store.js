const Reflux = require('reflux');
const Actions = require('../actions');

// const debug = require('debug')('mongodb-compass:server-stats:graphs-store');

const ServerStatsStore = Reflux.createStore({

  init: function() {
    this.restart();
    this.listenTo(Actions.serverStats, this.serverStats);
    this.listenTo(Actions.restart, this.restart);
    this.listenTo(Actions.pause, this.pause);
  },

  onActivated: function(appRegistry) {
    appRegistry.on('data-service-connected', (err, ds) => {
      if (!err) {
        this.dataService = ds;
        this.isMongos = ds.isMongos();
        this.isWritable = ds.isWritable();
      }
    });
  },

  restart: function() {
    this.isPaused = false;
  },

  serverStats: async function() {
    if (!this.dataService) {
      return;
    }
    let error = null; let doc;
    try {
      doc = await this.dataService.serverStatus();
    } catch (err) {
      error = err;
    }
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
