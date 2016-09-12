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
  },

  currentOp: function() {
    app.dataService.currentOp(false, (error, response) => {
      const doc = response.inprog;
      let totals = [];
      for (let i = 0; i < doc.length; i++) {
        if (toNS(doc[i].ns).specialish) {
          continue;
        }
        totals.push({
          operationType: doc[i].op,
          collectionName: doc[i].ns,
          time: doc[i].microsecs_running
        });
      }
      totals.sort(function(a, b) {
        const f = (b.time < a.time) ? 1 : 0;
        return (a.time < b.time) ? -1 : f;
      });
      totals = totals.slice(Math.max(totals.length - 6, 0));
      this.trigger(error, totals);
    });
  }
});

module.exports = CurrentOpStore;
