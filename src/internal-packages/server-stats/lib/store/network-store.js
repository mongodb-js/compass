const Reflux = require('reflux');
const ServerStatsStore = require('./server-stats-graphs-store');
// const debug = require('debug')('mongodb-compass:server-stats:network-store');
const _ = require('lodash');

const NetworkStore = Reflux.createStore({

  init: function() {
    this.listenTo(ServerStatsStore, this.network);

    this.bytesPerSec = {bytesIn: [], bytesOut: []};
    this.connectionCount = [];
    this.localTime = [];
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

  network: function(error, doc, isPaused) {
    if (!error && doc) {
      let key;
      let val;
      let count;
      let max = this.currentMaxs.length === 0 ? 1 : this.currentMaxs[this.currentMaxs.length - 1];

      if (isPaused && !this.isPaused) { // Move into pause state
        this.isPaused = true;
        this.endPause = this.localTime.length;
      } else if (!isPaused && this.isPaused) { // Move out of pause state
        this.isPaused = false;
        this.endPause = this.localTime.length + 1;
      } else if (!isPaused && !this.isPaused && !this.starting) { // Wasn't paused, isn't paused now
        this.endPause++;
      }
      const startPause = Math.max(this.endPause - this.xLength, 0);

      for (let q = 0; q < this.data.dataSets.length; q++) {
        key = this.data.dataSets[q].line;
        count = _.round(doc.network[key] / 1000, 2); // convert to KB

        if (this.starting) { // don't add data, starting point
          this.data.dataSets[q].current = count;
          continue;
        }
        val = Math.max(0, _.round(count - this.data.dataSets[q].current, 2)); // Don't allow negatives.
        this.bytesPerSec[key].push(val);
        this.data.dataSets[q].count = this.bytesPerSec[key].slice(startPause, this.endPause);
        max = Math.max(val, max);
        this.data.dataSets[q].current = count;
      }
      if (this.starting) {
        this.starting = false;
        return;
      }
      this.currentMaxs.push(max);

      // Handle separate scaled line
      const connections = doc.connections.current;
      max = this.secondCurrentMaxs.length === 0 ? 1 : this.secondCurrentMaxs[this.secondCurrentMaxs.length - 1];
      max = Math.max(connections, max);
      this.secondCurrentMaxs.push(max);
      // Handle connections being on a separate Y axis
      this.connectionCount.push(connections);
      this.data.secondScale.count = this.connectionCount.slice(startPause, this.endPause);
      this.data.secondScale.currentMax = this.secondCurrentMaxs[this.endPause - 1];

      // Add the rest of the data
      this.data.yDomain = [0, this.currentMaxs[this.endPause - 1]];
      this.localTime.push(doc.localTime);
      this.data.localTime = this.localTime.slice(startPause, this.endPause);
      this.data.paused = isPaused;
    }
    this.trigger(error, this.data);
  }
});

module.exports = NetworkStore;
