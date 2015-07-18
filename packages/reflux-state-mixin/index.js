'use strict';

var update = require('react/addons').addons.update;


/**
 * Creates the mixin, ready for use in a store
 *
 * @param Reflux object An instance of Reflux
 * @returns {{setState: Function, init: Function}}
 */
module.exports = function stateMixin(Reflux) {

  if (typeof Reflux !== 'object' || typeof Reflux.createAction !== 'function') {
    throw new Error('Must pass reflux instance to reflux-state-mixin');
  }

  function attachAction(options, actionName) {
    if (this[actionName]) {
      console.warn(
          'Not attaching event ' + actionName + '; key already exists'
      );
      return;
    }
    this[actionName] = Reflux.createAction(options);
  }

  return {
    setState: function (state) {
      for(var key in state){
        if(state.hasOwnProperty(key)){
          if(this.state[key]!== state[key]){
            this[key].trigger(state[key]);
          }
        }
      }
      this.state = update(this.state, {$merge: state});
      this.trigger(this.state);
    },

    init: function () {
      if(typeof this.getInitialState === "function"){
        this.state = this.getInitialState();
        for(var key in this.state){
          if(this.state.hasOwnProperty(key)){
            attachAction.call(this, this.state[key], key);
          }
        }
      }
    }
  }
};