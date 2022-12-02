const inherits = require('util').inherits;
const BaseBackend = require('./base');
const _ = require('lodash');
const { createLoggerAndTelemetry } = require('@mongodb-js/compass-logging');
const { debug, mongoLogId, log } = createLoggerAndTelemetry('COMPASS-STORAGE-MIXIN');

function SecureBackend(options) {
  if (!(this instanceof SecureBackend)) {
    return new SecureBackend(options);
  }

  options = _.defaults(options, {
    appName: 'storage-mixin'
  });

  this.namespace = options.appName + '/' + options.namespace;
}
inherits(SecureBackend, BaseBackend);

/**
 * Clear the entire namespace. Use with caution!
 *
 * @param {String} namespace
 * @param {Function} done
 */
SecureBackend.clear = function(namespace, done) {
  var serviceName = `storage-mixin/${namespace}`;
  debug('Clearing all secure values for', serviceName);

  Promise.resolve()
    .then(function() { return require('keytar').findCredentials(serviceName); })
    .catch(function(err) {
      log.error(mongoLogId(1001000175), 'keychain', 'Error calling findCredentials', { err: err.message }); // !dupedLogId
      throw err;
    })
    .then(function(accounts) {
      debug(
        'Found credentials',
        accounts.map(function(credential) {
          return credential.account;
        })
      );
      return Promise.all(
        accounts.map(function(entry) {
          var accountName = entry.account;
          return require('keytar')
            .deletePassword(serviceName, accountName)
            .then(function() {
              debug('Deleted account %s successfully', accountName);
              return accountName;
            })
            .catch(function(err) {
              log.error(mongoLogId(1001000176), 'keychain', 'Error calling deletePassword', { err: err.message }); // !dupedLogId
              debug('Failed to delete', accountName, err);
              throw err;
            });
        })
      );
    })
    .then(function(accountNames) {
      debug(
        'Cleared %d accounts for serviceName %s',
        accountNames.length,
        serviceName,
        accountNames
      );
      done();
    })
    .catch(function(err) {
      debug('Failed to clear credentials!', err);
      done(err);
    });
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
  var accountName = this._getId(model);
  var serviceName = this.namespace;

  require('keytar')
    .deletePassword(serviceName, accountName)
    .then(function() {
      debug('Removed password for', {
        service: serviceName,
        account: accountName
      });
      done();
    })
    .catch(function(err) {
      log.error(mongoLogId(1001000170), 'keychain', 'Error calling deletePassword', { err: err.message }); // !dupedLogId
      done(err);
    });
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
  var serviceName = this.namespace;
  var accountName = this._getId(model);
  var value = JSON.stringify(this.serialize(model));

  require('keytar')
    .setPassword(serviceName, accountName, value)
    .then(function() {
      debug('Updated password successfully for', {
        service: serviceName,
        account: accountName
      });
      done();
    })
    .catch(function(err) {
      log.error(mongoLogId(1001000171), 'keychain', 'Error calling setPassword', { err: err.message }); // !dupedLogId
      done(err);
    });
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
  var serviceName = this.namespace;
  var accountName = this._getId(model);
  var value = JSON.stringify(this.serialize(model));

  require('keytar')
    .setPassword(serviceName, accountName, value)
    .then(function() {
      debug('Successfully dreated password for', {
        service: serviceName,
        account: accountName
      });

      done();
    })
    .catch(function(err) {
      log.error(mongoLogId(1001000172), 'keychain', 'Error calling setPassword', { err: err.message }); // !dupedLogId
      done(err);
    });
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
  var serviceName = this.namespace;
  var accountName = this._getId(model);

  require('keytar')
    .getPassword(serviceName, accountName)
    .then(function(rawJsonString) {
      if (!rawJsonString) {
        debug('findOne failed. No value found', {
          service: serviceName,
          account: accountName
        });

        return done(null, {});
      }
      debug('findOne successful', {
        service: serviceName,
        account: accountName
      });

      done(null, JSON.parse(rawJsonString));
    })
    .catch(function(err) {
      log.error(mongoLogId(1001000173), 'keychain', 'Error calling getPassword', { err: err.message }); // !dupedLogId
      done(err);
    });
};

/**
 * Fetch all keys stored under the active namespace.
 *
 * Note: require('keytar') does not have the ability to return all keys for a given
 * namespace (service). Thus this only works if the collection is
 * pre-populated with stub models that hold their ids already.
 *
 * For merging secure data correctly in the splice backend, we also return
 * the id value again for each object even though that information is not
 * stored as part of the secure data.
 *
 * @param {ampersand-collection} collection
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-collection-fetch
 */
SecureBackend.prototype.find = function(collection, options, done) {
  debug('Fetching data...', collection.length);
  require('keytar')
    .findCredentials(this.namespace)
    .then(function(credentials) {
      var attributes = collection.reduce(function(attrs, model) {
        var modelId = model.getId();
        var credential = credentials.find(function(iteratee) {
          return iteratee.account === modelId;
        });
        var attr = {};
        attr[model.idAttribute] = modelId;
        if (credential) {
          var password = JSON.parse(credential.password);
          _.assign(attr, password);
        }
        attrs.push(attr);
        return attrs;
      }, []);
      return (done(null, attributes));
    })
    .catch(function(err) {
      log.error(mongoLogId(1001000174), 'keychain', 'Error calling findCredentials', { err: err.message }); // !dupedLogId
      done(err);
    });
};

module.exports = SecureBackend;
