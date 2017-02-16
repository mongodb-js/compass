const Reflux = require('reflux');
const Actions = require('../actions');
const translate = require('mongodb-js-errors').translate;
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:server-stats:dberror-store');

const DBErrorStore = Reflux.createStore({

  init: function() {
    this.restart();
    this.listenTo(Actions.dbError, this.dbError);
    this.listenTo(Actions.restart, this.restart);
  },

  restart: function() {
    this.ops = {top: null, currentOp: null, serverStatus: null};
    this.srcName = {top: 'Hottest Collections', currentOp: 'Slowest Operations', serverStatus: 'Stats Charts'};
  },

  /**
   * Translates the error message to something human readable. From data-service.
   *
   * @param {Error} error - The error.
   *
   * @returns {Error} The error with message translated.
   */
  _translateMessage(error) {
    const mapping = translate(error);
    if (mapping) {
      error.message = mapping.message;
    }
    return error;
  },

  publish: function() {
    const msg = [];
    for (let key in this.ops) { // eslint-disable-line prefer-const
      if (this.ops.hasOwnProperty( key ) ) {
        if (this.ops[key] !== null) {
          msg.push({errorMsg: this._translateMessage(this.ops[key]).message, ops: key, type: this.ops[key].name, srcName: this.srcName[key]});
        }
      }
    }
    this.trigger(msg);
  },

  dbError: function(data) {
    if (data.error !== null && this.ops[data.op] !== null && data.op === 'top'
        && _.isEqual(this.ops[data.op], data.error)) {
      Actions.suppressTop(true);
      return;
    }

    // Remove previous error
    if (this.ops[data.op] !== null && data.error === null) {
      this.ops[data.op] = data.error;
      this.publish();
    }
    // New error
    if (data.error !== null && !_.isEqual(this.ops[data.op], data.error)) {
      this.ops[data.op] = data.error;
      this.publish();
    }
  }

});

module.exports = DBErrorStore;
