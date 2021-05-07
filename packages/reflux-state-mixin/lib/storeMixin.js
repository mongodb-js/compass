'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _reflux = require('reflux');

var _reflux2 = _interopRequireDefault(_reflux);

var _utils = require('./utils.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//var Reflux = require('reflux');
//var utils = require('./utils.js');
function attachAction(actionName) {
  if (this[actionName]) {
    console.warn('Not attaching event ' + actionName + '; key already exists');
    return;
  }
  this[actionName] = _reflux2.default.createAction();
}

exports.default = {
  setState: function setState(state) {
    var changed = false;
    var prevState = (0, _utils.extend)({}, this.state);

    for (var key in state) {
      if (state.hasOwnProperty(key)) {
        if (this.state[key] !== state[key]) {
          this.state = (0, _utils.setProp)(this.state, state, key);
          //this.state[key] = state[key];
          this[key].trigger(state[key]);
          changed = true;
        }
      }
    }

    if (changed) {
      //this.state = extend(this.state, state);

      if ((0, _utils.isFunction)(this.storeDidUpdate)) {
        this.storeDidUpdate(prevState);
      }

      this.trigger(this.state);
    }
  },

  init: function init() {
    if ((0, _utils.isFunction)(this.getInitialState)) {
      this.state = this.getInitialState();
      for (var key in this.state) {
        if (this.state.hasOwnProperty(key)) {
          attachAction.call(this, key);
        }
      }
    }
  }
};