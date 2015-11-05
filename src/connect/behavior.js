var State = require('ampersand-state');
var debug = require('debug')('scout:connect:behavior');
var assert = require('assert');
var _ = require('lodash');

module.exports = State.extend({
  props: {
    view: 'any',
    state: {
      type: 'string',
      default: 'NEW_EMPTY',
      required: true,
      values: [
        'NEW_EMPTY',
        'NEW_NAMED',
        'FAV_UNCHANGED',
        'FAV_CHANGED',
        'HISTORY_UNCHANGED',
        'HISTORY_CHANGED',
        'CONNECTING'
      ]
    },
    action: {
      type: 'string',
      default: '',
      required: true,
      values: [
        'new connection clicked',
        'favorite connection clicked',
        'history connection clicked',
        'name added',
        'name removed',
        'create favorite clicked',
        'remove favorite clicked',
        'save changes clicked',
        'connect clicked',
        'any field changed'
      ]
    },
    validTransitions: {
      type: 'object',
      default: function() {
        var transitions = {
          NEW_EMPTY: ['name added', 'connect clicked'],
          NEW_NAMED: ['name removed', 'create favorite clicked'],
          FAV_UNCHANGED: ['remove favorite clicked', 'any field changed'],
          FAV_CHANGED: ['save changes clicked', 'remove favorite clicked'],
          HISTORY_UNCHANGED: ['create favorite clicked', 'any field changed'],
          HISTORY_CHANGED: ['create favorite clicked'],
          CONNECTING: []
        };

        // these actions are valid in any state, add to all transitions
        var validActions = [
          'new connection clicked',
          'favorite connection clicked',
          'history connection clicked',
          'connect clicked'
        ];
        _.each(transitions, function(value, key) {
          transitions[key] = validActions.concat(value);
        });

        return transitions;
      }
    }
  },
  initialize: function(view) {
    // this is the connect view instance
    this.view = view;
  },
  dispatch: function(action) {
    var newState = this.reduce(this.state, action);
    if (newState !== this.state) {
      debug('transition: (%s, %s) ==> %s', this.state, action, newState);
    }
    this.state = newState;
    return this.state;
  },
  /**
   * return new state based on current state and action
   * @param  {String} state    one of the states defined above
   * @param  {String} action   one of the actions defined above
   * @return {String}          new state as defined above
   */
  reduce: function(state, action) {
    /* eslint indent: 0 complexity: 0 */

    // check if the current state allows the given action
    if (this.validTransitions[state].indexOf(action) === -1) {
      debug('ignoring action `%s` in state `%s`', action, state);
      return state;
    }
    // general actions, independent of state
    switch (action) {
      case 'new connection clicked': return 'NEW_EMPTY';
      case 'favorite connection clicked': return 'FAV_UNCHANGED';
      case 'history connection clicked': return 'HISTORY_UNCHANGED';
      case 'connect clicked': return 'CONNECTING';
      default: break;
    }

    // state specific actions
    switch (state) {
      case 'NEW_EMPTY':
        assert.equal(action, 'name added');
        return 'NEW_NAMED';

      case 'NEW_NAMED':
        if (action === 'create favorite clicked') {
          return 'FAV_UNCHANGED';
        }
        if (action === 'name removed') {
          return 'NEW_EMPTY';
        }
        break;

      case 'FAV_UNCHANGED':
        if (action === 'any field changed') {
          return 'FAV_CHANGED';
        }
        if (action === 'remove favorite clicked') {
          return 'NEW_EMPTY';
        }
        break;

      case 'FAV_CHANGED':
        if (action === 'remove favorite clicked') {
          return 'NEW_EMPTY';
        }
        if (action === 'save changes clicked') {
          return 'FAV_UNCHANGED';
        }
        break;

      case 'HISTORY_UNCHANGED':
        if (action === 'create favorite clicked') {
          return 'FAV_UNCHANGED';
        }
        if (action === 'any field changed') {
          return 'HISTORY_CHANGED';
        }
        break;

      case 'HISTORY_CHANGED':
        assert.equal(action, 'create favorite clicked');
        return 'FAV_UNCHANGED';

      default:
        throw new Error('state not handled in connect dialog.');
    }
  }
});
