'use strict';

const debug = require('debug')('mongodb-data-service:ssh-tunnel-connector');
const tunnel = require('tunnel-ssh');
const EventEmitter = require('events');

const Events = {
  Connecting: 'SshTunnelConnector:Connecting',
  Error: 'SshTunnelConnector:Error'
};

/**
 * Instantiate a new SshTunnelConnector object.
 *
 * @constructor
 * @param {Object} options - The ssh tunnel options.
 */
class SshTunnelConnector extends EventEmitter {

  /**
   * Instantiate a new SshTunnelConnector object.
   *
   * @constructor
   * @param {Object} options - The ssh tunnel options.
   */
  constructor(options) {
    super();
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
      var connectMessage = this._connectMessage();
      debug(connectMessage);
      this.emit(Events.Connecting, connectMessage);
      return tunnel(this.options, function(result, error) {
        if (error) {
          this.emit(Events.Error, this._errorMessage());
        }
        return callback(error);
      });
    }
    debug('No SSH tunnel options found - using direct connection.');
    return callback(null);
  }

  /**
   * Get the connecting message.
   *
   * @returns {String} The connecting message.
   */
  _connectMessage() {
    return `Attempting SSH connection to server at ${this.options.host}`;
  }

  /**
   * Get the error message.
   *
   * @returns {String} The error message.
   */
  _errorMessage() {
    return `Failed to connect to ${this.options.host} via SSH tunnel.`;
  }
}

module.exports = SshTunnelConnector;
module.exports.Events = Events;
