const Reflux = require('reflux');
const ServerStatsStore = require('./server-stats-graphs-store');
// const debug = require('debug')('mongodb-compass:server-stats:globallock-store');

const GlobalLockStore = Reflux.createStore({

  init: function() {
    this.listenTo(ServerStatsStore, this.globalLock);

    this.totalCount = {aReads: [], aWrites: [], qReads: [], qWrites: []};
    this.localTime = [];
    this.currentMaxs = [];
    this.starting = true;
    this.xLength = 60;
    this.endPause = 0;
    this.isPaused = false;
    this.data = {dataSets: [
      {line: 'aReads', count: [], active: true},
      {line: 'aWrites', count: [], active: true},
      {line: 'qReads', count: [], active: true},
      {line: 'qWrites', count: [], active: true}],
      localTime: [],
      yDomain: [0, 1],
      xLength: this.xLength,
      labels: {
        title: 'read & write',
        keys: ['active reads', 'active writes', 'queued reads', 'queued writes'],
        yAxis: ''
      },
      keyLength: 4,
      paused: false
    };
  },

  globalLock: function(error, doc, isPaused) {
    if (!error && doc) {
      if (this.starting) {
        this.starting = false;
        return;
      }
      let key;
      let val;
      const raw = {};
      let max = this.currentMaxs.length === 0 ? 1 : this.currentMaxs[this.currentMaxs.length - 1];
      raw.aReads = doc.globalLock.activeClients.readers;
      raw.aWrites = doc.globalLock.activeClients.writers;
      raw.qReads = doc.globalLock.currentQueue.readers;
      raw.qWrites = doc.globalLock.currentQueue.writers;

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
        val = raw[key];
        this.totalCount[key].push(val);
        this.data.dataSets[q].count = this.totalCount[key].slice(startPause, this.endPause);
        max = Math.max(max, val);
      }

      this.currentMaxs.push(max);
      this.data.yDomain = [0, this.currentMaxs[this.endPause - 1]];
      this.localTime.push(doc.localTime);
      this.data.localTime = this.localTime.slice(startPause, this.endPause);
      this.data.paused = isPaused;
    }
    this.trigger(error, this.data);
  }
});

module.exports = GlobalLockStore;
