const Reflux = require('reflux');
const ServerStatsStore = require('./server-stats-graphs-store');
// const debug = require('debug')('server-stats:opcounter-store');
const _ = require('lodash');

const NetworkStore = Reflux.createStore({

  init: function() {
    this.listenTo(ServerStatsStore, this.network);

    this.bytesPerSec = {bytesIn: [], bytesOut: []};
    this.connectionCount = [];
    this.localTime = [];
    this.currentMax = 1;
    this.starting = true;
    this.xLength = 63;
    this.data = {dataSets: [
      {line: 'bytesIn', count: [], active: true, current: 0},
      {line: 'bytesOut', count: [], active: true, current: 0}],
      localTime: [],
      yDomain: [0, this.currentMax],
      xLength: this.xLength,
      labels: {
        title: 'network',
        keys: ['net in', 'net out', 'connections'],
        yAxis: 'KB'
      },
      keyLength: 6,
      secondScale: {line: 'connections', count: [], active: true, currentMax: 1, units: 'conn'}
    };
  },

  network: function(error, doc) {
    if (!error && doc) {
      let key;
      let val;
      let count;
      for (let q = 0; q < this.data.dataSets.length; q++) {
        key = this.data.dataSets[q].line;
        count = _.round(doc.network[key] / 1000, 2); // convert to KB

        if (this.starting) { // don't add data, starting point
          this.data.dataSets[q].current = count;
          continue;
        }
        val = Math.max(0, _.round(count - this.data.dataSets[q].current, 2)); // Don't allow negatives.
        this.bytesPerSec[key].push(val);
        this.data.dataSets[q].count = this.bytesPerSec[key].slice(Math.max(this.bytesPerSec[key].length - this.xLength, 0));
        if (val > this.currentMax) {
          this.currentMax = val;
        }
        this.data.dataSets[q].current = count;
      }
      if (this.starting) {
        this.starting = false;
        return;
      }
      // Handle connections being on a separate Y axis
      const connections = doc.connections.current;
      if (connections > this.data.secondScale.currentMax) {
        this.data.secondScale.currentMax = connections;
      }
      this.connectionCount.push(connections);
      this.data.secondScale.count = this.connectionCount.slice(Math.max(this.connectionCount.length - this.xLength, 0));

      // Add the rest of the data
      this.data.yDomain = [0, this.currentMax];
      this.localTime.push(doc.localTime);
      this.data.localTime = this.localTime.slice(Math.max(this.localTime.length - this.xLength, 0));
    }
    this.trigger(error, this.data);
  }
});

module.exports = NetworkStore;
