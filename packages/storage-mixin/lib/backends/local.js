var inherits = require('util').inherits;
var format = require('util').format;
var localforage = require('localforage');
var BaseBackend = require('./base');
var _ = require('lodash');
var async = require('async');
var debug = require('debug')('storage-mixin:sync:local');


function LocalBackend(namespace) {
  if (!(this instanceof LocalBackend)) {
    return new LocalBackend(namespace);
  }
  this.namespace = namespace;

  // configure localforage
  localforage.config({
    driver: localforage.LOCALSTORAGE,
    name: 'storage-mixin',
    storeName: namespace
  });
}
inherits(LocalBackend, BaseBackend);

/**
 * Get the primary key `model` is stored under.
 *
 * @param {ampersand-model} model
 * @return {Any}
 *
 * @api private
 */
LocalBackend.prototype._key = function(model) {
  return model.getId();
};

/**
 * The `localforage` API doesn't support atomic updates
 * so `update` and `create` are the same under the hood.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 * @api private
 */
LocalBackend.prototype._write = function(model, options, done) {
  localforage.setItem(this._key(model), model.serialize(), done);
};

/**
 * Load a model with `localforage`.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-model-fetch
 */
LocalBackend.prototype.findOne = function(model, options, done) {
  localforage.getItem(this._key(model), done);
};

/**
 * Delete a model via `localforage`.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-model-destroy
 */
LocalBackend.prototype.remove = function(model, options, done) {
  localforage.removeItem(this._key(model), done);
};

/**
 * Point `update` interface method at our `_write` method.
 */
LocalBackend.prototype.update = LocalBackend.prototype._write;

/**
 * Point `create` interface method at our `_write` method.
 */
LocalBackend.prototype.create = LocalBackend.prototype._write;

/**
 * Fetch all keys stored under the active namespace.
 *
 * @param {ampersand-collection} collection
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-collection-fetch
 */
LocalBackend.prototype.find = function(collection, options, done) {
  var prefix = format('%s/', this.namespace);
  localforage.keys(function(err, keys) {
    if (err) {
      debug('error fetching keys for prefix `%s`:',
        prefix, err);
      return done(err);
    }

    if (keys.length === 0) {
      debug('no keys stored');
      return done(null, []);
    }
    options.ids = [];
    var tasks = _.chain(keys)
      .filter(function(key) {
        return _.startsWith(key, prefix);
      })
      .map(function(key) {
        return localforage.getItem.bind(localforage, key);
      })
      .value();

    if (tasks.length === 0) {
      debug('no keys found for prefix `%s`', prefix);
      return done(null, []);
    }
    debug('fetching `%d` keys...', tasks.length);
    async.parallel(tasks, done);
  });
};

module.exports = LocalBackend;
