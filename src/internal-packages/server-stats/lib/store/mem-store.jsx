const Reflux = require('reflux');
const ServerStatsStore = require('./server-stats-graphs-store');
// const debug = require('debug')('mongodb-compass:server-stats:mem-store');
const _ = require('lodash');

const MemStore = Reflux.createStore({

  init: function() {
    this.listenTo(ServerStatsStore, this.mem);

    this.totalCount = {virtual: [], resident: [], mapped: []};
    this.localTime = [];
    this.currentMaxs = [];
    this.starting = true;
    this.xLength = 60;
    this.endPause = 0;
    this.isPaused = false;
    this.data = {dataSets: [
      {line: 'virtual', count: [], 'active': true},
      {line: 'resident', count: [], 'active': true},
      {line: 'mapped', count: [], 'active': true}],
      localTime: [],
      yDomain: [0, 1],
      xLength: this.xLength,
      labels: {
        title: 'memory',
        keys: ['vsize', 'resident', 'mapped'],
        yAxis: 'GB'
      },
      keyLength: 6,
      paused: false
    };
  },

  mem: function(error, doc, isPaused) {
    if (!error && doc) {
      if (this.starting) {
        this.starting = false;
        return;
      }
      let key;
      let val;
      let max = this.currentMaxs.length === 0 ? 1 : this.currentMaxs[this.currentMaxs.length - 1];

      if (isPaused && !this.isPaused) { // Move into pause state
        this.isPaused = true;
        this.endPause = this.localTime.length;
      } else if (!isPaused && this.isPaused) { // Move out of pause state
        this.isPaused = false;
        this.endPause = this.localTime.length + 1;
      } else if (!isPaused && !this.isPaused) { // Wasn't paused, isn't paused now
        this.endPause++;
      }
      const startPause = Math.max(this.endPause - this.xLength, 0);

      for (let q = 0; q < this.data.dataSets.length; q++) {
        key = this.data.dataSets[q].line;
        val = _.round(doc.mem[key] / 1000, 2); // convert to GB
        this.totalCount[key].push(val);
        this.data.dataSets[q].count = this.totalCount[key].slice(startPause, this.endPause);
        max = Math.max(max, val);
      }
      this.currentMaxs.push(max);
      this.localTime.push(doc.localTime);
      this.data.yDomain = [0, this.currentMaxs[this.endPause - 1]];
      this.data.localTime = this.localTime.slice(startPause, this.endPause);
      this.data.paused = isPaused;
    }
    this.trigger(error, this.data);
  }
});

module.exports = MemStore;
