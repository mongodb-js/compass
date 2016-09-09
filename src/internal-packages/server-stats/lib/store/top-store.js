const Reflux = require('reflux');
const app = require('ampersand-app');
const Actions = require('../action');

const hotData = require('../component/data-hot-1');

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
  },

  top: function() {
    app.dataService.top((error, doc) => {
      this.trigger(error, hotData);
    });
  }
});

module.exports = TopStore;
