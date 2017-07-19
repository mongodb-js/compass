var State = require('ampersand-state');
var assert = require('assert');
var Connection = require('../models/connection');
var _ = require('lodash');

// var debug = require('debug')('mongodb-compass:connect:behavior');

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
        'CONNECTING',
        'ERROR'
      ]
    },
    beforeErrorState: {
      type: 'string',
      default: null
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
        'error received',
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
          CONNECTING: ['error received'],
          ERROR: ['any field changed']
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
  dispatch: function(action) {
    var newState = this.reduce(this.state, action);
    // if (newState !== this.state) {
    //   debug('transition: (%s, %s) ==> %s', this.state, action, newState);
    // }
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
    var view = this.view;
    var newState = null;
    var connection;

    /* eslint indent: 0 complexity: 0 */

    // check if the current state allows the given action
    if (this.validTransitions[state].indexOf(action) === -1) {
      // debug('ignoring action `%s` in state `%s`', action, state);
      return state;
    }
    // general actions, independent of state
    switch (action) {
      case 'new connection clicked':
        newState = 'NEW_EMPTY';
        view.message = '';
        // create new connection first
        view.connection = new Connection();
        // the next lines will implicitly modify view.connection
        view.authMethod = 'NONE';
        view.sslMethod = 'NONE';
        view.connectionName = '';
        view.form.reset();
        break;
      case 'favorite connection clicked':
        newState = 'FAV_UNCHANGED';
        break;
      case 'history connection clicked':
        newState = 'HISTORY_UNCHANGED';
        break;
      case 'connect clicked':
        newState = 'CONNECTING';
        break;
      default:
        break;
    }

    // state specific actions
    if (!newState) {
      switch (state) {
        case 'NEW_EMPTY':
          assert.equal(action, 'name added');
          newState = 'NEW_NAMED';
          break;

        case 'NEW_NAMED':
          if (action === 'create favorite clicked') {
            newState = 'FAV_UNCHANGED';
          } else if (action === 'name removed') {
            newState = 'NEW_EMPTY';
          }
          break;

        case 'FAV_UNCHANGED':
          if (action === 'any field changed') {
            newState = 'FAV_CHANGED';
          } else if (action === 'remove favorite clicked') {
            newState = 'NEW_EMPTY';
            view.removeFavoriteConnection();
          }
          break;

        case 'FAV_CHANGED':
          if (action === 'remove favorite clicked') {
            newState = 'NEW_EMPTY';
            view.removeFavoriteConnection();
          } else if (action === 'save changes clicked') {
            newState = 'FAV_UNCHANGED';
          }
          break;

        case 'HISTORY_UNCHANGED':
          if (action === 'create favorite clicked') {
            newState = 'FAV_UNCHANGED';
          } else if (action === 'any field changed') {
            newState = 'HISTORY_CHANGED';
          }
          break;

        case 'HISTORY_CHANGED':
          assert.equal(action, 'create favorite clicked');
          newState = 'FAV_UNCHANGED';
          break;

        case 'CONNECTING':
          assert.equal(action, 'error received');
          newState = 'ERROR';
          break;

        case 'ERROR':
          assert.equal(action, 'any field changed');
          newState = this.beforeErrorState;
          view.message = '';
          break;

        default:
          throw new Error('state not handled in connect dialog.');
      }
    }

    // behavior based on new state alone
    switch (newState) {
      case 'NEW_EMPTY':
        view.showFavoriteButtons = false;
        view.showSaveButton = false;
        break;

      case 'NEW_NAMED':
        view.showSaveButton = false;
        view.showFavoriteButtons = true;
        break;

      case 'FAV_UNCHANGED':
        if (action !== 'favorite connection clicked') {
          view.updateConnection();
        }
        view.showSaveButton = false;
        view.showFavoriteButtons = true;
        view.message = '';
        break;

      case 'FAV_CHANGED':
        view.showSaveButton = true;
        view.showFavoriteButtons = true;
        break;

      case 'HISTORY_UNCHANGED':
        assert.ok(view.connection);

        view.connection.is_favorite = false;
        if (view.connection.last_used) {
          view.connection.save(null);
        } else {
          view.connection.destroy();
        }

        view.showSaveButton = false;
        view.showFavoriteButtons = true;
        view.message = '';

        view.updateConflictingNames();
        view.updateForm();
        break;

      case 'HISTORY_CHANGED':
        view.showSaveButton = false;
        view.showFavoriteButtons = true;
        break;

      case 'CONNECTING':
        this.beforeErrorState = state;
        view.showFavoriteButtons = false;
        view.showSaveButton = false;

        if (!_.endsWith(state, '_UNCHANGED')) {
          // the user has modified the form fields and opted not to save the
          // changes. We need to create a new connection and leave the old
          // one intact.
          view.form.setValues({
            name: ''
          });
          connection = new Connection(view.form.data);
        } else {
          connection = view.connection;
        }
        connection.app_name = 'mongodb-compass';
        _.defer(view.validateConnection.bind(view), connection);
        break;

      case 'ERROR':
        view.showSaveButton = false;
        view.showFavoriteButtons = false;
        break;

      default:
        throw new Error('Unexpected! newState should be defined by now.');
    }

    return newState;
  }
});
