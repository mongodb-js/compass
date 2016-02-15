//var Reflux = require('reflux');
//var utils = require('./utils.js');
import Reflux from 'reflux';
import {extend, isFunction, setProp} from './utils.js';


function attachAction(actionName) {
  if (this[actionName]) {
    console.warn(
        'Not attaching event ' + actionName + '; key already exists'
    );
    return;
  }
  this[actionName] = Reflux.createAction();
}


export default {
  setState: function (state) {
    var changed = false;
    var prevState = extend({}, this.state);

    for (var key in state) {
      if (state.hasOwnProperty(key)) {
        if (this.state[key] !== state[key]) {
          this.state = setProp(this.state, state, key);
          //this.state[key] = state[key];
          this[key].trigger(state[key]);
          changed = true;
        }
      }
    }

    if (changed) {
      //this.state = extend(this.state, state);

      if (isFunction(this.storeDidUpdate)) {
        this.storeDidUpdate(prevState);
      }

      this.trigger(this.state);
    }

  },

  init: function () {
    if (isFunction(this.getInitialState)) {
      this.state = this.getInitialState();
      for (var key in this.state) {
        if (this.state.hasOwnProperty(key)) {
          attachAction.call(this, key);
        }
      }
    }
  }
};