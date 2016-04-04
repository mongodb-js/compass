'use strict';

const debug = require('debug')('mongodb-component-registry:action');
const Reflux = require('reflux');

/**
 * The action for a component being deregistered.
 */
const componentDeregistered = Reflux.createAction({
  /**
   * Log the action.
   *
   * @param {Component} component - The React component.
   */
  preEmit: function(component) {
    debug(`Component ${component.displayName} deregistered.`);
  }
});

/**
 * The action for a component being registered.
 */
const componentRegistered = Reflux.createAction({
  /**
   * Log the action.
   *
   * @param {Component} component - The React component.
   */
  preEmit: function(component) {
    debug(`Component ${component.displayName} registered.`);
  }
});

module.exports.componentDeregistered = componentDeregistered;
module.exports.componentRegistered = componentRegistered;
