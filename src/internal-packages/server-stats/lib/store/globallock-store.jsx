'use strict';

const Reflux = require('reflux');
const ServerStatsStore = require('./server-stats-store');
// const debug = require('debug')('server-stats:globallock-store');

const GlobalLockStore = Reflux.createStore({

  init: function() {
    this.listenTo(ServerStatsStore, this.globalLock);

    this.totalCount = {aReads: [], aWrites: [], qReads: [], qWrites: []};
    this.localTime = [];
    this.currentMax = 1;
    this.starting = true;
    this.xLength = 63;
    this.data = {dataSets: [
      {line: 'aReads', count: [], active: true},
      {line: 'aWrites', count: [], active: true},
      {line: 'qReads', count: [], active: true},
      {line: 'qWrites', count: [], active: true}],
      localTime: [],
      yDomain: [0, this.currentMax],
      xLength: this.xLength,
      labels: {
        title: 'read & write',
        keys: ['active reads', 'active writes', 'queued reads', 'queued writes'],
        yAxis: ''
      },
      keyLength: 5
    };
  },

  globalLock: function(error, doc) {
    if (!error && doc) {
      var key;
      var val;
      var raw = {};
      raw.aReads = doc.globalLock.activeClients.readers;
      raw.aWrites = doc.globalLock.activeClients.writers;
      raw.qReads = doc.globalLock.currentQueue.readers;
      raw.qWrites = doc.globalLock.currentQueue.writers;
      for (var q = 0; q < this.data.dataSets.length; q++) {
        key = this.data.dataSets[q].line;
        val = raw[key];
        if (this.starting) { // Skip 1st value to be consistent with rate graphs.
          continue;
        }
        this.totalCount[key].push(val);
        this.data.dataSets[q].count = this.totalCount[key].slice(Math.max(this.totalCount[key].length - this.xLength, 0));
        if (val > this.currentMax) {
          this.currentMax = val;
        }
      }
      if (this.starting) {
        this.starting = false;
        return;
      }
      this.data.yDomain = [0, this.currentMax];
      this.localTime.push(doc.localTime);
      this.data.localTime = this.localTime.slice(Math.max(this.localTime.length - this.xLength, 0));
    }
    this.trigger(error, this.data);
  }
});

module.exports = GlobalLockStore;
