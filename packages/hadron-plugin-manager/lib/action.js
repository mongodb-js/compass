'use strict';

const debug = require('debug')('mongodb-package-manager:action');
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
 * The action for a package directory scan failing.
 */
const packageScanFailed = Reflux.createAction({
  /**
   * Log the action.
   *
   * @param {Error} error - The error.
   */
  preEmit: function(error) {
    debug(`Package director scan failed: ${error.message}.`);
  }
});

module.exports.packageActivationCompleted = packageActivationCompleted;
module.exports.packageActivated = packageActivated;
module.exports.packageScanFailed = packageScanFailed;
module.exports.packageRead = packageRead;
