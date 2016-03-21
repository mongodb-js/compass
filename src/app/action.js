'use strict';

const debug = require('debug')('compass:app:action');
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

/**
 * The action for a package being activated.
 */
const packageActivated = Reflux.createAction({
  /**
   * Log the action.
   *
   * @param {Package} pkg - The activated package.
   */
  preEmit: function(pkg) {
    debug(`Package ${pkg.metadata.name} activated.`);
  }
});

/**
 * The action for when the package manager completes activation.
 */
const packageActivationCompleted = Reflux.createAction({
  /**
   * Log the action.
   */
  preEmit: function() {
    debug('Package activation completed.');
  }
});

/**
 * The action for a package being read from the filesystem or the cache.
 */
const packageRead = Reflux.createAction({
  /**
   * Log the action.
   *
   * @param {Package} pkg - The read package.
   */
  preEmit: function(pkg) {
    debug(`Package ${pkg.metadata.name} read.`);
  }
});

/**
 * The action for the application workspace being ready to interact with.
 */
const workspaceReady = Reflux.createAction({
  /**
   * Log the action.
   */
  preEmit: function() {
    debug('Compass workspace ready.');
  }
});

module.exports.componentDeregistered = componentDeregistered;
module.exports.componentRegistered = componentRegistered;
module.exports.packageActivationCompleted = packageActivationCompleted;
module.exports.packageActivated = packageActivated;
module.exports.packageRead = packageRead;
module.exports.workspaceReady = workspaceReady;
