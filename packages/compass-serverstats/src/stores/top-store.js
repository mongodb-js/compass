/* eslint complexity:0 */
const Reflux = require('reflux');
const Actions = require('../actions');

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
    this.listenTo(Actions.pollTop, this.top);
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

  top: function() {
    // app.dataService.top((error, response) => {
    //   let totals = [];
    //   this.error = error;
    //   if (!error && response !== undefined && ('totals' in response)) {
    //     if (this.starting) { // Skip first to match charts
    //       this.starting = false;
    //       return;
    //     }
    //     const doc = response.totals;
    //     let totalTime = 0;
    //     for (let collname in doc) { // eslint-disable-line prefer-const
    //       if (!doc.hasOwnProperty(collname) || collname === 'note' || toNS(collname).specialish) {
    //         continue;
    //       }
    //       const subdoc = doc[collname];
    //       if (!('readLock' in subdoc) || !('writeLock' in subdoc) || !('total' in subdoc)) {
    //         debug('Error: top response from DB missing fields', subdoc);
    //       }
    //       totals.push({
    //         'collectionName': collname,
    //         'loadPercentR': (subdoc.readLock.time / subdoc.total.time) * 100,
    //         'loadPerfectL': (subdoc.writeLock.time / subdoc.total.time) * 100,
    //         'loadPercent': subdoc.total.time
    //       });
    //       totalTime += subdoc.total.time;
    //     }
    //     for (let i = 0; i < totals.length; i++) {
    //       totals[i].loadPercent = _.round((totals[i].loadPercent / totalTime) * 100, 0);
    //     }
    //     for (let i = totals.length - 1; i >= 0; i--) {
    //       if (!totals[i].loadPercent) {
    //         totals.splice(i, 1);
    //       }
    //     }
    //     totals.sort(function(a, b) {
    //       const f = (b.loadPercent < a.loadPercent) ? -1 : 0;
    //       return (a.loadPercent < b.loadPercent) ? 1 : f;
    //     });
    //     // Add current state to all
    //     this.allOps.push(totals);
    //     if (this.isPaused) {
    //       totals = this.allOps[this.endPause];
    //     } else {
    //       this.endPause = this.allOps.length;
    //     }
    //     // This handled by mouseover function completely
    //     if (this.inOverlay) {
    //       return;
    //     }
    //   } else if (error) {
    //     Actions.dbError({ 'op': 'top', 'error': error });
    //   }
    //   this.trigger(error, totals);
    // });
  }
});

module.exports = TopStore;
