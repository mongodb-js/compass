const Reflux = require('reflux');
const Actions = require('../action');
const ServerStatsStore = require('./server-stats-graphs-store');
const _ = require('lodash');
const dataArray = require('./globallock-output.json');
const debug = require('debug')('mongodb-compass:server-stats:globallock-store');

/* eslint complexity:0 */

const GlobalLockStore = Reflux.createStore({

  init: function() {
    this.restart();
    this.listenTo(Actions.restart, this.restart);
    this.index = 0;
    this.len = dataArray.length;
    this.listenTo(ServerStatsStore, this.globalLock_demo);
  },

  restart: function() {
    this.index = 0;
    this.totalCount = {aReads: [], aWrites: [], qReads: [], qWrites: []};
    this.localTime = [];
    this.skip = [];
    this.currentMaxs = [];
    this.starting = true;
    this.xLength = 60;
    this.endPause = 0;
    this.isPaused = false;
    this.data = {dataSets: [
      {line: 'aReads', count: [], active: true},
      {line: 'aWrites', count: [], active: true},
      {line: 'qReads', count: [], active: true},
      {line: 'qWrites', count: [], active: true}],
      localTime: [],
      skip: [],
      yDomain: [0, 1],
      xLength: this.xLength,
      labels: {
        title: 'read & write',
        keys: ['active reads', 'active writes', 'queued reads', 'queued writes'],
        yAxis: ''
      },
      keyLength: 4,
      paused: false
    };
  },

  globalLock_demo: function(error, doc, isPaused) {
    const i = this.index++ % this.len;
    this.data.localTime.push(new Date());
    // Annoying, but has to be done because data binding.
    let start = 0;
    if (this.index > 60) {
      start = 1;
    }
    this.data.localTime = this.data.localTime.slice(start, 61);
    for (let j = 0; j < this.data.dataSets.length; j++) {
      this.data.dataSets[j].count.push(dataArray[i].dataSets[j].count[dataArray[i].dataSets[j].count.length - 1]);
      this.data.dataSets[j].count = this.data.dataSets[j].count.slice(start, 61);
    }
    this.data.skip = dataArray[i].skip;
    this.data.yDomain = dataArray[i].yDomain;
    this.trigger(error, this.data);
  }

});

module.exports = GlobalLockStore;
