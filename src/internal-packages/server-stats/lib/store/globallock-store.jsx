'use strict';

const Reflux = require('reflux');
const ServerStatsStore = require('./server-stats-store');
// const debug = require('debug')('server-stats:globallock-store');

const GlobalLockStore = Reflux.createStore({

  init: function() {
    this.listenTo(ServerStatsStore, this.globalLock);

    this.totalCount = {aReads: [], aWrites: [], qReads: [], qWrites: []};
    this.rawData = [];
    this.localTime = [];
    this.currentMax = 1;
    this.starting = true;
    this.maxOps = 63;
    this.data = {operations: [
      {op: 'aReads', count: [], active: true},
      {op: 'aWrites', count: [], active: true},
      {op: 'qReads', count: [], active: true},
      {op: 'qWrites', count: [], active: true}],
      localTime: [],
      yDomain: [0, this.currentMax],
      rawData: [],
      maxOps: this.maxOps,
      labels: {
        title: 'read & write',
        keys: ['active reads', 'active writes', 'queued reads', 'queued writes'],
        yAxis: ''
      },
      numKeys: 5
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
      for (var q = 0; q < this.data.operations.length; q++) {
        key = this.data.operations[q].op;
        val = raw[key];
        if (this.starting) { // TODO: should we skip the first value to be consistent with the other graphs?
          continue;
        }
        this.totalCount[key].push(val);
        this.data.operations[q].count = this.totalCount[key].slice(Math.max(this.totalCount[key].length - this.maxOps, 0));
        if (val > this.currentMax) {
          this.currentMax = val;
        }
      }
      if (this.starting) {
        this.starting = false;
        return;
      }
      this.rawData.push(raw);
      this.data.yDomain = [0, this.currentMax];
      this.localTime.push(doc.localTime);
      this.data.localTime = this.localTime.slice(Math.max(this.localTime.length - this.maxOps, 0));
      this.data.rawData = this.rawData.slice(Math.max(this.rawData.length - this.maxOps, 0));
    }
    this.trigger(error, this.data);
  }
});

module.exports = GlobalLockStore;
