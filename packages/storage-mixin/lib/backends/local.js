var inherits = require('util').inherits;
var BaseBackend = require('./base');
var NullBackend = require('./null');
var _ = require('lodash');
var async = require('async');
var localforage = require('localforage');
var debug = require('debug')('mongodb-storage-mixin:backends:local');

// singleton holding all stores keyed by namespace
var globalStores = {};

function LocalBackend(options) {
  if (!(this instanceof LocalBackend)) {
    return new LocalBackend(options);
  }
  options = _.defaults(options, {
    appName: 'storage-mixin',
    driver: 'INDEXEDDB'
  });

  this.namespace = options.namespace;

  // create one unique store for each namespace
  if (this.namespace in globalStores) {
    this.store = globalStores[this.namespace];
  } else {
    this.store = localforage.createInstance({
      driver: localforage[options.driver],
      name: options.appName,
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
    debug('Clearing store for', namespace);
    globalStores[namespace].clear(done);
  } else {
    done();
  }
};

/**
 * The `_getId` API doesn't support atomic updates
 * so `update` and `create` are the same under the hood.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 * @api private
 */
LocalBackend.prototype._write = function(model, options, done) {
  this.store.setItem(this._getId(model), this.serialize(model), done);
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
  const id = this._getId(model);
  this.store.getItem(id, (err, data) => {
    if (err) {
      done(err);
      return;
    }
    if (!data) {
      debug(`Can't find model with id ${id}`);
      // We don't want to error out here, if something is not found in local
      // backend, return an empty object as if there are just no "options"
      // stored (we need to return an object, otherwise ampersand blows up)
      data = {};
    }
    done(null, data);
  });
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
  this.store.removeItem(this._getId(model), done);
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
      debug('no keys found for namespace `%s`', self.namespace);
      return done(null, []);
    }

    var tasks = keys.map(function(key) {
      return self.findOne.bind(self, key, options);
    });
    debug('fetching `%d` keys on namespace `%s`', tasks.length, self.namespace);
    async.parallel(tasks, done);
  });
};

module.exports = typeof window !== 'undefined' ? LocalBackend : NullBackend;
