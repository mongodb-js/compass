var assert = require('assert');
var createTunnel = require('tunnel-ssh');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var debug = require('debug')('mongodb-connection-model:ssh-tunnel');

function SSHTunnel(model) {
  assert(model.hostname, 'hostname required');
  assert(model.port, 'port required');

  this.model = model;
}
inherits(SSHTunnel, EventEmitter);

SSHTunnel.prototype.listen = function(done) {
  /**
   * TODO (imlucas) dns.lookup(model.ssh_tunnel_hostname) to check for typos
   */

  this.emit('status', {
    message: 'Create SSH Tunnel',
    pending: true
  });
  /**
   * Workaround a bug in `tunnel-ssh` where the error event is not
   * handled.  This causes an UncaughtException in cases such as
   * attempting to use a key which is passphrase protected.
   *
   * @see INT-1771
   */

  this._tunnel = createTunnel(this.model.ssh_tunnel_options, function() {
    debug('tunnel-ssh called callback');
  });

  this._tunnel.on('netConnection', function(netConnection) {
    var onError = this._tunnel.emit.bind(this._tunnel, 'error');
    netConnection.on('sshStream', function(sshStream) {
      sshStream.on('error', function(err) {
        onError(err);
      });
    });
  }.bind(this));

  this._tunnel.on('listening', function() {
    this.emit('status', {
      message: 'Create SSH Tunnel',
      complete: true
    });

    done(null, true);
  }.bind(this));

  this._tunnel.on('error', function(err) {
    debug('error setting up tunnel', err);
    this.emit('status', {
      message: 'Create SSH Tunnel',
      error: err
    });
    done(err);
  }.bind(this));

  return this;
};

SSHTunnel.prototype.close = function() {
  this.emit('status', {
    message: 'Closing SSH Tunnel'
  });

  if (this._connected) {
    this._tunnel.close();
  }
};

module.exports = function(model, done) {
  var tunnel = new SSHTunnel(model);
  if (model.ssh_tunnel === 'NONE') {
    done();
    return tunnel;
  }

  tunnel.listen(done);
  return tunnel;
};
