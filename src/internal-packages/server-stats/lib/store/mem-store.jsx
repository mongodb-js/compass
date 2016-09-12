const Reflux = require('reflux');
const ServerStatsStore = require('./server-stats-graphs-store');
// const debug = require('debug')('mongodb-compass:server-stats:mem-store');
const _ = require('lodash');

const MemStore = Reflux.createStore({

  init: function() {
    this.listenTo(ServerStatsStore, this.mem);

    this.totalCount = {virtual: [], resident: [], mapped: []};
    this.localTime = [];
    this.currentMax = 1;
    this.starting = true;
    this.xLength = 63;
    this.data = {dataSets: [
      {line: 'virtual', count: [], 'active': true},
      {line: 'resident', count: [], 'active': true},
      {line: 'mapped', count: [], 'active': true}],
      localTime: [],
      yDomain: [0, this.currentMax],
      xLength: this.xLength,
      labels: {
        title: 'memory',
        keys: ['vsize', 'resident', 'mapped'],
        yAxis: 'GB'
      },
      keyLength: 6
    };
  },

  mem: function(error, doc) {
    if (!error && doc) {
      let key;
      let val;
      for (let q = 0; q < this.data.dataSets.length; q++) {
        key = this.data.dataSets[q].line;
        val = _.round(doc.mem[key] / 1000, 2); // convert to GB
        if (this.starting) { // Skip 1st value to be consistent with rate graphs.
          continue;
        }
        this.totalCount[key].push(val);
        this.data.dataSets[q].count = this.totalCount[key].slice(Math.max(this.totalCount[key].length - this.xLength, 0));
        if (val > this.currentMax) {
          this.currentMax = val;
        }
      }
      if (this.starting) {
        this.starting = false;
        return;
      }
      this.data.yDomain = [0, this.currentMax];
      this.localTime.push(doc.localTime);
      this.data.localTime = this.localTime.slice(Math.max(this.localTime.length - this.xLength, 0));
    }
    this.trigger(error, this.data);
  }
});

module.exports = MemStore;
