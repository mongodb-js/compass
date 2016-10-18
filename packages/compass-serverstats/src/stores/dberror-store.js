const Reflux = require('reflux');
const Actions = require('../actions');
// const debug = require('debug')('mongodb-compass:server-stats:dberror-store');

const DBErrorStore = Reflux.createStore({

  init: function() {
    this.restart();
    this.listenTo(Actions.dbError, this.dbError);
    this.listenTo(Actions.restart, this.restart);
  },

  restart: function() {
    this.ops = {'top': null, 'currentOp': null, 'serverStatus': null};
    this.errors = {};
  },

  dbError: function(data) {
    // New or different error
    const err = data.error.name + ': ' + data.error.message;
    if (this.ops[data.op] !== err) {
      this.ops[data.op] = err;
      if (err in this.errors) {
        this.errors[err] = this.errors[err] + ', ' + data.op;
      } else {
        this.errors[err] = data.op;
      }
      const msg = [];
      for (let key in this.errors) { // eslint-disable-line prefer-const
        if (this.errors.hasOwnProperty( key ) ) {
          msg.push({'errorMsg': key, 'ops': this.errors[key], 'type': this.errors});
        }
      }
      this.trigger(msg);
    }
  }

});

module.exports = DBErrorStore;
