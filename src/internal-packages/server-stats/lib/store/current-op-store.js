const Reflux = require('reflux');
const app = require('ampersand-app');
const Actions = require('../action');
const toNS = require('mongodb-ns');
const debug = require('debug')('mongodb-compass:server-stats:crp-store');

/* eslint complexity:0 */

/**
 * This store listens to the
 * 'pollCurrentOp' action, fetches the current op data, and
 * triggers with the result of the command.
 */
const CurrentOpStore = Reflux.createStore({

  /**
   * Initializing the store should set up the listener for
   * the 'pollCurrentOp' command.
   */
  init: function() {
    this.listenTo(Actions.pollCurrentOp, this.currentOp);
    this.listenTo(Actions.pause, this.pause);
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

  currentOp: function() {
    app.dataService.currentOp(false, (error, response) => {
      let totals = [];
      this.error = error;
      if (!error && response !== undefined && ('inprog' in response)) {
        if (this.starting) { // Skip first to match charts
          this.starting = false;
          return;
        }
        const doc = response.inprog;
        for (let i = 0; i < doc.length; i++) {
          if (toNS(doc[i].ns).specialish) {
            continue;
          }
          if (!('microsecs_running' in doc[i])) {
            debug('Error: currentOp result from DB did not include \'microsecs_running\'', doc[i]);
            doc[i].microsecs_running = 0;
          }
          if (!('ns' in doc[i]) || !('op' in doc[i])) {
            debug('Error: currentOp result from DB did not include \'ns\' or \'op\'', doc[i]);
          }
          totals.push(doc[i]);
        }
        totals.sort(function(a, b) {
          const f = (b.microsecs_running < a.microsecs_running) ? -1 : 0;
          return (a.microsecs_running < b.microsecs_running) ? 1 : f;
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
        Actions.dbError({'op': 'currentOp', 'error': error });
      }
      this.trigger(error, totals);
    });
  }
});

module.exports = CurrentOpStore;
