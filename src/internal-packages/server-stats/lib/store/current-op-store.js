const Reflux = require('reflux');
const app = require('ampersand-app');
const Actions = require('../action');

const slowData = require('../component/data-slow');

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
    app.dataService.currentOp(true, (error, doc) => {
      this.trigger(error, slowData);
    });
  }
});

module.exports = CurrentOpStore;
