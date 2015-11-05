var pick = require('lodash').pick;
var map = require('lodash').map;
var debug = require('debug')('mongodb-compass:models:sync:keychain');
var inherits = require('util').inherits;
var _ = require('lodash');
var Base = require('./base');

var keytar;

try {
  keytar = window.require('keytar');
} catch (e) {
  debug('keytar unavailable!  passwords will not be stored!');
}

/**
 * Securely get, add, replace, and delete passwords via the OS keychain
 * using GitHub's [keytar](http://npm.im/keytar). The OS keychains are:
 *
 * - OSX: Keychain.app
 * - Windows: Credential Vault
 * - Linux: Gnome Keyring
 *
 * @param {String} service - e.g. `com.mongodb.compass`.
 * @class {Keychain}
 * @implements {Base}
 */
function Keychain(service) {
  if (!(this instanceof Keychain)) {
    return new Keychain(service);
  }
  this.service = service;
}
inherits(Keychain, Base);

/**
 * Fetch all passwords stored under the active namespace.
 *
 * @param {ampersand-collection} collection
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-collection-fetch
 */
Keychain.prototype.find = function(collection, options, done) {
  if (!keytar) {
    debug('keytar unavailable');
    return done(null, []);
  }
  var ids = options.ids || [];
  var service = this.service;
  var res = _.map(ids, function(id) {
    return keytar.getPassword(service, id);
  });
  if (!res) {
    debug('nothing found for service `%s`', this.service);
    return done(null, []);
  }
  debug('found `%d` items for service `%s`', res.length, this.service);
  return done(null, map(res, this.deserialize, this));
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
Keychain.prototype.findOne = function(model, options, done) {
  if (!keytar) {
    debug('keytar unavailable');
    return done(null, {});
  }
  var msg = keytar.getPassword(this.service, model.getId());
  if (!msg) {
    return done();
  }
  done(null, this.deserialize(msg));
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
Keychain.prototype.remove = function(model, options, done) {
  if (!keytar) {
    debug('keytar unavailable');
    return done();
  }
  keytar.deletePassword(this.service, model.getId());
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
Keychain.prototype.update = function(model, options, done) {
  if (!keytar) {
    debug('keytar unavailable');
    return done();
  }
  keytar.replacePassword(this.service, model.getId(),
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
Keychain.prototype.create = function(model, options, done) {
  if (!keytar) {
    debug('keytar unavailable');
    return done();
  }
  keytar.addPassword(this.service, model.getId(),
    JSON.stringify(this.serialize(model)));
  done();
};

/**
 * __Only__ property names that contain `password`.
 *
 * @param {ampersand-model} model
 * @return {Object}
 */
Keychain.prototype.serialize = function(model) {
  return pick(model.serialize({
    all: true
  }), function(val, key) {
    return (/password/).test(key);
  });
};

module.exports = Keychain;
