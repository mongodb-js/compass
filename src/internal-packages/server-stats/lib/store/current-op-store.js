const Reflux = require('reflux');
const app = require('ampersand-app');
const Actions = require('../action');
const toNS = require('mongodb-ns');
// const debug = require('debug')('mongodb-compass:server-stats:current-op-store');

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
    this.pauseIndex = 0;
  },

  pause: function() {
    this.pauseIndex = this.allOps.length - 1;
    this.isPaused = !this.isPaused;
  },

  currentOp: function() {
    app.dataService.currentOp(false, (error, response) => {
      let totals = [];
      if (!error && response) {
        const doc = response.inprog;
        for (let i = 0; i < doc.length; i++) {
          if (toNS(doc[i].ns).specialish) {
            continue;
          }
          totals.push(doc[i]);
        }
        totals.sort(function(a, b) {
          const f = (b.microsecs_running < a.microsecs_running) ? 1 : 0;
          return (a.microsecs_running < b.microsecs_running) ? -1 : f;
        });
        // Add current state to all
        this.allOps.push(totals);
        if (this.isPaused) {
          totals = this.allOps[this.pauseIndex];
        }
      }
      this.trigger(error, totals);
    });
  }
});

module.exports = CurrentOpStore;
