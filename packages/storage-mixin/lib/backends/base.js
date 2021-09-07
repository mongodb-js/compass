var wrapOptions = require('./errback').wrapOptions;
var debug = require('debug')('mongodb-storage-mixin:backends:base');

/**
 * @class {BaseBackend}
 * @interface {BaseBackend} A base interface to extend from to implement
 * storage backends for `ampersand-model` and `ampersand-collection`.
 *
 * @example `./disk.js`
 * @example `./local.js`
 */
function BaseBackend() {
}

/**
 * Clear the entire namespace. Use with caution!
 *
 * @param {Function} done
 */
BaseBackend.prototype.clear = function(done) {
  done(new Error('Not implemented'));
};

/**
 * Returns the id of a model, or a string if model is a string
 * other backends can overwrite this method.
 *
 * @param {ampersand-model} modelOrString
 * @return {Any} id of the model
 */
BaseBackend.prototype._getId = function(modelOrString) {
  if (typeof modelOrString === 'string') {
    return modelOrString;
  }
  return modelOrString.getId();
};

/**
 * Respond to `read` requests for models.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-model-fetch
 */
BaseBackend.prototype.findOne = function(model, options, done) {
  done(new Error('Not implemented'));
};

/**
 * Respond to `create` requests for models.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-model-save
 */
BaseBackend.prototype.create = function(model, options, done) {
  done(new Error('Not implemented'));
};

/**
 * Respond to `update` requests for models.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-model-save
 */
BaseBackend.prototype.update = function(model, options, done) {
  done(new Error('Not implemented'));
};

/**
 * Respond to `delete` requests for models.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-model-destroy
 */
BaseBackend.prototype.remove = function(model, options, done) {
  done(new Error('Not implemented'));
};

/**
 * Respond to `read` requests for collections.
 *
 * @param {ampersand-collection} collection
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-collection-fetch
 */
BaseBackend.prototype.find = function(collection, options, done) {
  done(new Error('Not implemented'));
};

/**
 * Serialize model.
 *
 * @param {ampersand-model}  model
 * @return {Object}
 */
BaseBackend.prototype.serialize = function(model) {
  return model.serialize();
};

/**
 * Deserialize from the backend.
 *
 * @param {JSON}  msg
 * @return {ampersand-model}
 */
BaseBackend.prototype.deserialize = function(msg) {
  return JSON.parse(msg);
};

/**
 * @param {String} method - One of `read`, `create`, `update`, `delete`.
 * @param {Object} model - An instance of `ampersand-model` or `ampersand-collection`.
 * @param {Object} options - @see http://npm.im/ampersand-sync
 * @param {Function} [done] - Optional errback that will handle calling
 * `options.success` or `options.error`.  If not supplied, one will be created
 * automatically.
 *
 * @api private
 * @see http://ampersandjs.com/docs#ampersand-model-sync
 */
BaseBackend.prototype.exec = function(method, model, options, done) {
  done = done || wrapOptions(method, model, options);

  debug('exec', {method: method});
  if (method === 'read') {
    if (model.isCollection) {
      this.find(model, options, done);
    } else {
      this.findOne(model, options, done);
    }
  } else if (method === 'create') {
    this.create(model, options, done);
  } else if (method === 'update') {
    this.update(model, options, done);
  } else if (method === 'delete') {
    this.remove(model, options, done);
  }
};

module.exports = BaseBackend;
