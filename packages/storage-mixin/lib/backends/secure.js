var inherits = require('util').inherits;
var BaseBackend = require('./base');
var NullBackend = require('./null');
var async = require('async');
var _ = require('lodash');
var keytar;

try {
  /* eslint no-undef: 0 */
  keytar = window.require('keytar');
} catch (e) {
  console.warn('keytar module not available. `secure` storage engine will '
    + 'fall back to `null` storage engine.');
  keytar = null;
}

var debug = require('debug')('storage-mixin:backends:secure');

function SecureBackend(options) {
  if (!(this instanceof SecureBackend)) {
    return new SecureBackend(options);
  }

  options = _.defaults(options, {
    prefix: 'storage-mixin'
  });

  this.namespace = options.prefix + '/' + options.namespace;
}
inherits(SecureBackend, BaseBackend);


/**
 * Clear the entire namespace. Use with caution!
 *
 * @param {String} namespace
 * @param {Function} done
 */
SecureBackend.clear = function(namespace, done) {
  debug('`clear` not implemented for `secure` storage backend.');
  done();
};

/**
 * Remove the passwords properties for a model from the OS keychain.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-model-destroy
 */
SecureBackend.prototype.remove = function(model, options, done) {
  keytar.deletePassword(this.namespace, this._getId(model));
  done();
};

/**
 * Update the passwords properties for a model in the OS keychain.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-model-save
 */
SecureBackend.prototype.update = function(model, options, done) {
  keytar.replacePassword(this.namespace, this._getId(model),
    JSON.stringify(this.serialize(model)));
  done();
};

/**
 * Add the passwords properties for a model in the OS keychain.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-model-save
 */
SecureBackend.prototype.create = function(model, options, done) {
  keytar.addPassword(this.namespace, this._getId(model),
    JSON.stringify(this.serialize(model)));
  done();
};

/**
 * Load the passwords properties for a model from the OS keychain.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-model-fetch
 */
SecureBackend.prototype.findOne = function(model, options, done) {
  var msg = keytar.getPassword(this.namespace, this._getId(model));
  if (!msg) {
    return done(null, {});
  }
  done(null, JSON.parse(msg));
};

/**
 * Fetch all keys stored under the active namespace.
 *
 * Note: keytar does not have the ability to return all keys for a given
 * namespace (service). Thus this only works if the collection is
 * pre-populated with stub models that hold their ids already.
 *
 * @param {ampersand-collection} collection
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-collection-fetch
 */
SecureBackend.prototype.find = function(collection, options, done) {
  var self = this;

  if (collection.length === 0) {
    return done(null, []);
  }

  var tasks = collection.map(function(model) {
    return self.findOne.bind(self, model, options);
  });

  debug('fetching %d models', tasks.length);
  async.parallel(tasks, done);
};

module.exports = keytar ? SecureBackend : NullBackend;
