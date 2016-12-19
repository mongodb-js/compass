const Reflux = require('reflux');
const app = require('ampersand-app');
const Actions = require('../action');
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
    this.errored = [];
    this.isPaused = false;
    this.endPause = 0;
    this.overlayIndex = 0;
    this.inOverlay = false;
    this.xLength = 60;
    this.starting = true;
    this.t1s = {};
  },

  pause: function() {
    this.endPause = this.allOps.length;
    this.isPaused = !this.isPaused;
  },

  mouseOver: function(index) {
    const startPause = Math.max(this.endPause - this.xLength, 0);
    const visOps = this.allOps.slice(startPause, this.endPause);
    const visErrors = this.errored.slice(startPause, this.endPause);
    if (index >= visOps.length) {
      index = visOps.length - 1;
    }
    this.overlayIndex = index;
    this.inOverlay = true;
    const data = visOps.length === 0 ? [] : visOps[this.overlayIndex];
    this.trigger(visErrors[this.overlayIndex], data);
  },

  mouseOut: function() {
    this.inOverlay = false;
    const startPause = Math.max(this.endPause - this.xLength, 0);
    const visOps = this.allOps.slice(startPause, this.endPause);
    const visErrors = this.errored.slice(startPause, this.endPause);
    const data = visOps.length === 0 ? [] : visOps[visOps.length - 1];
    this.trigger(visErrors[this.overlayIndex], data);
  },

  // Calculate list as current hottest collection (like Cloud and system top)
  top_delta: function() {
    app.dataService.top((error, response) => {
      // Trigger error banner changes
      if (error === null && this.errored.length > 0 && this.errored[this.errored.length - 1] !== null) { // Trigger error removal
        Actions.dbError({'op': 'top', 'error': null });
      } else if (error !== null) {
        Actions.dbError({'op': 'top', 'error': error });
      }
      this.errored.push(error);
      // Update op list if error
      if (error !== null || this.starting) {
        this.allOps.push([]);
      }

      // Update op list if no error
      let totals = [];
      if (error === null) {
        // If response is empty, send empty list
        let doc = {};
        if (response !== undefined && ('totals' in response)) {
          doc = response.totals;
        }
        const numCores = app.instance.host.cpu_cores;
        const cadence = 1000000; // Can safetly assume we're polling 1x/sec TODO
        const t2s = {};
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
      }
      if (this.isPaused) {
        totals = this.allOps[this.endPause];
        error = this.errored[this.endPause];
      } else {
        this.endPause = this.allOps.length;
      }
      // This handled by mouseover function completely
      if (this.inOverlay) {
        return;
      }
      this.trigger(error, totals);
    });
  }
});

module.exports = TopStore;
