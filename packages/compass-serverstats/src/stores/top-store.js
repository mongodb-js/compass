const Reflux = require('reflux');
const Actions = require('../actions');
const toNS = require('mongodb-ns');
const debug = require('debug')('mongodb-compass:server-stats:top-store');
const _ = require('lodash');

/* eslint complexity:0 */

/**
 * This store listens to the
 * 'pollTop' action, fetches the top data, and
 * triggers with the result of the command.
 */
const TopStore = Reflux.createStore({

  /**
   * Initializing the store should set up the listener for
   * the 'pollTop' command.
   */
  init: function() {
    this.restart();
    this.listenTo(Actions.pollTop, this.top_delta);
    this.listenTo(Actions.pause, this.pause);
    this.listenTo(Actions.restart, this.restart);
  },

  restart: function() {
    this.allOps = [];
    this.isPaused = false;
    this.endPause = 0;
    this.overlayIndex = 0;
    this.inOverlay = false;
    this.xLength = 60;
    this.starting = true;
    this.error = null;
    this.t1s = {};
  },

  pause: function() {
    this.endPause = this.allOps.length;
    this.isPaused = !this.isPaused;
  },

  mouseOver: function(index) {
    const startPause = Math.max(this.endPause - this.xLength, 0);
    const visOps = this.allOps.slice(startPause, this.endPause);
    if (index >= visOps.length) {
      index = visOps.length - 1;
    }
    this.overlayIndex = index;
    this.inOverlay = true;
    this.trigger(null, visOps[this.overlayIndex]);
  },

  mouseOut: function() {
    this.inOverlay = false;
    const startPause = Math.max(this.endPause - this.xLength, 0);
    const visOps = this.allOps.slice(startPause, this.endPause);
    this.trigger(this.error, visOps[visOps.length - 1]);
  },

  // Calculate list as current hottest collection (like Cloud and system top)
  top_delta: function() {
    global.dataService.top((error, response) => {
      const numCores = 4; // app.instance.host.cpu_cores;
      const cadence = 1000000; // Can safetly assume we're polling 1x/sec TODO
      const t2s = {};
      let totals = [];
      this.error = error;
      if (!error && response !== undefined && ('totals' in response)) {
        const doc = response.totals;
        for (let collname in doc) { // eslint-disable-line prefer-const
          // Ignore special collections
          if (!doc.hasOwnProperty(collname) || collname === 'note' || toNS(collname).specialish) {
            continue;
          }
          const value = doc[collname];
          if (!('readLock' in value) || !('writeLock' in value) || !('total' in value)) {
            debug('Error: top response from DB missing fields', value);
          }
          t2s[collname] = {
            'loadPercentR': value.readLock.time,
            'loadPercentL': value.writeLock.time,
            'loadPercent': value.total.time
          };
        }
        // Must skip first data point in order to show deltas.
        if (this.starting) {
          this.t1s = t2s;
          this.starting = false;
          return;
        }
        // Calculate system load per collection
        for (let collname in t2s) { // eslint-disable-line prefer-const
          if (!t2s.hasOwnProperty(collname)) {
            continue;
          }
          const t1 = collname in this.t1s ? this.t1s[collname] : {'loadPercent': 0, 'loadPercentR': 0, 'loadPercentL': 0};
          const t2 = t2s[collname];

          const tDelta = t2.loadPercent - t1.loadPercent;

          const loadL = tDelta === 0 ? 0 : _.round(((t2.loadPercentL - t1.loadPercentL) / tDelta) * 100, 0);
          const loadR = tDelta === 0 ? 0 : _.round(((t2.loadPercentR - t1.loadPercentR) / tDelta) * 100, 0);

          totals.push({
            'collectionName': collname,
            'loadPercent': _.round((tDelta * 100) / (cadence * numCores), 2), // System load.
            'loadPercentR': loadR,
            'loadPercentL': loadL
          });
        }
        this.t1s = t2s;
        // Sort
        totals.sort(function(a, b) {
          const f = (b.loadPercent < a.loadPercent) ? -1 : 0;
          return (a.loadPercent < b.loadPercent) ? 1 : f;
        });
        // Add current state to all
        this.allOps.push(totals);
        if (this.isPaused) {
          totals = this.allOps[this.endPause];
        } else {
          this.endPause = this.allOps.length;
        }
        // This handled by mouseover function completely
        if (this.inOverlay) {
          return;
        }
      } else if (error) {
        Actions.dbError({ 'op': 'top', 'error': error });
      }
      this.trigger(error, totals);
    });
  },

  // Calculate list as all-time hottest collections
  top: function() {
    global.dataService.top((error, response) => {
      let totals = [];
      this.error = error;
      if (!error && response !== undefined && ('totals' in response)) {
        if (this.starting) { // Skip first to match charts
          this.starting = false;
          return;
        }
        const doc = response.totals;
        let totalTime = 0;
        for (let collname in doc) { // eslint-disable-line prefer-const
          if (!doc.hasOwnProperty(collname) || collname === 'note' || toNS(collname).specialish) {
            continue;
          }
          const subdoc = doc[collname];
          if (!('readLock' in subdoc) || !('writeLock' in subdoc) || !('total' in subdoc)) {
            debug('Error: top response from DB missing fields', subdoc);
          }
          totals.push({
            'collectionName': collname,
            'loadPercentR': (subdoc.readLock.time / subdoc.total.time) * 100,
            'loadPerfectL': (subdoc.writeLock.time / subdoc.total.time) * 100,
            'loadPercent': subdoc.total.time
          });
          totalTime += subdoc.total.time;
        }
        for (let i = 0; i < totals.length; i++) {
          totals[i].loadPercent = _.round((totals[i].loadPercent / totalTime) * 100, 0);
        }
        for (let i = totals.length - 1; i >= 0; i--) {
          if (!totals[i].loadPercent) {
            totals.splice(i, 1);
          }
        }
        totals.sort(function(a, b) {
          const f = (b.loadPercent < a.loadPercent) ? -1 : 0;
          return (a.loadPercent < b.loadPercent) ? 1 : f;
        });
        // Add current state to all
        this.allOps.push(totals);
        if (this.isPaused) {
          totals = this.allOps[this.endPause];
        } else {
          this.endPause = this.allOps.length;
        }
        // This handled by mouseover function completely
        if (this.inOverlay) {
          return;
        }
      } else if (error) {
        Actions.dbError({ 'op': 'top', 'error': error });
      }
      this.trigger(error, totals);
    });
  }
});

module.exports = TopStore;
