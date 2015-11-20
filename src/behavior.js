var State = require('ampersand-state');

var _ = require('lodash');
var debug = require('debug')('scout:behavior');

module.exports = State.extend({
  props: {
    view: 'any'
  },
  initialize: function(view) {
    this.view = view;
  },
  dispatch: function(action) {
    var newState = null;

    if (this.isValidTransition(this.state, action)) {
      newState = this.reduce(action, this.state, this.view);
    } else {
      debug('invalid transition', this.state, action);
      return;
    }

    if (newState !== this.state) {
      debug('transition: (%s, %s) ==> %s', this.state, action, newState);
    }
    this.state = newState;
  },
  isValidTransition: function(state, action) {
    var newState = this.actionToNewState[action];
    if (_.isString(newState)) {
      return true;
    }

    var actionToNewState = this.stateAndActionToNewState[state];
    if (_.isUndefined(actionToNewState)) {
      return false;
    }
    newState = actionToNewState[action];
    return !_.isUndefined(newState);
  }
});
