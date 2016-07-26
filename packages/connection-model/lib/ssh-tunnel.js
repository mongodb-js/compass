var assert = require('assert');
var createTunnel = require('tunnel-ssh');
var EventEmitter = require('events').EventEmitter;
var net = require('net');
var inherits = require('util').inherits;
var debug = require('debug')('mongodb-connection-model:ssh-tunnel');

function SSHTunnel(model) {
  assert(model.hostname, 'hostname required');
  assert(model.port, 'port required');

  this.model = model;
  this.on('status', function(evt) {
    debug('status', evt);
  });
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

  this._tunnel = createTunnel(this.model.ssh_tunnel_options, function(err) {
    if (err) {
      debug('error setting up tunnel', err);
      this.emit('status', {
        message: 'Create SSH Tunnel',
        error: err
      });

      return done(err);
    }
    this.emit('status', {
      message: 'Create SSH Tunnel',
      complete: true
    });

    done(null, true);
  }.bind(this));

  return this;
};

SSHTunnel.prototype.test = function(done) {
  this.emit('status', {
    message: 'Test SSH Tunnel',
    pending: true
  });

  var client = new net.Socket();
  client.on('error', function(err) {
    debug('test client got an error', err);
    client.end();
    this.emit('status', {
      message: 'Test SSH Tunnel',
      error: err
    });

    done(new Error('SSH Failed.  Please ' + err.message));
  }.bind(this));

  debug('test client connecting to %s:%s', this.model.hostname, this.model.port);

  client.connect(this.model.hostname, this.model.port, function() {
    debug('writing test message');
    try {
      client.write('mongodb-connection-model:ssh-tunnel: ping');
    } catch (err) {
      debug('write to test client failed with error', err);
      return done(err);
    }

    client.on('end', function() {
      debug('disconnecting test socket');
      this.emit('status', {
        message: 'Test SSH Tunnel',
        complete: true
      });
      done(null, true);
    }.bind(this));

    setTimeout(function() {
      client.end();
    }, 300);
  }.bind(this));
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
