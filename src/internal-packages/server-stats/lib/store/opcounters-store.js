const Reflux = require('reflux');
const Actions = require('../action');
const ServerStatsStore = require('./server-stats-graphs-store');
const _ = require('lodash');
const dataArray = require('./opcounters-output.json');
const debug = require('debug')('mongodb-compass:server-stats:opcounters-store');

/* eslint complexity:0 */

const OpCounterStore = Reflux.createStore({

  init: function() {
    this.restart();
    this.listenTo(Actions.restart, this.restart);
    this.index = 0;
    this.len = dataArray.length;
    this.listenTo(ServerStatsStore, this.opCounter_demo);
    for (let i = 0; i < dataArray.length; i++) {
      dataArray[i]['localTime'] = dataArray[i].localTime.map(function(obj) { return new Date(obj); });
    }
  },

  restart: function() {
    this.opsPerSec = {
      insert: [], query: [], update: [],
      delete: [], command: [], getmore: []};
    this.localTime = [];
    this.skip = [];
    this.currentMaxs = [];
    this.starting = true;
    this.xLength = 60;
    this.endPause = 0;
    this.isPaused = false;
    this.data = {dataSets: [
      {line: 'insert', count: [], active: true, current: 0},
      {line: 'query', count: [], active: true, current: 0},
      {line: 'update', count: [], active: true, current: 0},
      {line: 'delete', count: [], active: true, current: 0},
      {line: 'command', count: [], active: true, current: 0},
      {line: 'getmore', count: [], active: true, current: 0}],
      localTime: [],
      skip: [],
      yDomain: [0, 1],
      xLength: this.xLength,
      labels: {
        title: 'operations',
        keys: ['inserts', 'queries', 'updates', 'deletes', 'commands', 'getmores'],
        yAxis: 'ops'
      },
      keyLength: 6,
      paused: false,
      trigger: true
    };
  },

  opCounter_demo: function(error, doc, isPaused) {
    const i = this.index++ % this.len;
    // Annoying, but has to be done because data binding.
    let start = 0;
    if (this.index > 60) {
      start = 1;
    }
    for (let j = 0; j < this.data.dataSets.length; j++) {
      this.data.dataSets[j].count.push(dataArray[i].dataSets[j].count[dataArray[i].dataSets[j].count.length - 1]);
      this.data.dataSets[j].count = this.data.dataSets[j].count.slice(start, 61);
    }
    this.data.localTime = dataArray[i].localTime;
    this.data.skip = dataArray[i].skip;
    this.data.yDomain = dataArray[i].yDomain;
    this.trigger(error, this.data);
  }

});

module.exports = OpCounterStore;
