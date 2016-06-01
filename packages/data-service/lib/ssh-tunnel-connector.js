'use strict';

const debug = require('debug')('mongodb-data-service:ssh-tunnel-connector');
const tunnel = require('tunnel-ssh');

/**
 * Instantiate a new SshTunnelConnector object.
 *
 * @constructor
 * @param {Object} options - The ssh tunnel options.
 */
class SshTunnelConnector {

  /**
   * Instantiate a new SshTunnelConnector object.
   *
   * @constructor
   * @param {Object} options - The ssh tunnel options.
   */
  constructor(options) {
    this.options = options;
  }

  /**
   * Connect to the SSH tunnel and execute the callback.
   *
   * @param {Function} callback - The callback.
   *
   * @returns {Object} The executed callback.
   */
  connect(callback) {
    if (this.options.host) {
      debug('Found SSH tunnel options, opening SSH tunnel.');
      return tunnel(this.options, function(result, error) {
        return callback(error);
      });
    }
    debug('No SSH tunnel options found - using direct connection.');
    return callback(null);
  }
}

module.exports = SshTunnelConnector;
