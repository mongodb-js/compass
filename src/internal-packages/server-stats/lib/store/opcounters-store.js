'use strict';

const Reflux = require('reflux');
const ServerStatsStore = require('./server-stats-store');
// const debug = require('debug')('server-stats:opcounter-store');

const OpCounterStore = Reflux.createStore({

  init: function() {
    this.listenTo(ServerStatsStore, this.opCounter);

    this.opsPerSec = {
      insert: [], query: [], update: [],
      delete: [], command: [], getmore: []};
    this.rawData = [];
    this.localTime = [];
    this.currentMax = 1;
    this.starting = true;
    this.xLength = 63;
    this.data = {dataSets: [
      {line: 'insert', count: [], active: true, current: 0},
      {line: 'query', count: [], active: true, current: 0},
      {line: 'update', count: [], active: true, current: 0},
      {line: 'delete', count: [], active: true, current: 0},
      {line: 'command', count: [], active: true, current: 0},
      {line: 'getmore', count: [], active: true, current: 0}],
      localTime: [],
      yDomain: [0, this.currentMax],
      rawData: [],
      xLength: this.xLength,
      labels: {
        title: 'dataSets',
        keys: ['inserts', 'queries', 'updates', 'deletes', 'commands', 'getmores'],
        yAxis: 'OPS'
      },
      numKeys: 6
    };
  },

  opCounter: function(error, doc) {
    if (!error && doc) {
      var key;
      var val;
      var count;
      for (var q = 0; q < this.data.dataSets.length; q++) {
        key = this.data.dataSets[q].line;
        count = doc.opcounters[key];
        if (this.starting) { // don't add data, starting point
          this.data.dataSets[q].current = count;
          continue;
        }
        val = count - this.data.dataSets[q].current;
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
      this.rawData.push(doc.opcounters);
      this.data.yDomain = [0, this.currentMax];
      this.localTime.push(doc.localTime);
      this.data.localTime = this.localTime.slice(Math.max(this.localTime.length - this.xLength, 0));
      this.data.rawData = this.rawData.slice(Math.max(this.rawData.length - this.xLength, 0));
    }
    this.trigger(error, this.data);
  }
});

module.exports = OpCounterStore;
