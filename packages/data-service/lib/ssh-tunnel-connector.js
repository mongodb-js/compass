'use strict';

const debug = require('debug')('mongodb-data-service:ssh-tunnel-connector');
const tunnel = require('tunnel-ssh');
const EventEmitter = require('events');
const net = require('net');

const Events = {
  Connecting: 'SshTunnelConnector:Connecting',
  Testing: 'SshTunnelConnector:Testing',
  Ready: 'SshTunnelConnector:Ready',
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
   * @param {Function} done - The callback.
   *
   * @returns {Object} The executed callback.
   */
  connect(done) {
    if (!this.options.host) {
      debug('No SSH tunnel host option found - using direct connection.');
      return done();
    }

    const connectMessage = this._connectMessage();
    debug(connectMessage);
    this.emit(Events.Connecting, connectMessage);

    tunnel(this.options, (err) => {
      if (err) {
        this.emit(Events.Error, this._errorMessage());
        debug('error setting up tunnel', err);
        return done(err);
      }
      debug('tunnel opened - testing');
      this.test(done);
    }).on('error', (err) => {
      this.emit(Events.Error, this._errorMessage());
      debug('tunnel write failed', err);
      done(err);
    });
  }
  /**
   * Test that a tunnel can actually be created by opening a socket
   * to it and writing some data.
   *
   * @param {Function} done - The callback.
   */
  test(done) {
    this.emit(Events.Testing);
    var client = new net.Socket();
    client.on('error', function(err) {
      debug('test client got an error', err);
      client.end();
      done(err);
    });

    debug('test client connecting to %s:%s', this.options.dstHost, this.options.dstPort);
    client.connect(this.options.dstPort, this.options.dstHost, () => {
      debug('writing test message');
      try {
        client.write('mongodb-data-service:ssh-tunnel-connector: ping');
      } catch (err) {
        debug('write to test client failed with error', err);
        return done(err);
      }
      setTimeout(() => {
        client.end();
        debug('test successful - emitting %s', Events.Ready);
        this.emit(Events.Ready);
        done(null, true);
      }, 300);
    });
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
