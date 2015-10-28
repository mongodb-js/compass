/**
 * New connection sync which uses localforage as before for the
 * metadata (e.g. `_id`, `hostname`, `name`) but adds a second
 * backend for keeping passwords in the OS keychain.
 *
 * @see http://jira.mongodb.org/browse/INT-484
 *
 * @todo (imlucas): Needs tests and finishing.
 */
var _ = require('lodash');
var async = require('async');
var Metadata = require('./sync/metadata');
var Keychain = require('./sync/keychain');
var createErrback = require('./sync/create-errback');
var debug = require('debug')('mongodb-compass:models:connection-sync');

function connectionSyncHandler() {
  var metadata = new Metadata('com.mongodb.compass.Connection');
  var keychain = new Keychain('com.mongodb.compass.Connection');

  return function syncFromLocalforageAndKeychain(method, model, options) {
    var done = createErrback(method, model, options);
    debug('exec', {
      method: method,
      model: model,
      options: options
    });

    async.series([
      metadata.exec.bind(metadata, method, model, options),
      keychain.exec.bind(keychain, method, model, options)
    ], function(err, res) {
      debug('complete', {
        method: method,
        model: model,
        options: options,
        err: err,
        res: res
      });

      if (err) {
        return done(err);
      }

      if (!res) {
        return done();
      }

      // If this was a `find` or `findOne`, we'll
      // want to merge any password data into the
      // metadata to populate our model with.

      // @todo (thomasr) we probably don't want to create keychain entries for connections that
      // don't have passwords. Need to change this to include _id in return of Keychain#find
      // and only merge the passwords into the documents with correct keys.
      if (method === 'read') {
        if (model.isCollection) {
          _.each(_.zip(res[0], res[1]), function(pairs) {
            _.assign(pairs[0], pairs[1]);
          });
        } else {
          _.assign(res[0], res[1]);
        }
        done(null, res[0]);
      } else {
        done();
      }
    });
  };
}

module.exports = connectionSyncHandler;
