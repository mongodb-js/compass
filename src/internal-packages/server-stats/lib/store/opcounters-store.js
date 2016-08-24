'use strict';

const Reflux = require('reflux');
const ServerStatsStore = require('./server-stats-store');

const OpCounterStore = Reflux.createStore({

  init: function() {
    this.listenTo(ServerStatsStore, this.opCounter);

    this.opsPerSec = {
      'insert': [], 'query': [], 'update': [],
      'delete': [], 'command': [], 'getmore': []};
    this.rawData = [];
    this.localTime = [];
    this.currentMax = 1;
    this.starting = true;
    this.maxOps = 63;
    this.data = {'operations': [
      {'op': 'insert', 'count': [], 'active': true, 'current': 0},
      {'op': 'query', 'count': [], 'active': true, 'current': 0},
      {'op': 'update', 'count': [], 'active': true, 'current': 0},
      {'op': 'delete', 'count': [], 'active': true, 'current': 0},
      {'op': 'command', 'count': [], 'active': true, 'current': 0},
      {'op': 'getmore', 'count': [], 'active': true, 'current': 0}],
      'localTime': [],
      'yDomain': [0, this.currentMax],
      'rawData': [],
      'maxOps': this.maxOps,
      'labels': {
        'title': 'operations',
        'keys': ['inserts', 'queries', 'updates', 'deletes', 'commands', 'getmores'],
        'yAxis': 'OPS'}
    };
  },

  opCounter: function(error, doc) {
    if (!error && doc) {
      var key;
      var val;
      var count;
      for (var q = 0; q < this.data.operations.length; q++) {
        key = this.data.operations[q].op;
        count = doc.opcounters[key];
        if (this.starting) { // don't add data, starting point
          this.data.operations[q].current = count;
          continue;
        }
        val = count - this.data.operations[q].current;
        this.opsPerSec[key].push(val);
        this.data.operations[q].count = this.opsPerSec[key].slice(Math.max(this.opsPerSec[key].length - this.maxOps, 0));
        if (val > this.currentMax) {
          this.currentMax = val;
        }
        this.data.operations[q].current = count;
      }
      if (this.starting) {
        this.starting = false;
        return;
      }
      this.rawData.push(doc.opcounters);
      this.data.yDomain = [0, this.currentMax];
      this.localTime.push(doc.localTime);
      this.data.localTime = this.localTime.slice(Math.max(this.localTime.length - this.maxOps, 0));
      this.data.rawData = this.rawData.slice(Math.max(this.rawData.length - this.maxOps, 0));
    }
    this.trigger(error, this.data);
  }
});

module.exports = OpCounterStore;
