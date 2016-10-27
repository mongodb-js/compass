const Reflux = require('reflux');
const Actions = require('../actions');
const ServerStatsStore = require('./server-stats-graphs-store');
const _ = require('lodash');
// const debug = require('debug')('mongodb-compass:server-stats:network-store');

/* eslint complexity:0 */

const NetworkStore = Reflux.createStore({

  init: function() {
    this.restart();
    this.listenTo(ServerStatsStore, this.network);
    this.listenTo(Actions.restart, this.restart);
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

  network: function(error, doc, isPaused) {
    if (!error && doc) {
      let key;
      let val;
      let count;

      if (this.localTime.length > 0 && doc.localTime.getTime() - this.localTime[this.localTime.length - 1].getTime() < 500) { // If we're playing catchup
        return;
      }
      const skipped = this.localTime.length > 0 && doc.localTime - this.localTime[this.localTime.length - 1] > 2000;

      if (isPaused && !this.isPaused) { // Move into pause state
        this.isPaused = true;
        this.endPause = this.localTime.length;
      } else if (!isPaused && this.isPaused) { // Move out of pause state
        this.isPaused = false;
        this.endPause = this.localTime.length + 1;
      } else if (!isPaused && !this.isPaused && !this.starting) { // Wasn't paused, isn't paused now
        this.endPause++;
        if (skipped) { // If time has been skipped, then add this point twice so it is visible
          this.endPause++;
        }
      }
      const startPause = Math.max(this.endPause - this.xLength, 0);

      for (let q = 0; q < this.data.dataSets.length; q++) {
        key = this.data.dataSets[q].line;
        count = _.round(doc.network[key] / 1000, 2); // convert to KB

        if (this.starting) { // don't add data, starting point
          this.data.dataSets[q].current = count;
          continue;
        }
        val = _.round(Math.max(0, count - this.data.dataSets[q].current, 2)); // Don't allow negatives.
        this.bytesPerSec[key].push(val);
        if (skipped) {
          this.bytesPerSec[key].push(val);
        }
        this.data.dataSets[q].count = this.bytesPerSec[key].slice(startPause, this.endPause);
        this.data.dataSets[q].current = count;
      }
      if (this.starting) {
        this.starting = false;
        return;
      }
      const maxs = [1];
      for (let q = 0; q < this.data.dataSets.length; q++) {
        maxs.push(_.max(this.data.dataSets[q].count));
      }
      this.currentMaxs.push(_.round(_.max(maxs), 2));

      // Handle separate scaled line
      const connections = doc.connections.current;
      // Handle connections being on a separate Y axis
      this.connectionCount.push(connections);
      if (skipped) {
        this.connectionCount.push(connections);
        this.localTime.push(new Date(doc.localTime.getTime() - 1000));
        this.currentMaxs.push(_.max(maxs));
        this.secondCurrentMaxs.push(_.max(this.data.secondScale.count));
        this.skip.push(skipped);
      }
      this.skip.push(false);
      this.data.secondScale.count = this.connectionCount.slice(startPause, this.endPause);
      this.secondCurrentMaxs.push(_.max(this.data.secondScale.count));
      this.data.secondScale.currentMax = this.secondCurrentMaxs[this.endPause - 1];

      // Add the rest of the data
      this.data.yDomain = [0, this.currentMaxs[this.endPause - 1]];
      this.localTime.push(doc.localTime);
      this.data.localTime = this.localTime.slice(startPause, this.endPause);
      this.data.skip = this.skip.slice(startPause, this.endPause);
      this.data.paused = isPaused;
    }
    this.trigger(error, this.data);
  }
});

module.exports = NetworkStore;
