'use strict';

const Reflux = require('reflux');
const ServerStatsStore = require('./server-stats-store');
// const debug = require('debug')('server-stats:opcounter-store');
const _ = require('lodash');

const NetworkStore = Reflux.createStore({

  init: function() {
    this.listenTo(ServerStatsStore, this.network);

    this.opsPerSec = {bytesIn: [], bytesOut: [], current: []};
    this.rawData = [];
    this.localTime = [];
    this.currentMax = 1;
    this.starting = true;
    this.maxOps = 63;
    this.data = {operations: [
      {op: 'bytesIn', count: [], active: true},
      {op: 'bytesOut', count: [], active: true},
      {op: 'current', count: [], active: true}],
      localTime: [],
      yDomain: [0, this.currentMax],
      rawData: [],
      maxOps: this.maxOps,
      labels: {
        title: 'network',
        keys: ['net in', 'net out', 'connections'],
        yAxis: 'KB'
      }
    };
  },

  network: function(error, doc) {
    if (!error && doc) {
      var key;
      var val;
      var count;
      var source;
      var raw = {};
      var div = 1;
      var precision = 2;
      for (var q = 0; q < this.data.operations.length; q++) {
        key = this.data.operations[q].op;
        source = doc.network;
        div = 1000;
        if (q === 2) {
          source = doc.connections;
          div = 1;
          precision = 0;
        }
        count = _.round(source[key] / div, precision); // convert to KB

        raw[key] = count;
        if (this.starting) { // don't add data, starting point
          this.data.operations[q].current = count;
          continue;
        }
        val = _.round(count - this.data.operations[q].current);
        this.opsPerSec[key].push(val);
        this.data.operations[q].count = this.opsPerSec[key].slice(Math.max(this.opsPerSec[key].length - this.maxOps, 0));
        if (val > this.currentMax) {
          this.currentMax = val;
        }
        this.data.operations[q].current = count;
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

module.exports = NetworkStore;
