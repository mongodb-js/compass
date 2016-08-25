'use strict';

const Reflux = require('reflux');
const ServerStatsStore = require('./server-stats-store');
// const debug = require('debug')('server-stats:opcounter-store');
const _ = require('lodash');

const MemStore = Reflux.createStore({

  init: function() {
    this.listenTo(ServerStatsStore, this.mem);

    this.totalCount = {virtual: [], resident: [], mapped: []};
    this.rawData = [];
    this.localTime = [];
    this.currentMax = 1;
    this.starting = true;
    this.maxOps = 63;
    this.data = {operations: [
      {op: 'virtual', count: [], 'active': true},
      {op: 'resident', count: [], 'active': true},
      {op: 'mapped', count: [], 'active': true}],
      localTime: [],
      yDomain: [0, this.currentMax],
      rawData: [],
      maxOps: this.maxOps,
      labels: {
        title: 'memory',
        keys: ['vsize', 'resident', 'mapped'],
        yAxis: 'GB'
      },
      numKeys: 6
    };
  },

  mem: function(error, doc) {
    if (!error && doc) {
      var key;
      var val;
      var raw = {};
      for (var q = 0; q < this.data.operations.length; q++) {
        key = this.data.operations[q].op;
        val = _.round(doc.mem[key] / 1000, 2); // convert to GB
        raw[key] = val;
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

module.exports = MemStore;
