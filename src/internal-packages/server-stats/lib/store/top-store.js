const Reflux = require('reflux');
const app = require('ampersand-app');
const Actions = require('../action');
const toNS = require('mongodb-ns');
// const debug = require('debug')('mongodb-compass:server-stats:top-store');
const _ = require('lodash');

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
    this.listenTo(Actions.pollTop, this.top);
    this.listenTo(Actions.pause, this.pause);
    this.allOps = [];
    this.isPaused = false;
    this.pauseIndex = 0;
  },

  pause: function() {
    this.pauseIndex = this.allOps.length - 1;
    this.isPaused = !this.isPaused;
  },

  top: function() {
    app.dataService.top((error, response) => {
      let totals = [];
      if (!error && response) {
        const doc = response.totals;
        let totalTime = 0;
        for (let collname in doc) { // eslint-disable-line prefer-const
          if (!doc.hasOwnProperty(collname) || collname === 'note' || toNS(collname).specialish) {
            continue;
          }
          totals.push({
            'collectionName': collname,
            'loadPercentR': (doc[collname].readLock.time / doc[collname].total.time) * 100,
            'loadPerfectL': (doc[collname].writeLock.time / doc[collname].total.time) * 100,
            'loadPercent': doc[collname].total.time
          });
          totalTime += doc[collname].total.time;
        }
        for (let i = 0; i < totals.length; i++) {
          totals[i].loadPercent = _.round((totals[i].loadPercent / totalTime) * 100, 0);
        }
        totals.sort(function(a, b) {
          const f = (b.loadPercent < a.loadPercent) ? 1 : 0;
          return (a.loadPercent < b.loadPercent) ? -1 : f;
        });
        // Add current state to all
        this.allOps.push(totals);
        if (this.isPaused) {
          totals = this.allOps[this.pauseIndex];
        }
      } else if (error) {
        Actions.dbError({ 'op': 'top', 'error': error });
      }
      this.trigger(error, totals);
    });
  }
});

module.exports = TopStore;
