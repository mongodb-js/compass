var createErrback = require('./create-errback');
// var debug = require('debug')('storage-mixin:sync:base');

/**
 * @class {Base}
 * @interface {Base} A base interface to extend from to implement
 * storage backends for `ampersand-model` and `ampersand-collection`.
 *
 * @example `./disk.js`
 * @example `./local.js`
 */
function Base() {
}

/**
 * Respond to `read` requests for models.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-model-fetch
 */
Base.prototype.findOne = function(model, options, done) {
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
Base.prototype.create = function(model, options, done) {
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
Base.prototype.update = function(model, options, done) {
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
Base.prototype.remove = function(model, options, done) {
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
Base.prototype.find = function(collection, options, done) {
  done(new Error('Not implemented'));
};


/**
 * Prepare a model for persistence.
 *
 * @param {ampersand-model} model
 */
// Base.prototype.serialize = function(model) {
//   return model.serialize({
//     all: true
//   });
// };

/**
 * Deserialize from the backend.
 *
 * @param {JSON}  msg
 * @return {ampersand-model}
 */
Base.prototype.deserialize = function(msg) {
  return JSON.parse(msg);
};

/**
 * @param {String} method - One of `read`, `create`, `update`, `delete`.
 * @param {Object} model - An instance of `ampersand-model` or `ampersand-collection`.
 * @param {Object} options - @see http://npm.im/ampersand-sync
 * @param {Function} [done] - Optional errback that will handle calling
 * `options.success` or `options.error`.  If not supplied, one will be created
 * automatically.
 * @api private
 * @see http://ampersandjs.com/docs#ampersand-model-sync
 */
Base.prototype.exec = function(method, model, options, done) {
  if (!done) {
    done = createErrback(method, model, options);
  }

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

module.exports = Base;
