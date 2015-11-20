var Behavior = require('../behavior');
var Connection = require('../models/connection');

var _ = require('lodash');
var assert = require('assert');
// var debug = require('debug')('scout:connect:behavior');

module.exports = Behavior.extend({
  props: {
    // actions that apply to all states
    actionToNewState: {
      type: 'object',
      default: function() {
        return {
          'new connection clicked': 'NEW_EMPTY',
          'favorite connection clicked': 'FAV_UNCHANGED',
          'history connection clicked': 'HISTORY_UNCHANGED',
          'connect clicked': 'CONNECTING'
        };
      }
    },
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
    // actions that apply to certain states
    stateAndActionToNewState: {
      type: 'object',
      default: function() {
        return {
          'NEW_EMPTY': {
            'name added': 'NEW_NAMED'
          },
          'NEW_NAMED': {
            'create favorite clicked': 'FAV_UNCHANGED',
            'name removed': 'NEW_EMPTY'
          },
          'FAV_UNCHANGED': {
            'any field changed': 'FAV_CHANGED',
            'remove favorite clicked': 'NEW_EMPTY'
          },
          'FAV_CHANGED': {
            'remove favorite clicked': 'NEW_EMPTY',
            'save changes clicked': 'FAV_UNCHANGED'
          },
          'HISTORY_UNCHANGED': {
            'create favorite clicked': 'FAV_UNCHANGED',
            'any field changed': 'HISTORY_CHANGED'
          },
          'HISTORY_CHANGED': {
            'create favorite clicked': 'FAV_UNCHANGED'
          },
          'CONNECTING': {
            'error received': 'ERROR'
          },
          'ERROR': {
            'any field changed': function() {
              return this.beforeErrorState();
            }
          }
        };
      }
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
    }
  },
  applyNewState: function(action, newState, state, view) {
    /* eslint complexity: 0 */

    if (newState === 'NEW_EMPTY') {
      view.showFavoriteButtons = false;
      view.showSaveButton = false;
    } else if (newState === 'NEW_NAMED') {
      view.showSaveButton = false;
      view.showFavoriteButtons = true;
    } else if (newState === 'FAV_UNCHANGED') {
      if (action !== 'favorite connection clicked') {
        view.updateConnection();
      }
      view.showSaveButton = false;
      view.showFavoriteButtons = true;
      view.message = '';
    } else if (newState === 'FAV_CHANGED') {
      view.showSaveButton = true;
      view.showFavoriteButtons = true;
    } else if (newState === 'HISTORY_UNCHANGED') {
      assert.ok(view.connection);

      view.connection.is_favorite = false;
      if (view.connection.last_used) {
        view.connection.save();
      } else {
        view.connection.destroy();
      }

      view.showSaveButton = false;
      view.showFavoriteButtons = true;
      view.message = '';

      view.updateConflictingNames();
      view.updateForm();
    } else if (newState === 'HISTORY_CHANGED') {
      view.showSaveButton = false;
      view.showFavoriteButtons = true;
    } else if (newState === 'CONNECTING') {
      var connection;
      this.beforeErrorState = state;
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
      _.defer(view.validateConnection.bind(view), connection);
    } else if (state === 'ERROR') {
      view.showSaveButton = false;
      view.showFavoriteButtons = false;
    } else {
      throw new Error('Unexpected! newState should be defined by now.');
    }

    /* eslint complexity: 1 */
  },
  transition: function(action, state, view) {
    // check actionToNewState to see if the action will lead to a new state
    var newState = this.actionToNewState[action];
    if (!_.isUndefined(newState)) {
      // apply the effects of the new state
      if (action === 'new connection clicked') {
        view.authMethod = 'NONE';
        view.sslMethod = 'NONE';
        view.form.reset();
        view.message = '';
        view.connection = null;
        view.connectionName = '';
      }
      return newState;
    }

    // otherwise, then check stateAndActionToNewState to see if the state and
    // action will lead to a new state
    newState = this.stateAndActionToNewState[state][action];
    if (_.isFunction(newState)) {
      newState = newState();
    }
    if (!_.isUndefined(newState)) {
      // apply the effects of the new state
      if (_.includes(['FAV_CHANGED', 'FAV_UNCHANGED'], state) && action === 'remove favorite clicked') {
        view.removeFavoriteConnection();
      } else if (state === 'ERROR' && action === 'any field changed') {
        view.message = '';
      }
      return newState;
    }

    throw new Error('state not handled in connect dialog.');
  }
});
