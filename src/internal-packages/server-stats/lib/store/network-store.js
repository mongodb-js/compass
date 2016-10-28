const Reflux = require('reflux');
const Actions = require('../action');
const ServerStatsStore = require('./server-stats-graphs-store');
const _ = require('lodash');
const dataArray = require('./network-output.json');
const debug = require('debug')('mongodb-compass:server-stats:network-store');

/* eslint complexity:0 */

const NetworkStore = Reflux.createStore({

  init: function() {
    debug("LENGTH=", dataArray.length);

    this.restart();
    this.listenTo(Actions.restart, this.restart);
    this.index = 0;
    this.len = dataArray.length;
    this.listenTo(ServerStatsStore, this.network_demo);
    for (let i = 0; i < dataArray.length; i++) {
      dataArray[i]['localTime'] = dataArray[i].localTime.map(function(obj) { return new Date(obj); });
    }
  },

  restart: function() {
    this.bytesPerSec = {bytesIn: [], bytesOut: []};
    this.connectionCount = [];
    this.localTime = [];
    this.skip = [];
    this.currentMaxs = [];
    this.secondCurrentMaxs = [];
    this.starting = true;
    this.xLength = 60;
    this.endPause = 0;
    this.isPaused = false;
    this.data = {dataSets: [
      {line: 'bytesIn', count: [], active: true, current: 0},
      {line: 'bytesOut', count: [], active: true, current: 0}],
      localTime: [],
      skip: [],
      yDomain: [0, 1],
      xLength: this.xLength,
      labels: {
        title: 'network',
        keys: ['net in', 'net out', 'connections'],
        yAxis: 'KB'
      },
      keyLength: 6,
      secondScale: {
        line: 'connections',
        count: [],
        active: true,
        currentMax: 1,
        units: 'conn'
      },
      paused: false
    };
  },

  network_demo: function(error, doc, isPaused) {
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
    this.data.secondScale.count.push(dataArray[i].secondScale.count[dataArray[i].secondScale.count.length - 1]);
    this.data.secondScale.count = this.data.secondScale.count.slice(start, 61);

    // Everything else
    this.data.secondScale.currentMax = dataArray[i].secondScale.currentMax;
    this.data.localTime = dataArray[i].localTime;
    this.data.skip = dataArray[i].skip;
    this.data.yDomain = dataArray[i].yDomain;
    this.trigger(error, this.data);
  }

});

module.exports = NetworkStore;
