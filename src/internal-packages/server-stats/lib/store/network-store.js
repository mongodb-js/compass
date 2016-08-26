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
    this.xLength = 63;
    this.data = {dataSets: [
      {line: 'bytesIn', count: [], active: true},
      {line: 'bytesOut', count: [], active: true},
      {line: 'current', count: [], active: true}],
      localTime: [],
      yDomain: [0, this.currentMax],
      rawData: [],
      xLength: this.xLength,
      labels: {
        title: 'network',
        keys: ['net in', 'net out', 'connections'],
        yAxis: 'KB'
      },
      numKeys: 6
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
      for (var q = 0; q < this.data.dataSets.length; q++) {
        key = this.data.dataSets[q].line;
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
          this.data.dataSets[q].current = count;
          continue;
        }
        val = _.round(count - this.data.dataSets[q].current);
        this.opsPerSec[key].push(val);
        this.data.dataSets[q].count = this.opsPerSec[key].slice(Math.max(this.opsPerSec[key].length - this.xLength, 0));
        if (val > this.currentMax) {
          this.currentMax = val;
        }
        this.data.dataSets[q].current = count;
      }
      if (this.starting) {
        this.starting = false;
        return;
      }
      this.rawData.push(raw);
      this.data.yDomain = [0, this.currentMax];
      this.localTime.push(doc.localTime);
      this.data.localTime = this.localTime.slice(Math.max(this.localTime.length - this.xLength, 0));
      this.data.rawData = this.rawData.slice(Math.max(this.rawData.length - this.xLength, 0));
    }
    this.trigger(error, this.data);
  }
});

module.exports = NetworkStore;
