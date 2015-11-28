var inherits = require('util').inherits;
var localforage = require('localforage');
var BaseBackend = require('./base');
var _ = require('lodash');
var async = require('async');

var debug = require('debug')('storage-mixin:backends:local');

// singleton holding all stores keyed by namespace
var globalStores = {};

function LocalBackend(options) {
  if (!(this instanceof LocalBackend)) {
    return new LocalBackend(options);
  }
  options = _.defaults(options, {
    driver: 'INDEXEDDB'
  });

  this.namespace = options.namespace;

  // create one unique store for each namespace
  if (this.namespace in globalStores) {
    this.store = globalStores[this.namespace];
  } else {
    this.store = localforage.createInstance({
      driver: localforage[options.driver],
      name: 'storage-mixin',
      storeName: this.namespace
    });
    globalStores[this.namespace] = this.store;
  }
}
inherits(LocalBackend, BaseBackend);

/**
 * Static function to clear the entire namespace. Use with caution!
 *
 * @param {Function} namespace
 * @param {Function} done
 */
LocalBackend.clear = function(namespace, done) {
  if (namespace in globalStores) {
    globalStores[namespace].clear(done);
  } else {
    done();
  }
};

/**
 * Get the primary key `modelOrKey` is stored under. If key is a string,
 * just return it, otherwise
 *
 * @param {ampersand-model | String} modelOrKey
 * @return {Any}
 *
 * @api private
 */
LocalBackend.prototype._key = function(modelOrKey) {
  return (typeof modelOrKey === 'object') ? modelOrKey.getId() : modelOrKey;
};

/**
 * The `_key` API doesn't support atomic updates
 * so `update` and `create` are the same under the hood.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 * @api private
 */
LocalBackend.prototype._write = function(model, options, done) {
  this.store.setItem(this._key(model), model.serialize(), done);
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
  this.store.getItem(this._key(model), done);
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
  this.store.removeItem(this._key(model), done);
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
  var self = this;

  // var prefix = format('%s/', this.namespace);
  this.store.keys(function(err, keys) {
    if (err) {
      return done(err);
    }

    if (keys.length === 0) {
      debug('no keys found for namespace `%s`', this.namespace);
      return done(null, []);
    }

    var tasks = keys.map(function(key) {
      return self.findOne.bind(self, key, options);
    });
    debug('fetching `%d` keys on namespace `%s`', tasks.length, self.namespace);
    async.parallel(tasks, done);
  });
};

module.exports = LocalBackend;
