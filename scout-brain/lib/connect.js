var mongodb = require('mongodb'),
  MongoClient = mongodb.MongoClient,
  // Tunnel = require('./tunnel'),
  debug = require('debug')('scout-brain:connect');

function getConnectionString(instance_id, opts, fn) {
  var url = '',
    auth = opts.auth;

  if (instance_id.indexOf('mongodb://') === -1) {
    url += 'mongodb://';
  }

  if (auth && auth.mongodb) {
    url += auth.mongodb.username + ':' + auth.mongodb.password + '@';
  }

  url += instance_id;

  // Tunnel.resolve(instance_id, function(err, yolo) {
  //   if (err) return fn(err);

  //   url += yolo + '?poolSize=3&';

  //   if (opts.timeout) {
  //     url += 'connectTimeoutMS=' + opts.timeout + '&';
  //   }

  //   if (auth && auth.mongodb) {
  //     url += 'authSource=' + auth.mongodb.authdb + '&';
  //   }

  //   if (yolo !== instance_id) {
  //     debug('Connection URL updated for tunnel %s -> %s', yolo, instance_id);
  //     // @todo: Compare key files as extra guard here?
  //     if (auth && auth.ssh) {
  //       debug('Ignoring ssh auth because the tunnel already exists.');
  //     }
  //     return fn(null, url);
  //   } else if (auth && auth.ssh) {
  //     debug('Creating ssh tunnel');

  //     var p = instance_id.split(':'),
  //       hostname = p[0],
  //       port = parseInt(p[1], 10),
  //       tunnelOptions = {
  //         remote: port,
  //         port: auth.ssh_port,
  //         username: auth.ssh_username
  //       };

  //     return Tunnel.create(hostname, auth.ssh.key, tunnelOptions, function(err, _id) {
  //       if (err) return fn(err);
  //       debug('Tunnel %s established', _id);
  //       Tunnel.get(_id, function(err, tunnel) {
  //         url = url.replace(instance_id, tunnel._local);
  //         debug('Flipped URL for %s to %s', instance_id, url);
  //         return fn(null, url);
  //       });
  //     });
  //   }
  return fn(null, url);
  // });
}

module.exports = function(instance_id, opts, fn) {
  opts = opts || {};
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }

  getConnectionString(instance_id, opts, function(err, url) {
    if (err) return fn(err);

    debug('trying to connect to `%s`', url);
    MongoClient.connect(url, function(err, db) {
      if (err) {
        debug('failed', err);
        return fn(err);
      }
      debug('successfully connected!');
      return fn(null, db);
    });
  });
};
