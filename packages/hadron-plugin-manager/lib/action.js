'use strict';

const debug = require('debug')('hadron-plugin-manager:action');
const Reflux = require('reflux');

/**
 * The action for a plugin being activated.
 */
const pluginActivated = Reflux.createAction({
  /**
   * Log the action.
   *
   * @param {Plugin} pkg - The activated plugin.
   */
  sync: true,
  preEmit: function(pkg) {
    debug(`Plugin ${pkg.metadata.name} activated.`);
  }
});

/**
 * The action for when the plugin manager completes activation.
 */
const pluginActivationCompleted = Reflux.createAction({
  /**
   * Log the action.
   */
  sync: true,
  preEmit: function() {
    debug('Plugin activation completed.');
  }
});

module.exports.pluginActivationCompleted = pluginActivationCompleted;
module.exports.pluginActivated = pluginActivated;
