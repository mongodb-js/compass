/**
 * The backend for storing Connection config data.
 *
 * @return {Object} sync mixin that uses http://npm.im/localforage
 */

var _ = require('lodash');
var async = require('async');
var localforage = require('localforage');
var keytar = window.require('keytar');
var debug = require('debug')('mongodb-compass:models:connection-sync');
var app = require('ampersand-app');
var util = require('util');

function createErrback(method, model, options) {
  return function(err, res) {
    debug('method: %s returned', method, err, res);
    if (options.success) {
      options.success(res);
    } else if (options.error) {
      options.error(err);
    }
  };
}

/**
 * @interface {Store} A base interface to extend from to implement
 * storage backends for `ampersand-model` and `ampersand-collection`.
 * @see http://npm.im/ampersand-sync
 */
function Store() {
}

/**
 * @param {String} method - One of `read`, `create`, `update`, `delete`.
 * @param {Object} model - An instance of `ampersand-model` or `ampersand-collection`.
 * @param {Object} options - @see http://npm.im/ampersand-sync
 * @param {Function} [done] - Optional errback that will handle calling
 * `options.success` or `options.error`.  If not supplied, one will be created
 * automatically.  This allows
 */
Store.prototype.exec = function(method, model, options, done) {
  if (!done) {
    done = createErrback(method, model, options);
  }

  debug('exec', {
    method: method,
    model: model,
    options: options
  });

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
    this.destroy(model, options, done);
  }
};

/**
 * method=create
 */
Store.prototype.create = function(model, done) {
  return done(new Error('Not implemented'));
};

/**
 * method=update
 */
Store.prototype.update = function(model, done) {
  return done(new Error('Not implemented'));
};

/**
 * method=delete
 */
Store.prototype.remove = function(model, done) {
  return done(new Error('Not implemented'));
};

/**
 * method=read
 */
Store.prototype.findOne = function(model, done) {
  return done(new Error('Not implemented'));
};

/**
 * method=read && model.isCollection
 */
Store.prototype.find = function(model, done) {
  return done(new Error('Not implemented'));
};

Store.prototype.serialize = function(model) {
  return model.serialize({
    all: true
  });
};

Store.prototype.deserialize = function(msg) {
  return JSON.parse(msg);
};

function LocalforageStore(namespace) {
  this.namespace = namespace;
}
util.inherits(LocalforageStore, Store);

LocalforageStore.prototype._key = function(model) {
  if (model.isCollection) {
    return this.namespace;
  }
  return format('%s/%s', this.namespace, model.getId());
};

LocalforageStore.prototype.find = function(model, done) {
  var prefix = format('%s/', this.namespace);
  localforage.keys(function(err, keys) {
    if (err) {
      return done(err);
    }
    var tasks = _.chain(keys)
      .filter(function(key) {
        return _.startsWith(key, prefix);
      })
      .map(function(key) {
        return localforage.getItem.bind(null, key);
      })
      .value();

    if (tasks.length === 0) {
      return done(null, []);
    }
    async.parallel(tasks, done);
  });
};
//
LocalforageStore.prototype.findOne = function(model, done) {
  localforage.getItem(this._key(model), done);
};

LocalforageStore.prototype.remove = function(model, done) {
  localforage.removeItem(this._key(model), done);
};

LocalforageStore.prototype._write = function(model, done) {
  localforage.setItem(this._key(model), this.serialize(model.toJSON()), done);
};

LocalforageStore.prototype.update = function(model, done) {
  this._write(model, done);
};

LocalforageStore.prototype.create = function(model, done) {
  this._write(model, done);
};

/**
 * Exclude property names that contain `password`.
 *
 * @param {Object} model
 * @return {Object}
 */
LocalforageStore.prototype.serialize = function(model) {
  return _.omit(model.serialize({
    all: true
  }), function(val, key) {
    return (/password/).test(key);
  });
};

/**
 * @param {String} service - e.g. `com.mongodb.compass`.
 */
function KeychainStore(service) {
  this.service = service;
}

util.inherits(KeychainStore, Store);

KeychainStore.prototype.find = function(model, done) {
  return done(null, keytar.findPassword(this.service));
};

KeychainStore.prototype.findOne = function(model, done) {
  var msg = keytar.getPassword(this.service, model.getId());
  if (!msg) {
    return done();
  }
  done(null, JSON.parse(msg));
};

KeychainStore.prototype.remove = function(model, done) {
  keytar.removePassword(this.service, model.getId());
  done();
};

KeychainStore.prototype.update = function(model, done) {
  keytar.replacePassword(this.service, model.getId(),
    JSON.stringify(this.serialize(model)));
  done();
};

KeychainStore.prototype.create = function(model, done) {
  keytar.addPassword(this.service, model.getId(),
    JSON.stringify(this.serialize(model)));
  done();
};

/**
 * __Only__ property names that contain `password`.
 *
 * @param {Object} model
 * @return {Object}
 */
KeychainStore.prototype.serialize = function(model) {
  return _.pick(model.serialize({
    all: true
  }), function(val, key) {
    return (/password/).test(key);
  });
};

/**
 * Each store is a singleton.
 */
var stores = {
  metadata: new LocalforageStore('com.mongodb.compass.connection')
  // keychain: new KeychainStore('com.mongodb.compass.connection')
};

function keychain(method, model, options) {
  var done = createErrback(options);

  async.series([
    stores.metadata.exec.bind(stores.metadata, method, model, options),
    stores.keychain.exec.bind(stores.keychain, method, model, options)
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

    // If this was a `findOne`, we'll
    // want to merge any password data into the
    // metadata to populate our model with.
    var metadata = res[0];
    _.assign(metadata, res[1]);
    debug('merged result is', metadata);
    done(null, metadata);
  });
}

var sync = require('ampersand-sync-localforage');
module.exports = function() {
  if (app.isFeatureEnabled('keychain')) {
    return keychain('com.mongodb.compass.connection');
  }
  return sync('com.mongodb.compass.connection');
}
