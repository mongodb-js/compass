'use strict';

const debug = require('debug')('hadron-package-manager:action');
const Reflux = require('reflux');

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
  sync: true,
  preEmit: function() {
    debug('Package activation completed.');
  }
});

module.exports.packageActivationCompleted = packageActivationCompleted;
module.exports.packageActivated = packageActivated;
