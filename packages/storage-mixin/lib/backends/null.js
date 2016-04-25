var inherits = require('util').inherits;
var BaseBackend = require('./base');

var debug = require('debug')('storage-mixin:backends:null');

function NullBackend(options) {
  if (!(this instanceof NullBackend)) {
    return new NullBackend(options);
  }
  this.namespace = options.namespace;
  debug('Warning: the `null` storage backend does not store any data.');
}
inherits(NullBackend, BaseBackend);


NullBackend.clear = function(namespace, done) {
  done();
};

NullBackend.prototype._done = function(model, options, done) {
  done();
};

/**
 * Point all modifying interface methods to the _done method to simply
 * execute callback successfully.
 */
NullBackend.prototype.remove = NullBackend.prototype._done;
NullBackend.prototype.update = NullBackend.prototype._done;
NullBackend.prototype.create = NullBackend.prototype._done;

/**
 * Return an empty object for read on models
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-collection-fetch
 */
NullBackend.prototype.findOne = function(model, options, done) {
  done(null, {});
};

/**
 * Return an empty array for read on collections
 *
 * @param {ampersand-collection} collection
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-collection-fetch
 */
NullBackend.prototype.find = function(collection, options, done) {
  done(null, []);
};

NullBackend.isNullBackend = true;

module.exports = NullBackend;
