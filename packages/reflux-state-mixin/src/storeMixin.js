var Reflux = require('Reflux');
var utils = require('./utils.js');


function attachAction(options, actionName) {
  if (this[actionName]) {
    console.warn(
        'Not attaching event ' + actionName + '; key already exists'
    );
    return;
  }
  this[actionName] = Reflux.createAction(options);
}


module.exports = {
  setState: function (state) {
    var changed = false;
    var prevState = utils.extend({}, this.state);

    for (var key in state) {
      if (state.hasOwnProperty(key)) {
        if (this.state[key] !== state[key]) {
          this[key].trigger(state[key]);
          changed = true;
        }
      }
    }

    if (changed) {
      this.state = utils.extend(this.state, state);

      if (utils.isFunction(this.storeDidUpdate)) {
        this.storeDidUpdate(prevState);
      }

      this.trigger(this.state);
    }

  },

  init: function () {
    if (utils.isFunction(this.getInitialState)) {
      this.state = this.getInitialState();
      for (var key in this.state) {
        if (this.state.hasOwnProperty(key)) {
          attachAction.call(this, this.state[key], key);
        }
      }
    }
  }
};