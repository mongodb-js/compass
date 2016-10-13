const Reflux = require('reflux');
const Action = require('../action/index-actions');

/**
 * The reflux store for reporting DDL status updates.
 */
const DDLStatusStore = Reflux.createStore({

  /**
   * Initialize the DDL status store.
   */
  init: function() {
    this.listenTo(Action.updateStatus, this.updateStatus);
  },

  /**
   * Format message and pass status on to listeners.
   *
   * @param {string} status - The new status.
   * @param {string} message - The status message.
   */
  updateStatus: function(status, message) {
    if (message) {
      // format message
      message = message[0].toUpperCase() + message.slice(1);
    }
    this.trigger(status, message);
  }
});

module.exports = DDLStatusStore;
