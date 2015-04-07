var types = require('./types'),
  sharding = require('./sharding'),
  replicaset = require('./replicaset'),
  debug = require('debug')('scout-brain:discover');

/**
 * Weave our way through to find all of the instances in a deployment.
 *
 * @todo: handle dynamic updates (new members, state changes) and
 * update the deployment store
 */
module.exports = function discover(db, fn) {
  // @todo: isMongos() function moved?
  // if (db.serverConfig.isMongos()) {
  //   return sharding.discover(db, fn);
  // }

  // We're in a replset
  if (db.serverConfig.s.replset) {
    debug('its a replicaset');
    return replicaset.discover(db, fn);
  }

  debug('its a standalone');
  process.nextTick(function() {
    var p = db.serverConfig.s;
    return fn(null, {
      instances: [types.url(p.host + ':' + p.port).toJSON()]
    });
  });
};
