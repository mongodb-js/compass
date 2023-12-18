const Reflux = require('reflux');
const Actions = require('../actions');
const { isEqual } = require('lodash');

const DBErrorStore = Reflux.createStore({
  init: function () {
    this.restart();
    this.listenTo(Actions.dbError, this.dbError);
    this.listenTo(Actions.restart, this.restart);
  },

  restart: function () {
    this.ops = { top: null, currentOp: null, serverStatus: null };
    this.srcName = {
      top: 'Hottest Collections',
      currentOp: 'Slowest Operations',
      serverStatus: 'Stats Charts',
    };
  },

  publish: function () {
    const msg = [];
    for (let key in this.ops) {
      // eslint-disable-line prefer-const
      if (Object.prototype.hasOwnProperty.call(this.ops, key)) {
        if (this.ops[key] !== null) {
          msg.push({
            errorMsg: this.ops[key].message,
            ops: key,
            type: this.ops[key].name,
            srcName: this.srcName[key],
          });
        }
      }
    }
    this.trigger(msg);
  },

  dbError: function (data) {
    // Remove previous error
    if (this.ops[data.op] !== null && data.error === null) {
      this.ops[data.op] = data.error;
      this.publish();
    }
    // New error
    if (data.error !== null && !isEqual(this.ops[data.op], data.error)) {
      this.ops[data.op] = data.error;
      this.publish();
    }
  },
});

module.exports = DBErrorStore;
